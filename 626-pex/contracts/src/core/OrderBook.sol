// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "../interfaces/IOrderBook.sol";
import "../interfaces/IPerpMarket.sol";
import "../interfaces/IMarginVault.sol";

/**
 * @title OrderBook
 * @notice Manages limit and market orders with on-chain matching
 */
contract OrderBook is IOrderBook, ReentrancyGuard, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _orderIdCounter;
    
    IPerpMarket public perpMarket;
    IMarginVault public marginVault;

    // Storage
    mapping(uint256 => Order) public orders;
    mapping(address => uint256[]) public traderOrders;
    mapping(uint256 => uint256[]) public marketBuyOrders; // marketId => orderIds
    mapping(uint256 => uint256[]) public marketSellOrders; // marketId => orderIds
    
    // Price level mappings for efficient orderbook management
    mapping(uint256 => mapping(uint256 => uint256[])) public priceLevelOrders; // marketId => price => orderIds
    mapping(uint256 => uint256[]) public marketPriceLevels; // marketId => sorted price levels

    uint256 public constant MAX_ORDERS_PER_BATCH = 50;
    uint256 public constant PRICE_PRECISION = 1e8;

    modifier onlyActiveMarket(uint256 marketId) {
        require(perpMarket.getMarket(marketId).isActive, "Market not active");
        _;
    }

    modifier onlyOrderOwner(uint256 orderId) {
        require(orders[orderId].trader == msg.sender, "Not order owner");
        _;
    }

    constructor(address _perpMarket, address _marginVault) {
        perpMarket = IPerpMarket(_perpMarket);
        marginVault = IMarginVault(_marginVault);
    }

    /**
     * @notice Place a new order
     */
    function placeOrder(
        uint256 marketId,
        OrderType orderType,
        OrderSide side,
        uint256 size,
        uint256 price,
        uint256 leverage
    ) external nonReentrant onlyActiveMarket(marketId) returns (uint256 orderId) {
        require(size > 0, "Invalid size");
        require(leverage > 0 && leverage <= 100, "Invalid leverage");
        
        if (orderType == OrderType.LIMIT) {
            require(price > 0, "Invalid price for limit order");
        }

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
        order.leverage = leverage;

        // Add to trader's orders
        traderOrders[msg.sender].push(orderId);

        // Add to market orders
        if (side == OrderSide.BUY) {
            marketBuyOrders[marketId].push(orderId);
        } else {
            marketSellOrders[marketId].push(orderId);
        }

        // Add to price level if limit order
        if (orderType == OrderType.LIMIT) {
            _addToPriceLevel(marketId, price, orderId);
        }

        emit OrderPlaced(orderId, msg.sender, marketId, orderType, side, size, price, leverage);

        // Try to match immediately
        if (orderType == OrderType.MARKET || _shouldAttemptMatching(marketId, side, price)) {
            _attemptMatching(orderId);
        }

        return orderId;
    }

    /**
     * @notice Cancel an existing order
     */
    function cancelOrder(uint256 orderId) external nonReentrant onlyOrderOwner(orderId) {
        Order storage order = orders[orderId];
        require(order.status == OrderStatus.PENDING || order.status == OrderStatus.PARTIALLY_FILLED, 
                "Cannot cancel order");

        order.status = OrderStatus.CANCELLED;

        // Remove from price level
        if (order.orderType == OrderType.LIMIT) {
            _removeFromPriceLevel(order.marketId, order.price, orderId);
        }

        emit OrderCancelled(orderId, msg.sender, order.marketId);
    }

    /**
     * @notice Match orders for a specific market
     */
    function matchOrders(uint256 marketId) external nonReentrant returns (uint256 matchedVolume) {
        return _matchMarketOrders(marketId);
    }

    /**
     * @notice Get order details
     */
    function getOrder(uint256 orderId) external view returns (Order memory) {
        return orders[orderId];
    }

    /**
     * @notice Get orders by trader
     */
    function getOrdersByTrader(address trader) external view returns (uint256[] memory) {
        return traderOrders[trader];
    }

    /**
     * @notice Get orderbook levels
     */
    function getOrderBook(uint256 marketId, uint256 depth) 
        external view returns (
            OrderBookLevel[] memory bids,
            OrderBookLevel[] memory asks
        ) {
        return _buildOrderBook(marketId, depth);
    }

    /**
     * @notice Get best bid price and size
     */
    function getBestBid(uint256 marketId) external view returns (uint256 price, uint256 size) {
        uint256[] memory buyOrders = marketBuyOrders[marketId];
        uint256 bestPrice = 0;
        uint256 totalSize = 0;

        for (uint256 i = 0; i < buyOrders.length; i++) {
            Order memory order = orders[buyOrders[i]];
            if (order.status == OrderStatus.PENDING && order.price > bestPrice) {
                bestPrice = order.price;
            }
        }

        if (bestPrice > 0) {
            uint256[] memory levelOrders = priceLevelOrders[marketId][bestPrice];
            for (uint256 i = 0; i < levelOrders.length; i++) {
                Order memory order = orders[levelOrders[i]];
                if (order.status == OrderStatus.PENDING) {
                    totalSize += (order.size - order.filledSize);
                }
            }
        }

        return (bestPrice, totalSize);
    }

    /**
     * @notice Get best ask price and size
     */
    function getBestAsk(uint256 marketId) external view returns (uint256 price, uint256 size) {
        uint256[] memory sellOrders = marketSellOrders[marketId];
        uint256 bestPrice = type(uint256).max;
        uint256 totalSize = 0;

        for (uint256 i = 0; i < sellOrders.length; i++) {
            Order memory order = orders[sellOrders[i]];
            if (order.status == OrderStatus.PENDING && order.price < bestPrice) {
                bestPrice = order.price;
            }
        }

        if (bestPrice < type(uint256).max) {
            uint256[] memory levelOrders = priceLevelOrders[marketId][bestPrice];
            for (uint256 i = 0; i < levelOrders.length; i++) {
                Order memory order = orders[levelOrders[i]];
                if (order.status == OrderStatus.PENDING) {
                    totalSize += (order.size - order.filledSize);
                }
            }
        }

        return (bestPrice == type(uint256).max ? 0 : bestPrice, totalSize);
    }

    /**
     * @notice Get spread
     */
    function getSpread(uint256 marketId) external view returns (uint256 spread) {
        (uint256 bidPrice,) = this.getBestBid(marketId);
        (uint256 askPrice,) = this.getBestAsk(marketId);
        
        if (bidPrice > 0 && askPrice > 0) {
            spread = askPrice - bidPrice;
        }
        
        return spread;
    }

    /**
     * @notice Get total order count
     */
    function getOrderCount() external view returns (uint256) {
        return _orderIdCounter.current();
    }

    /**
     * @notice Get market order count
     */
    function getMarketOrderCount(uint256 marketId) external view returns (uint256) {
        return marketBuyOrders[marketId].length + marketSellOrders[marketId].length;
    }

    // Internal Functions

    function _attemptMatching(uint256 orderId) internal {
        Order storage order = orders[orderId];
        
        if (order.orderType == OrderType.MARKET) {
            _executeMarketOrder(orderId);
        } else {
            _executeLimitOrder(orderId);
        }
    }

    function _executeMarketOrder(uint256 orderId) internal {
        Order storage order = orders[orderId];
        uint256 remainingSize = order.size - order.filledSize;
        
        uint256[] storage oppositeOrders = order.side == OrderSide.BUY ? 
            marketSellOrders[order.marketId] : marketBuyOrders[order.marketId];

        for (uint256 i = 0; i < oppositeOrders.length && remainingSize > 0; i++) {
            uint256 matchOrderId = oppositeOrders[i];
            Order storage matchOrder = orders[matchOrderId];
            
            if (matchOrder.status != OrderStatus.PENDING) continue;
            
            uint256 matchSize = _min(remainingSize, matchOrder.size - matchOrder.filledSize);
            uint256 matchPrice = matchOrder.price;
            
            if (order.side == OrderSide.BUY) {
                _executeTrade(orderId, matchOrderId, matchSize, matchPrice);
            } else {
                _executeTrade(matchOrderId, orderId, matchSize, matchPrice);
            }
            remainingSize -= matchSize;
        }

        if (order.filledSize == order.size) {
            order.status = OrderStatus.FILLED;
        } else if (order.filledSize > 0) {
            order.status = OrderStatus.PARTIALLY_FILLED;
        }
    }

    function _executeLimitOrder(uint256 orderId) internal {
        Order storage order = orders[orderId];
        uint256 remainingSize = order.size - order.filledSize;
        
        uint256[] storage oppositeOrders = order.side == OrderSide.BUY ? 
            marketSellOrders[order.marketId] : marketBuyOrders[order.marketId];

        for (uint256 i = 0; i < oppositeOrders.length && remainingSize > 0; i++) {
            uint256 matchOrderId = oppositeOrders[i];
            Order storage matchOrder = orders[matchOrderId];
            
            if (matchOrder.status != OrderStatus.PENDING) continue;
            
            bool canMatch = order.side == OrderSide.BUY ? 
                order.price >= matchOrder.price : order.price <= matchOrder.price;
                
            if (!canMatch) continue;
            
            uint256 matchSize = _min(remainingSize, matchOrder.size - matchOrder.filledSize);
            uint256 matchPrice = matchOrder.price; // Price discovery: use maker's price
            
            if (order.side == OrderSide.BUY) {
                _executeTrade(orderId, matchOrderId, matchSize, matchPrice);
            } else {
                _executeTrade(matchOrderId, orderId, matchSize, matchPrice);
            }
            remainingSize -= matchSize;
        }

        if (order.filledSize == order.size) {
            order.status = OrderStatus.FILLED;
        } else if (order.filledSize > 0) {
            order.status = OrderStatus.PARTIALLY_FILLED;
        }
    }

    function _executeTrade(uint256 buyOrderId, uint256 sellOrderId, uint256 size, uint256 price) internal {
        Order storage buyOrder = orders[buyOrderId];
        Order storage sellOrder = orders[sellOrderId];

        // 事前校验：计算双方所需 USDC 保证金并检查可用余额
        uint256 notional = (size * price) / 1e18;
        uint256 reqUsdcBuyer = (notional / buyOrder.leverage) / 1e12;
        uint256 reqUsdcSeller = (notional / sellOrder.leverage) / 1e12;

        uint256 availBuyer = marginVault.calculateAvailableBalance(buyOrder.trader);
        uint256 availSeller = marginVault.calculateAvailableBalance(sellOrder.trader);

        if (availBuyer < reqUsdcBuyer || availSeller < reqUsdcSeller) {
            emit PrecheckFailed(
                buyOrderId,
                sellOrderId,
                buyOrder.marketId,
                size,
                price,
                buyOrder.trader,
                sellOrder.trader,
                reqUsdcBuyer,
                availBuyer,
                reqUsdcSeller,
                availSeller
            );
            return;
        }

        // 更新成交数量
        buyOrder.filledSize += size;
        sellOrder.filledSize += size;

        // 更新订单状态
        if (buyOrder.filledSize == buyOrder.size) {
            buyOrder.status = OrderStatus.FILLED;
        } else {
            buyOrder.status = OrderStatus.PARTIALLY_FILLED;
        }

        if (sellOrder.filledSize == sellOrder.size) {
            sellOrder.status = OrderStatus.FILLED;
        } else {
            sellOrder.status = OrderStatus.PARTIALLY_FILLED;
        }

        // 事件：成交与撮合
        emit OrderFilled(buyOrderId, buyOrder.trader, buyOrder.marketId, size, price, block.timestamp);
        emit OrderFilled(sellOrderId, sellOrder.trader, sellOrder.marketId, size, price, block.timestamp);
        emit OrderMatched(buyOrderId, sellOrderId, buyOrder.marketId, size, price, buyOrder.trader, sellOrder.trader);

        // 开仓尝试：买方 LONG，卖方 SHORT。失败则发出 PositionOpenFailed 事件
        try perpMarket.openPositionFor(
            buyOrder.trader,
            buyOrder.marketId,
            IPerpMarket.PositionSide.LONG,
            size,
            buyOrder.leverage,
            price
        ) {
            // ok
        } catch {
            emit PositionOpenFailed(
                buyOrder.trader,
                buyOrder.marketId,
                uint8(IPerpMarket.PositionSide.LONG),
                size,
                buyOrder.leverage,
                price
            );
        }

        try perpMarket.openPositionFor(
            sellOrder.trader,
            sellOrder.marketId,
            IPerpMarket.PositionSide.SHORT,
            size,
            sellOrder.leverage,
            price
        ) {
            // ok
        } catch {
            emit PositionOpenFailed(
                sellOrder.trader,
                sellOrder.marketId,
                uint8(IPerpMarket.PositionSide.SHORT),
                size,
                sellOrder.leverage,
                price
            );
        }
    }

    function _matchMarketOrders(uint256 marketId) internal returns (uint256 matchedVolume) {
        // Implementation for batch matching
        // This is a simplified version - production would use more sophisticated matching
        return 0;
    }

    function _buildOrderBook(uint256 marketId, uint256 depth) 
        internal view returns (
            OrderBookLevel[] memory bids,
            OrderBookLevel[] memory asks
        ) {
        // Allocate result arrays
        bids = new OrderBookLevel[](depth);
        asks = new OrderBookLevel[](depth);

        // Gather all price levels for the market
        uint256[] memory priceLevels = marketPriceLevels[marketId];
        uint256 levelsLen = priceLevels.length;
        if (levelsLen == 0) {
            return (bids, asks);
        }

        // Temporary candidate arrays (max length = number of price levels)
        OrderBookLevel[] memory bidCandidates = new OrderBookLevel[](levelsLen);
        uint256 bidCount = 0;
        OrderBookLevel[] memory askCandidates = new OrderBookLevel[](levelsLen);
        uint256 askCount = 0;

        // Aggregate remaining sizes by price level, split by side
        for (uint256 i = 0; i < levelsLen; i++) {
            uint256 price = priceLevels[i];
            uint256[] memory levelOrders = priceLevelOrders[marketId][price];

            uint256 buyTotal = 0;
            uint256 buyOrdersCount = 0;
            uint256 sellTotal = 0;
            uint256 sellOrdersCount = 0;

            for (uint256 j = 0; j < levelOrders.length; j++) {
                Order memory o = orders[levelOrders[j]];
                // Only include limit orders with remaining size and active status
                if (o.orderType != OrderType.LIMIT) continue;
                if (o.status != OrderStatus.PENDING && o.status != OrderStatus.PARTIALLY_FILLED) continue;
                if (o.price != price) continue; // safety

                uint256 remaining = o.size > o.filledSize ? (o.size - o.filledSize) : 0;
                if (remaining == 0) continue;

                if (o.side == OrderSide.BUY) {
                    buyTotal += remaining;
                    buyOrdersCount += 1;
                } else {
                    sellTotal += remaining;
                    sellOrdersCount += 1;
                }
            }

            if (buyTotal > 0) {
                bidCandidates[bidCount] = OrderBookLevel({ price: price, totalSize: buyTotal, orderCount: buyOrdersCount });
                bidCount += 1;
            }
            if (sellTotal > 0) {
                askCandidates[askCount] = OrderBookLevel({ price: price, totalSize: sellTotal, orderCount: sellOrdersCount });
                askCount += 1;
            }
        }

        // Sort candidates: bids by price desc, asks by price asc (selection sort)
        for (uint256 i = 0; i < bidCount; i++) {
            uint256 maxIdx = i;
            for (uint256 j = i + 1; j < bidCount; j++) {
                if (bidCandidates[j].price > bidCandidates[maxIdx].price) {
                    maxIdx = j;
                }
            }
            if (maxIdx != i) {
                OrderBookLevel memory tmp = bidCandidates[i];
                bidCandidates[i] = bidCandidates[maxIdx];
                bidCandidates[maxIdx] = tmp;
            }
        }

        for (uint256 i = 0; i < askCount; i++) {
            uint256 minIdx = i;
            for (uint256 j = i + 1; j < askCount; j++) {
                if (askCandidates[j].price < askCandidates[minIdx].price) {
                    minIdx = j;
                }
            }
            if (minIdx != i) {
                OrderBookLevel memory tmp2 = askCandidates[i];
                askCandidates[i] = askCandidates[minIdx];
                askCandidates[minIdx] = tmp2;
            }
        }

        // Fill result arrays up to requested depth
        uint256 bidLimit = depth < bidCount ? depth : bidCount;
        for (uint256 i = 0; i < bidLimit; i++) {
            bids[i] = bidCandidates[i];
        }

        uint256 askLimit = depth < askCount ? depth : askCount;
        for (uint256 i = 0; i < askLimit; i++) {
            asks[i] = askCandidates[i];
        }

        return (bids, asks);
    }

    function _addToPriceLevel(uint256 marketId, uint256 price, uint256 orderId) internal {
        priceLevelOrders[marketId][price].push(orderId);
        
        // Add price level if it doesn't exist
        uint256[] storage priceLevels = marketPriceLevels[marketId];
        bool exists = false;
        for (uint256 i = 0; i < priceLevels.length; i++) {
            if (priceLevels[i] == price) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            priceLevels.push(price);
        }
    }

    function _removeFromPriceLevel(uint256 marketId, uint256 price, uint256 orderId) internal {
        uint256[] storage levelOrders = priceLevelOrders[marketId][price];
        for (uint256 i = 0; i < levelOrders.length; i++) {
            if (levelOrders[i] == orderId) {
                levelOrders[i] = levelOrders[levelOrders.length - 1];
                levelOrders.pop();
                break;
            }
        }
    }

    function _shouldAttemptMatching(uint256 marketId, OrderSide side, uint256 price) 
        internal view returns (bool) {
        if (side == OrderSide.BUY) {
            (uint256 askPrice,) = this.getBestAsk(marketId);
            return askPrice > 0 && price >= askPrice;
        } else {
            (uint256 bidPrice,) = this.getBestBid(marketId);
            return bidPrice > 0 && price <= bidPrice;
        }
    }

    function _min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}