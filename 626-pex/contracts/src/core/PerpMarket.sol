// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IPerpMarket.sol";
import "../interfaces/IMarginVault.sol";
import "../interfaces/IRiskEngine.sol";
import "../interfaces/IOracleAdapter.sol";
import "../interfaces/IFeeCollector.sol";

/**
 * @title PerpMarket
 * @notice Core perpetual market logic: positions, funding, PnL and leverage
 */
contract PerpMarket is IPerpMarket, AccessControl, ReentrancyGuard {
    using Counters for Counters.Counter;

    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
    bytes32 public constant RISK_MANAGER_ROLE = keccak256("RISK_MANAGER_ROLE");

    Counters.Counter private _positionIdCounter;
    Counters.Counter private _marketIdCounter;

    // External components
    IMarginVault public marginVault;
    IRiskEngine public riskEngine;
    IOracleAdapter public oracle;
    IFeeCollector public feeCollector;
    address public matchEngine; // OrderBook contract
    address public usdcToken; // margin token

    // Storage
    mapping(uint256 => Position) private _positions; // positionId => Position
    mapping(address => uint256[]) private _positionsByTrader; // trader => positionIds
    mapping(uint256 => Market) private _markets; // marketId => Market

    constructor(address _admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(GOVERNANCE_ROLE, _admin);
        _grantRole(RISK_MANAGER_ROLE, _admin);
    }

    // Admin wiring
    function setMarginVault(address _vault) external onlyRole(GOVERNANCE_ROLE) {
        marginVault = IMarginVault(_vault);
    }

    function setRiskEngine(address _risk) external onlyRole(GOVERNANCE_ROLE) {
        riskEngine = IRiskEngine(_risk);
    }

    function setOracleAdapter(address _oracle) external onlyRole(GOVERNANCE_ROLE) {
        oracle = IOracleAdapter(_oracle);
    }

    function setFeeCollector(address _collector) external onlyRole(GOVERNANCE_ROLE) {
        feeCollector = IFeeCollector(_collector);
    }

    function setMatchEngine(address _engine) external onlyRole(GOVERNANCE_ROLE) {
        matchEngine = _engine;
    }

    function setUsdcToken(address _usdc) external onlyRole(GOVERNANCE_ROLE) {
        usdcToken = _usdc;
    }

    modifier onlyMatchEngine() {
        require(msg.sender == matchEngine, "Not match engine");
        _;
    }

    // Market management (extra helper, not part of interface)
    function addMarket(
        string calldata symbol,
        string calldata baseAsset,
        string calldata quoteAsset,
        uint256 maxLeverage,
        uint256 minOrderSize,
        uint256 tickSize
    ) external onlyRole(GOVERNANCE_ROLE) returns (uint256 marketId) {
        _marketIdCounter.increment();
        marketId = _marketIdCounter.current();
        _markets[marketId] = Market({
            id: marketId,
            symbol: symbol,
            baseAsset: baseAsset,
            quoteAsset: quoteAsset,
            maxLeverage: maxLeverage,
            minOrderSize: minOrderSize,
            tickSize: tickSize,
            fundingRate: 0,
            lastFundingTime: block.timestamp,
            openInterest: 0,
            isActive: true
        });
        emit MarketCreated(marketId, symbol, baseAsset, quoteAsset);
    }

    // Core Functions
    function openPosition(
        uint256 marketId,
        PositionSide side,
        uint256 size,
        uint256 leverage,
        uint256 acceptablePrice
    ) external nonReentrant returns (uint256 positionId) {
        Market memory m = _markets[marketId];
        require(m.isActive, "Market inactive");
        require(size >= m.minOrderSize, "Size too small");
        require(leverage > 0 && leverage <= m.maxLeverage, "Invalid leverage");
        require(usdcToken != address(0), "USDC not set");
        // --- Correct margin requirement: (size * price) / leverage, convert to USDC 6 decimals ---
        uint256 notional = (size * acceptablePrice) / 1e18; // 18 decimals
        uint256 reqNotional = notional / leverage; // 18 decimals
        uint256 reqUsdc = reqNotional / 1e12; // 6 decimals for USDC
        if (reqUsdc == 0) { reqUsdc = 1; }
        // Use MarginVault available balance and lock margin
        uint256 available = marginVault.calculateAvailableBalance(msg.sender);
        require(available >= reqUsdc, "Insufficient available USDC");
        (IMarginVault.MarginMode mode, uint256 totalCollateral, uint256 totalMargin, uint256 availableBalance, int256 unrealizedPnl) =
            marginVault.getAccountInfo(msg.sender);
        marginVault.allocateMargin(msg.sender, marketId, reqUsdc, mode);

        // Simplified funding & margin checks for skeleton
        _positionIdCounter.increment();
        positionId = _positionIdCounter.current();

        _positions[positionId] = Position({
            trader: msg.sender,
            marketId: marketId,
            side: side,
            size: size,
            entryPrice: acceptablePrice,
            leverage: leverage,
            margin: reqUsdc,
            timestamp: block.timestamp,
            unrealizedPnl: 0,
            lastFundingPayment: 0
        });

        _positionsByTrader[msg.sender].push(positionId);
        _markets[marketId].openInterest += size;

        emit PositionOpened(msg.sender, marketId, side, size, acceptablePrice, leverage, reqUsdc);
    }

    function openPositionFor(
        address trader,
        uint256 marketId,
        PositionSide side,
        uint256 size,
        uint256 leverage,
        uint256 entryPrice
    ) external nonReentrant onlyMatchEngine returns (uint256 positionId) {
        Market memory m = _markets[marketId];
        require(m.isActive, "Market inactive");
        require(size > 0, "Size too small");
        require(leverage > 0 && leverage <= m.maxLeverage, "Invalid leverage");
        require(usdcToken != address(0), "USDC not set");
        // --- Correct margin requirement: (size * price) / leverage, convert to USDC 6 decimals ---
        uint256 notional = (size * entryPrice) / 1e18; // 18 decimals
        uint256 reqNotional = notional / leverage; // 18 decimals
        uint256 reqUsdc = reqNotional / 1e12; // 6 decimals for USDC
        if (reqUsdc == 0) { reqUsdc = 1; }
        // Use MarginVault available balance and lock margin for trader
        uint256 available = marginVault.calculateAvailableBalance(trader);
        require(available >= reqUsdc, "Insufficient available USDC");
        (IMarginVault.MarginMode mode, uint256 totalCollateral, uint256 totalMargin, uint256 availableBalance, int256 unrealizedPnl) =
            marginVault.getAccountInfo(trader);
        marginVault.allocateMargin(trader, marketId, reqUsdc, mode);

        _positionIdCounter.increment();
        positionId = _positionIdCounter.current();

        _positions[positionId] = Position({
            trader: trader,
            marketId: marketId,
            side: side,
            size: size,
            entryPrice: entryPrice,
            leverage: leverage,
            margin: reqUsdc,
            timestamp: block.timestamp,
            unrealizedPnl: 0,
            lastFundingPayment: 0
        });

        _positionsByTrader[trader].push(positionId);
        _markets[marketId].openInterest += size;

        emit PositionOpened(trader, marketId, side, size, entryPrice, leverage, reqUsdc);
    }

    function closePosition(
        uint256 positionId,
        uint256 size,
        uint256 acceptablePrice
    ) external nonReentrant returns (int256 pnl) {
        Position storage p = _positions[positionId];
        require(p.trader == msg.sender, "Not owner");
        require(size > 0 && size <= p.size, "Invalid size");

        uint256 prevSize = p.size;
        // Simplified: assume closing at acceptablePrice, PnL = 0 for skeleton
        p.size -= size;
        _markets[p.marketId].openInterest -= size;
        // Release proportional margin back to available balance
        uint256 releasedUsdc = (p.margin * size) / prevSize;
        if (releasedUsdc == 0) { releasedUsdc = 1; }
        marginVault.releaseMargin(msg.sender, p.marketId, releasedUsdc);
        if (p.margin >= releasedUsdc) {
            p.margin -= releasedUsdc;
        } else {
            p.margin = 0;
        }
        emit PositionClosed(msg.sender, p.marketId, size, acceptablePrice, 0);

        if (p.size == 0) {
            // position fully closed; leave record for history
        }
        return 0;
    }

    function liquidatePosition(uint256 positionId)
        external
        nonReentrant
        returns (uint256 liquidationReward)
    {
        Position storage p = _positions[positionId];
        require(p.size > 0, "No position");
        // Skeleton: no-op liquidation logic
        emit PositionLiquidated(p.trader, msg.sender, p.marketId, p.size, p.entryPrice, 0);
        return 0;
    }

    function updateFunding(uint256 marketId) external {
        Market storage m = _markets[marketId];
        require(m.isActive, "Market inactive");
        m.lastFundingTime = block.timestamp;
        // Skeleton: no funding math
    }

    function collectFunding(uint256 positionId) external returns (int256 fundingPayment) {
        Position storage p = _positions[positionId];
        require(p.trader == msg.sender, "Not owner");
        // Skeleton: no funding accrual
        emit FundingPayment(msg.sender, p.marketId, 0, block.timestamp);
        return 0;
    }

    // View Functions
    function getPosition(uint256 positionId) external view returns (Position memory) {
        return _positions[positionId];
    }

    function getPositionsByTrader(address trader) external view returns (uint256[] memory) {
        return _positionsByTrader[trader];
    }

    function getMarket(uint256 marketId) external view returns (Market memory) {
        return _markets[marketId];
    }

    function getAllMarkets() external view returns (Market[] memory markets_) {
        uint256 count = _marketIdCounter.current();
        markets_ = new Market[](count);
        for (uint256 i = 1; i <= count; i++) {
            markets_[i - 1] = _markets[i];
        }
    }

    function calculateUnrealizedPnl(uint256 /*positionId*/, uint256 /*currentPrice*/)
        external view returns (int256)
    {
        return 0;
    }

    function calculateLiquidationPrice(uint256 /*positionId*/)
        external view returns (uint256)
    {
        return 0;
    }

    function calculateRequiredMargin(uint256 /*marketId*/, uint256 size, uint256 leverage)
        external view returns (uint256)
    {
        if (leverage == 0) return 0;
        return size / leverage;
    }

    function getFundingInfo(uint256 marketId) external view returns (FundingInfo memory info) {
        Market memory m = _markets[marketId];
        info = FundingInfo({
            fundingRate: int256(m.fundingRate),
            fundingTime: m.lastFundingTime,
            nextFundingTime: m.lastFundingTime,
            cumulativeFunding: 0
        });
    }

    function getOpenInterest(uint256 marketId) external view returns (uint256) {
        return _markets[marketId].openInterest;
    }

    function isPositionLiquidatable(uint256 /*positionId*/, uint256 /*currentPrice*/)
        external view returns (bool)
    {
        return false;
    }
}