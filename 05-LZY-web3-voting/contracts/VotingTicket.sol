// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title VotingTicket
 * @dev 投票券 ERC20 代币合约
 * 用于在投票系统中作为投票权力的凭证
 */
contract VotingTicket is ERC20, Ownable, Pausable {
    // 代币信息
    string private _name = "Voting Ticket";
    string private _symbol = "vTicket";
    uint8 private _decimals = 18;

    // 最大供应量
    uint256 public maxSupply = 100000000 * 10**_decimals; // 1亿枚

    // 铸造权限控制
    mapping(address => bool) public minters;

    // 事件
    event MinterAdded(address indexed account);
    event MinterRemoved(address indexed account);
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);

    constructor() ERC20(_name, _symbol) Ownable(msg.sender) {
        // 合约部署者自动获得铸造权限
        minters[msg.sender] = true;
        emit MinterAdded(msg.sender);
    }

    /**
     * @dev 重写名称函数
     */
    function name() public view override returns (string memory) {
        return _name;
    }

    /**
     * @dev 重写符号函数
     */
    function symbol() public view override returns (string memory) {
        return _symbol;
    }

    /**
     * @dev 重写小数位数函数
     */
    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    /**
     * @dev 添加铸造者（仅管理员）
     * @param account 铸造者地址
     */
    function addMinter(address account) external onlyOwner {
        require(account != address(0), "Invalid address");
        require(!minters[account], "Address is already a minter");

        minters[account] = true;
        emit MinterAdded(account);
    }

    /**
     * @dev 移除铸造者（仅管理员）
     * @param account 铸造者地址
     */
    function removeMinter(address account) external onlyOwner {
        require(account != address(0), "Invalid address");
        require(minters[account], "Address is not a minter");
        require(account != owner(), "Cannot remove owner as minter");

        minters[account] = false;
        emit MinterRemoved(account);
    }

    /**
     * @dev 铸造代币
     * @param to 接收者地址
     * @param amount 铸造数量
     */
    function mint(address to, uint256 amount) external {
        require(minters[msg.sender], "Caller is not authorized to mint");
        require(to != address(0), "Cannot mint to zero address");
        require(totalSupply() + amount <= maxSupply, "Would exceed maximum supply");

        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /**
     * @dev 销毁代币
     * @param from 销毁者地址
     * @param amount 销毁数量
     */
    function burn(address from, uint256 amount) external {
        require(minters[msg.sender] || msg.sender == from, "Caller is not authorized to burn");
        require(from != address(0), "Cannot burn from zero address");
        require(balanceOf(from) >= amount, "Insufficient balance");

        _burn(from, amount);
        emit TokensBurned(from, amount);
    }

    /**
     * @dev 批量铸造（仅铸造者）
     * @param recipients 接收者地址数组
     * @param amounts 铸造数量数组
     */
    function batchMint(address[] calldata recipients, uint256[] calldata amounts) external {
        require(minters[msg.sender], "Caller is not authorized to mint");
        require(recipients.length == amounts.length, "Arrays length mismatch");

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        require(totalSupply() + totalAmount <= maxSupply, "Would exceed maximum supply");

        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Cannot mint to zero address");
            _mint(recipients[i], amounts[i]);
            emit TokensMinted(recipients[i], amounts[i]);
        }
    }

    /**
     * @dev 批量销毁（仅铸造者）
     * @param holders 持有者地址数组
     * @param amounts 销毁数量数组
     */
    function batchBurn(address[] calldata holders, uint256[] calldata amounts) external {
        require(minters[msg.sender], "Caller is not authorized to burn");
        require(holders.length == amounts.length, "Arrays length mismatch");

        for (uint256 i = 0; i < holders.length; i++) {
            require(holders[i] != address(0), "Cannot burn from zero address");
            require(balanceOf(holders[i]) >= amounts[i], "Insufficient balance");

            _burn(holders[i], amounts[i]);
            emit TokensBurned(holders[i], amounts[i]);
        }
    }

    /**
     * @dev 设置最大供应量（仅管理员）
     * @param newMaxSupply 新的最大供应量
     */
    function setMaxSupply(uint256 newMaxSupply) external onlyOwner {
        require(newMaxSupply >= totalSupply(), "Cannot set max supply below current total supply");
        maxSupply = newMaxSupply;
    }

    /**
     * @dev 暂停代币转移（紧急情况）
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev 恢复代币转移
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev 重写转账函数以支持暂停功能
     */
    function _update(address from, address to, uint256 value) internal override whenNotPaused {
        super._update(from, to, value);
    }

    /**
     * @dev 检查铸造者权限
     * @param account 账户地址
     */
    function isMinter(address account) external view returns (bool) {
        return minters[account];
    }

    /**
     * @dev 获取当前总供应量
     */
    function getTotalSupply() external view returns (uint256) {
        return totalSupply();
    }

    /**
     * @dev 获取最大供应量
     */
    function getMaxSupply() external view returns (uint256) {
        return maxSupply;
    }

    /**
     * @dev 获取剩余可铸造数量
     */
    function getRemainingSupply() external view returns (uint256) {
        return maxSupply - totalSupply();
    }
}
