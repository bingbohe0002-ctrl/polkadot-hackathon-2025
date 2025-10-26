// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ISpotOrderBook {
    enum OrderType { LIMIT, MARKET }
    enum OrderSide { BUY, SELL }
    enum OrderStatus { PENDING, PARTIALLY_FILLED, FILLED, CANCELLED }

    struct Order {
        uint256 id;
        address trader;
        uint256 marketId;
        OrderType orderType;
        OrderSide side;
        uint256 size;        // 18 decimals
        uint256 price;       // 18 decimals (quote/base)
        uint256 filledSize;  // 18 decimals
        uint256 timestamp;
        OrderStatus status;
        // reserved amounts in token decimals
        uint256 reservedBase;
        uint256 reservedQuote;
    }

    event OrderPlaced(
        uint256 indexed orderId,
        address indexed trader,
        uint256 indexed marketId,
        OrderType orderType,
        OrderSide side,
        uint256 size,
        uint256 price
    );
    event OrderFilled(
        uint256 indexed orderId,
        address indexed trader,
        uint256 indexed marketId,
        uint256 filledSize,
        uint256 fillPrice,
        uint256 timestamp
    );
    event OrderCancelled(uint256 indexed orderId, address indexed trader, uint256 indexed marketId);

    function placeOrder(
        uint256 marketId,
        OrderType orderType,
        OrderSide side,
        uint256 size,
        uint256 price
    ) external payable returns (uint256);

    function cancelOrder(uint256 orderId) external;

    function getOrder(uint256 orderId) external view returns (Order memory);

    function getOrdersByTrader(address trader) external view returns (uint256[] memory);
}