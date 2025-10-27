// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {WorbooToken} from "./WorbooToken.sol";

contract WorbooShop is ERC1155, AccessControl, ReentrancyGuard {
    bytes32 public constant ITEM_MANAGER_ROLE = keccak256("ITEM_MANAGER_ROLE");

    struct ItemConfig {
        uint256 price;
        bool active;
    }

    WorbooToken public immutable paymentToken;
    mapping(uint256 => ItemConfig) private _items;

    event ItemConfigured(uint256 indexed itemId, uint256 price, bool active);

    constructor(address token, string memory baseUri, address admin) ERC1155(baseUri) {
        require(token != address(0), "InvalidToken");
        require(admin != address(0), "InvalidAdmin");

        paymentToken = WorbooToken(token);

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ITEM_MANAGER_ROLE, admin);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function setItemConfig(uint256 itemId, uint256 price, bool active) external onlyRole(ITEM_MANAGER_ROLE) {
        require(itemId != 0, "InvalidItemId");
        if (active) {
            require(price > 0, "InvalidPrice");
        }

        _items[itemId] = ItemConfig({price: price, active: active});
        emit ItemConfigured(itemId, price, active);
    }

    function getItemConfig(uint256 itemId) external view returns (ItemConfig memory) {
        return _items[itemId];
    }

    function purchase(uint256 itemId, uint256 quantity) external nonReentrant {
        require(quantity > 0, "InvalidQuantity");

        ItemConfig memory config = _items[itemId];
        if (!config.active) {
            revert("InactiveItem");
        }

        uint256 totalCost = config.price * quantity;
        paymentToken.spend(msg.sender, totalCost);
        _mint(msg.sender, itemId, quantity, "");
    }
}
