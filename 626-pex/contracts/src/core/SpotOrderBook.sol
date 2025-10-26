// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "../interfaces/ISpotOrderBook.sol";
import "../interfaces/ISpotMarket.sol";

/**
 * @title SpotOrderBook
 * @notice On-chain order book for spot trading pairs with token escrow
 */
contract SpotOrderBook is ISpotOrderBook, ReentrancyGuard {
    using Counters for Counters.Counter;

    Counters.Counter private _orderIdCounter;
    ISpotMarket public spotMarket;

    mapping(uint256 => Order) public orders;
    mapping(address => uint256[]) public traderOrders;
    mapping(uint256 => uint256[]) public marketBuyOrders; // marketId => orderIds
    mapping(uint256 => uint256[]) public marketSellOrders; // marketId => orderIds

    constructor(address _spotMarket) {
        spotMarket = ISpotMarket(_spotMarket);
    }

    function _transferNative(address to, uint256 amount) internal {
        (bool ok, ) = payable(to).call{value: amount}("");
        require(ok, "ETH transfer failed");
    }

    function placeOrder(
        uint256 marketId,
        OrderType orderType,
        OrderSide side,
        uint256 size,
        uint256 price
    ) external payable nonReentrant returns (uint256 orderId) {
        require(size > 0, "Invalid size");
        if (orderType == OrderType.LIMIT) {
            require(price > 0, "Invalid price");
        }
        require(spotMarket.isMarketActive(marketId), "Market inactive");

        ISpotMarket.Market memory m = spotMarket.getMarket(marketId);
        address base = m.baseToken;
        address quote = m.quoteToken;
        uint8 baseDec = m.baseDecimals;
        uint8 quoteDec = m.quoteDecimals;

        _orderIdCounter.increment();
        orderId = _orderIdCounter.current();

        Order storage order = orders[orderId];
        order.id = orderId;
        order.trader = msg.sender;
        order.marketId = marketId;
        order.orderType = orderType;
        order.side = side;
        order.size = size;
        order.price = price;
        order.filledSize = 0;
        order.timestamp = block.timestamp;
        order.status = OrderStatus.PENDING;

        traderOrders[msg.sender].push(orderId);

        if (side == OrderSide.BUY) {
            marketBuyOrders[marketId].push(orderId);
            // For MARKET buy, reserve using current best ask price to ensure funds are sufficient
            uint256 requiredQuote;
            if (orderType == OrderType.MARKET) {
                uint256 bestAsk = _getBestAskPrice(marketId);
                require(bestAsk > 0, "no liquidity");
                requiredQuote = _sizePriceToQuote(size, bestAsk, quoteDec);
            } else {
                requiredQuote = _sizePriceToQuote(size, price, quoteDec);
            }
            if (m.quoteIsNative) {
                require(msg.value == requiredQuote, "wrong msg.value");
                order.reservedQuote = requiredQuote;
            } else {
                IERC20(quote).transferFrom(msg.sender, address(this), requiredQuote);
                order.reservedQuote = requiredQuote;
            }
        } else {
            marketSellOrders[marketId].push(orderId);
            uint256 requiredBase = _toTokenDecimals(size, baseDec);
            if (m.baseIsNative) {
                require(msg.value == requiredBase, "wrong msg.value");
                order.reservedBase = requiredBase;
            } else {
                IERC20(base).transferFrom(msg.sender, address(this), requiredBase);
                order.reservedBase = requiredBase;
            }
        }

        emit OrderPlaced(orderId, msg.sender, marketId, orderType, side, size, price);

        // Try immediate matching for MARKET orders and for LIMIT orders if crossable
        if (orderType == OrderType.MARKET) {
            _attemptMatching(orderId);
        } else {
            if (side == OrderSide.BUY) {
                _attemptMatching(orderId);
            } else {
                _attemptMatching(orderId);
            }
        }
    }

    function cancelOrder(uint256 orderId) external nonReentrant {
        Order storage order = orders[orderId];
        require(order.trader == msg.sender, "Not owner");
        require(order.status == OrderStatus.PENDING || order.status == OrderStatus.PARTIALLY_FILLED, "Cannot cancel");

        ISpotMarket.Market memory m = spotMarket.getMarket(order.marketId);
        address base = m.baseToken;
        address quote = m.quoteToken;

        order.status = OrderStatus.CANCELLED;

        if (order.reservedBase > 0) {
            if (m.baseIsNative) {
                _transferNative(order.trader, order.reservedBase);
            } else {
                IERC20(base).transfer(order.trader, order.reservedBase);
            }
            order.reservedBase = 0;
        }
        if (order.reservedQuote > 0) {
            if (m.quoteIsNative) {
                _transferNative(order.trader, order.reservedQuote);
            } else {
                IERC20(quote).transfer(order.trader, order.reservedQuote);
            }
            order.reservedQuote = 0;
        }

        emit OrderCancelled(orderId, msg.sender, order.marketId);
    }

    function getOrder(uint256 orderId) external view returns (Order memory) {
        return orders[orderId];
    }

    function getOrdersByTrader(address trader) external view returns (uint256[] memory) {
        return traderOrders[trader];
    }

    function _attemptMatching(uint256 orderId) internal {
        Order storage taker = orders[orderId];
        if (taker.status != OrderStatus.PENDING) return;

        ISpotMarket.Market memory m = spotMarket.getMarket(taker.marketId);
        address base = m.baseToken;
        address quote = m.quoteToken;
        uint8 baseDec = m.baseDecimals;
        uint8 quoteDec = m.quoteDecimals;

        if (taker.side == OrderSide.BUY) {
            uint256[] storage asks = marketSellOrders[taker.marketId];
            uint256 remaining = taker.size - taker.filledSize;
            for (uint256 i = 0; i < asks.length && remaining > 0; i++) {
                Order storage maker = orders[asks[i]];
                // allow matching with both PENDING and PARTIALLY_FILLED maker orders
                if (maker.status == OrderStatus.CANCELLED || maker.status == OrderStatus.FILLED) continue;
                // For MARKET orders, ignore price cross check; LIMIT orders must be crossable
                if (taker.orderType == OrderType.LIMIT && maker.price > taker.price) continue;

                uint256 available = maker.size - maker.filledSize;
                uint256 fillSize = available < remaining ? available : remaining;
                // compute amounts
                uint256 baseAmount = _toTokenDecimals(fillSize, baseDec);
                uint256 quoteAmount = _sizePriceToQuote(fillSize, maker.price, quoteDec);

                // transfers: base from seller(maker) reserved to buyer(taker)
                require(maker.reservedBase >= baseAmount, "seller reserve");
                maker.reservedBase -= baseAmount;
                if (m.baseIsNative) {
                    _transferNative(taker.trader, baseAmount);
                } else {
                    IERC20(base).transfer(taker.trader, baseAmount);
                }

                // transfers: quote from buyer(taker) reserved to seller(maker)
                require(taker.reservedQuote >= quoteAmount, "buyer reserve");
                taker.reservedQuote -= quoteAmount;
                if (m.quoteIsNative) {
                    _transferNative(maker.trader, quoteAmount);
                } else {
                    IERC20(quote).transfer(maker.trader, quoteAmount);
                }

                // update filled sizes
                maker.filledSize += fillSize;
                taker.filledSize += fillSize;

                emit OrderFilled(maker.id, maker.trader, maker.marketId, fillSize, maker.price, block.timestamp);
                emit OrderFilled(taker.id, taker.trader, taker.marketId, fillSize, maker.price, block.timestamp);

                remaining = taker.size - taker.filledSize;

                if (maker.filledSize == maker.size) {
                    maker.status = OrderStatus.FILLED;
                    // leftover reserves for maker should be zero by construction
                } else {
                    maker.status = OrderStatus.PARTIALLY_FILLED;
                }
            }

            if (taker.filledSize == taker.size) {
                taker.status = OrderStatus.FILLED;
                // refund any leftover quote (due to price improvement)
                if (taker.reservedQuote > 0) {
                    if (m.quoteIsNative) {
                        _transferNative(taker.trader, taker.reservedQuote);
                    } else {
                        IERC20(quote).transfer(taker.trader, taker.reservedQuote);
                    }
                    taker.reservedQuote = 0;
                }
            } else if (taker.filledSize > 0) {
                taker.status = OrderStatus.PARTIALLY_FILLED;
            }
        } else {
            // taker is SELL
            uint256[] storage bids = marketBuyOrders[taker.marketId];
            uint256 remaining = taker.size - taker.filledSize;
            for (uint256 i = 0; i < bids.length && remaining > 0; i++) {
                Order storage maker = orders[bids[i]];
                // allow matching with both PENDING and PARTIALLY_FILLED maker orders
                if (maker.status == OrderStatus.CANCELLED || maker.status == OrderStatus.FILLED) continue;
                // For MARKET orders, ignore price cross check; LIMIT orders must be crossable
                if (taker.orderType == OrderType.LIMIT && maker.price < taker.price) continue;

                uint256 available = maker.size - maker.filledSize;
                uint256 fillSize = available < remaining ? available : remaining;
                uint256 baseAmount = _toTokenDecimals(fillSize, baseDec);
                uint256 quoteAmount = _sizePriceToQuote(fillSize, maker.price, quoteDec);

                // base from seller(taker) reserved to buyer(maker)
                require(taker.reservedBase >= baseAmount, "seller reserve");
                taker.reservedBase -= baseAmount;
                if (m.baseIsNative) {
                    _transferNative(maker.trader, baseAmount);
                } else {
                    IERC20(base).transfer(maker.trader, baseAmount);
                }

                // quote from buyer(maker) reserved to seller(taker)
                require(maker.reservedQuote >= quoteAmount, "buyer reserve");
                maker.reservedQuote -= quoteAmount;
                if (m.quoteIsNative) {
                    _transferNative(taker.trader, quoteAmount);
                } else {
                    IERC20(quote).transfer(taker.trader, quoteAmount);
                }

                maker.filledSize += fillSize;
                taker.filledSize += fillSize;

                emit OrderFilled(maker.id, maker.trader, maker.marketId, fillSize, maker.price, block.timestamp);
                emit OrderFilled(taker.id, taker.trader, taker.marketId, fillSize, maker.price, block.timestamp);

                remaining = taker.size - taker.filledSize;

                if (maker.filledSize == maker.size) {
                    maker.status = OrderStatus.FILLED;
                    if (maker.reservedQuote > 0) {
                        // refund leftover quote due to price improvement
                        if (m.quoteIsNative) {
                            _transferNative(maker.trader, maker.reservedQuote);
                        } else {
                            IERC20(quote).transfer(maker.trader, maker.reservedQuote);
                        }
                        maker.reservedQuote = 0;
                    }
                } else {
                    maker.status = OrderStatus.PARTIALLY_FILLED;
                }
            }

            if (taker.filledSize == taker.size) {
                taker.status = OrderStatus.FILLED;
                // leftover base should be zero by construction for fully filled sell
            } else if (taker.filledSize > 0) {
                taker.status = OrderStatus.PARTIALLY_FILLED;
            }
        }
    }

    function _toTokenDecimals(uint256 amount18, uint8 decimals) internal pure returns (uint256) {
        if (decimals == 18) return amount18;
        if (decimals > 18) return amount18 * (10 ** (decimals - 18));
        return amount18 / (10 ** (18 - decimals));
    }

    function _sizePriceToQuote(uint256 size18, uint256 price18, uint8 quoteDecimals) internal pure returns (uint256) {
        uint256 prod = size18 * price18; // 36 decimals
        uint256 value18 = prod / 1e18;   // 18 decimals
        return _toTokenDecimals(value18, quoteDecimals);
    }

    // Find current best ask price among pending SELL orders for a market
    function _getBestAskPrice(uint256 marketId) internal view returns (uint256) {
        uint256[] storage asks = marketSellOrders[marketId];
        uint256 best = 0;
        for (uint256 i = 0; i < asks.length; i++) {
            Order storage o = orders[asks[i]];
            // consider active orders: PENDING or PARTIALLY_FILLED
            if (o.status == OrderStatus.CANCELLED || o.status == OrderStatus.FILLED) continue;
            if (best == 0 || o.price < best) {
                best = o.price;
            }
        }
        return best;
    }
}