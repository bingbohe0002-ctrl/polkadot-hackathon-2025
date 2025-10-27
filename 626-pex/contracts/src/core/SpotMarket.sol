// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "../interfaces/ISpotMarket.sol";

/**
 * @title SpotMarket
 * @notice Manages spot trading markets (base/quote token pairs). Markets are activated by governance.
 */
contract SpotMarket is ISpotMarket, AccessControl {
    bytes32 public constant GOVERNOR_ROLE = keccak256("GOVERNOR_ROLE");

    uint256 private _marketIdCounter;
    mapping(uint256 => Market) private _markets;

    constructor(address governor) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(GOVERNOR_ROLE, governor);
    }

    function addMarket(address baseToken, address quoteToken, string memory symbol, bool baseIsNative, bool quoteIsNative)
        external
        onlyRole(GOVERNOR_ROLE)
        returns (uint256 id)
    {
        require(bytes(symbol).length > 0, "Invalid symbol");
        // Allow zero address only if marked native
        require(baseIsNative || baseToken != address(0), "Invalid base token");
        require(quoteIsNative || quoteToken != address(0), "Invalid quote token");

        id = ++_marketIdCounter;
        uint8 baseDecimals = baseIsNative ? 18 : IERC20Metadata(baseToken).decimals();
        uint8 quoteDecimals = quoteIsNative ? 18 : IERC20Metadata(quoteToken).decimals();

        _markets[id] = Market({
            id: id,
            baseToken: baseToken,
            quoteToken: quoteToken,
            symbol: symbol,
            isActive: false,
            baseDecimals: baseDecimals,
            quoteDecimals: quoteDecimals,
            baseIsNative: baseIsNative,
            quoteIsNative: quoteIsNative
        });

        emit MarketAdded(id, baseToken, quoteToken, symbol);
    }

    function activateMarket(uint256 marketId) external onlyRole(GOVERNOR_ROLE) {
        Market storage m = _markets[marketId];
        require(m.id != 0, "Market not found");
        require(!m.isActive, "Already active");
        m.isActive = true;
        emit MarketActivated(marketId);
    }

    function getMarket(uint256 marketId) external view returns (Market memory) {
        return _markets[marketId];
    }

    function getAllMarkets() external view returns (Market[] memory arr) {
        arr = new Market[](_marketIdCounter);
        for (uint256 i = 1; i <= _marketIdCounter; i++) {
            arr[i - 1] = _markets[i];
        }
    }

    function isMarketActive(uint256 marketId) external view returns (bool) {
        return _markets[marketId].isActive;
    }
}