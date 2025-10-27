// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract WorbooToken is ERC20, AccessControl {
    bytes32 public constant GAME_MASTER_ROLE = keccak256("GAME_MASTER_ROLE");

    constructor() ERC20("Worboo Token", "WBOO") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(GAME_MASTER_ROLE, msg.sender);
    }

    function mintTo(address account, uint256 amount) external onlyRole(GAME_MASTER_ROLE) {
        require(account != address(0), "InvalidAccount");
        _mint(account, amount);
    }

    function spend(address account, uint256 amount) external onlyRole(GAME_MASTER_ROLE) {
        require(account != address(0), "InvalidAccount");
        _burn(account, amount);
    }
}
