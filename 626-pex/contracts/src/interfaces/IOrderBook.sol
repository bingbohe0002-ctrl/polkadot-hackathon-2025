// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IOrderBook
 * @notice Interface for the OrderBook contract that manages limit and market orders
 */
interface IOrderBook {
    enum OrderType { LIMIT, MARKET }
    enum OrderSide { BUY, SELL }
    enum OrderStatus { PENDING, FILLED, CANCELLED, PARTIALLY_FILLED }

    struct Order {
        uint256 id;
        address trader;
        uint256 marketId;
        OrderType orderType;
        OrderSide side;
        uint256 size;
        uint256 price; // 0 for market orders
        uint256 filledSize;
        uint256 timestamp;
        OrderStatus status;
        uint256 leverage;
    }

    struct OrderBookLevel {
        uint256 price;
        uint256 totalSize;
        uint256 orderCount;
    }

    // Events
    event OrderPlaced(
        uint256 indexed orderId,
        address indexed trader,
        uint256 indexed marketId,
        OrderType orderType,
        OrderSide side,
        uint256 size,
        uint256 price,
        uint256 leverage
    );

    event OrderFilled(
        uint256 indexed orderId,
        address indexed trader,
        uint256 indexed marketId,
        uint256 filledSize,
        uint256 fillPrice,
        uint256 timestamp
    );

    event OrderCancelled(
        uint256 indexed orderId,
        address indexed trader,
        uint256 indexed marketId
    );

    event OrderMatched(
        uint256 indexed buyOrderId,
        uint256 indexed sellOrderId,
        uint256 indexed marketId,
        uint256 matchedSize,
        uint256 matchPrice,
        address buyer,
        address seller
    );

    // 新增：成交前保证金事前校验失败事件
    event PrecheckFailed(
        uint256 indexed buyOrderId,
        uint256 indexed sellOrderId,
        uint256 indexed marketId,
        uint256 matchedSize,
        uint256 matchPrice,
        address buyer,
        address seller,
        uint256 requiredBuyerUsdc,
        uint256 availableBuyerUsdc,
        uint256 requiredSellerUsdc,
        uint256 availableSellerUsdc
    );

    // 新增：开仓失败事件（在 openPositionFor 捕获异常时发出）
    event PositionOpenFailed(
        address indexed trader,
        uint256 indexed marketId,
        uint8 side,
        uint256 size,
        uint256 price,
        uint256 leverage
    );

    // Core Functions
    function placeOrder(
        uint256 marketId,
        OrderType orderType,
        OrderSide side,
        uint256 size,
        uint256 price,
        uint256 leverage
    ) external returns (uint256 orderId);

    function cancelOrder(uint256 orderId) external;

    function matchOrders(uint256 marketId) external returns (uint256 matchedVolume);

    // View Functions
    function getOrder(uint256 orderId) external view returns (Order memory);

    function getOrdersByTrader(address trader) external view returns (uint256[] memory);

    function getOrderBook(uint256 marketId, uint256 depth) 
        external view returns (
            OrderBookLevel[] memory bids,
            OrderBookLevel[] memory asks
        );

    function getBestBid(uint256 marketId) external view returns (uint256 price, uint256 size);

    function getBestAsk(uint256 marketId) external view returns (uint256 price, uint256 size);

    function getSpread(uint256 marketId) external view returns (uint256 spread);

    function getOrderCount() external view returns (uint256);

    function getMarketOrderCount(uint256 marketId) external view returns (uint256);
}