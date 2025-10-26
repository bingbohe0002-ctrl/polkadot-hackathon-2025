// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import {OrderBook} from "src/core/OrderBook.sol";
import {IOrderBook} from "src/interfaces/IOrderBook.sol";
import {MockPerpMarket} from "src/mocks/MockPerpMarket.sol";
import {MockMarginVault} from "src/mocks/MockMarginVault.sol";

contract OrderBookTest is Test {
    OrderBook internal orderBook;
    MockPerpMarket internal perpMarket;
    MockMarginVault internal marginVault;

    address internal traderA = address(0xA11CE);
    address internal traderB = address(0xB0B);

    uint256 internal marketId = 1;

    function setUp() public {
        perpMarket = new MockPerpMarket();
        perpMarket.setMarketActive(marketId, true);
        marginVault = new MockMarginVault();
        orderBook = new OrderBook(address(perpMarket), address(marginVault));
        vm.startPrank(traderA);
        marginVault.deposit(address(0), 1_000e8);
        vm.stopPrank();
        vm.startPrank(traderB);
        marginVault.deposit(address(0), 1_000e8);
        vm.stopPrank();
    }

    function testPlaceLimitOrdersAndBestPrices() public {
        vm.startPrank(traderA);
        uint256 buyId1 = orderBook.placeOrder(
            marketId,
            IOrderBook.OrderType.LIMIT,
            IOrderBook.OrderSide.BUY,
            10,
            100 * orderBook.PRICE_PRECISION(),
            5
        );
        uint256 buyId2 = orderBook.placeOrder(
            marketId,
            IOrderBook.OrderType.LIMIT,
            IOrderBook.OrderSide.BUY,
            5,
            110 * orderBook.PRICE_PRECISION(),
            3
        );
        vm.stopPrank();

        vm.startPrank(traderB);
        uint256 sellId1 = orderBook.placeOrder(
            marketId,
            IOrderBook.OrderType.LIMIT,
            IOrderBook.OrderSide.SELL,
            8,
            120 * orderBook.PRICE_PRECISION(),
            4
        );
        vm.stopPrank();

        (uint256 bestBidPrice, uint256 bidSize) = orderBook.getBestBid(marketId);
        (uint256 bestAskPrice, uint256 askSize) = orderBook.getBestAsk(marketId);

        assertEq(bestBidPrice, 110 * orderBook.PRICE_PRECISION(), "best bid price");
        assertEq(bidSize, 5, "best bid size aggregated");
        assertEq(bestAskPrice, 120 * orderBook.PRICE_PRECISION(), "best ask price");
        assertEq(askSize, 8, "best ask size aggregated");

        uint256 spread = orderBook.getSpread(marketId);
        assertEq(spread, (120 - 110) * orderBook.PRICE_PRECISION(), "spread calculation");

        // Verify order statuses are pending
        IOrderBook.Order memory ob1 = orderBook.getOrder(buyId1);
        IOrderBook.Order memory ob2 = orderBook.getOrder(buyId2);
        IOrderBook.Order memory os1 = orderBook.getOrder(sellId1);
        assertEq(uint8(ob1.status), uint8(IOrderBook.OrderStatus.PENDING), "buy1 pending");
        assertEq(uint8(ob2.status), uint8(IOrderBook.OrderStatus.PENDING), "buy2 pending");
        assertEq(uint8(os1.status), uint8(IOrderBook.OrderStatus.PENDING), "sell1 pending");
    }

    function testMarketOrderMatchesAgainstOppositeSide() public {
        // Seed book: Seller places at 100
        vm.startPrank(traderB);
        uint256 sellId = orderBook.placeOrder(
            marketId,
            IOrderBook.OrderType.LIMIT,
            IOrderBook.OrderSide.SELL,
            15,
            100 * orderBook.PRICE_PRECISION(),
            3
        );
        vm.stopPrank();

        // Buyer places market order size 10
        vm.startPrank(traderA);
        uint256 buyMarketId = orderBook.placeOrder(
            marketId,
            IOrderBook.OrderType.MARKET,
            IOrderBook.OrderSide.BUY,
            10,
            0,
            2
        );
        vm.stopPrank();

        IOrderBook.Order memory sellOrder = orderBook.getOrder(sellId);
        IOrderBook.Order memory buyOrder = orderBook.getOrder(buyMarketId);

        // Market buy should fill 10 at maker's price (100)
        assertEq(buyOrder.filledSize, 10, "market buy filledSize");
        assertEq(sellOrder.filledSize, 10, "sell filledSize");
        assertEq(uint8(buyOrder.status), uint8(IOrderBook.OrderStatus.FILLED), "buy status filled");
        assertEq(uint8(sellOrder.status), uint8(IOrderBook.OrderStatus.PARTIALLY_FILLED), "sell partially filled");
    }

    function testCancelOrderRemovesFromBook() public {
        vm.startPrank(traderA);
        uint256 id = orderBook.placeOrder(
            marketId,
            IOrderBook.OrderType.LIMIT,
            IOrderBook.OrderSide.BUY,
            6,
            90 * orderBook.PRICE_PRECISION(),
            2
        );
        orderBook.cancelOrder(id);
        vm.stopPrank();

        IOrderBook.Order memory o = orderBook.getOrder(id);
        assertEq(uint8(o.status), uint8(IOrderBook.OrderStatus.CANCELLED), "cancelled status");

        (uint256 bestBid, uint256 bidSize) = orderBook.getBestBid(marketId);
        // After cancel, best bid should be zero if it was the only bid at that price.
        // However, getBestBid scans all pending bids and picks the highest price.
        // Since we only had one order and cancelled it, the size at best price should be 0.
        assertEq(bidSize, 0, "bid size after cancel");
        // bestBid may remain 0 if no other bids exist
        assertEq(bestBid, 0, "best bid after cancel");
    }
}