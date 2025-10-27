// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/IVotingTicket.sol";
import "./interfaces/IVotingContract.sol";

/**
 * @title StakingContract
 * @dev vDOT 抵押合约，用于发放投票券
 * 质押锁定直到投票开奖后才能解除
 */
contract StakingContract is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    IERC20 public vDOTToken;
    IVotingTicket public votingTicketToken;
    IVotingContract public votingContract;

    // 用户抵押信息
    struct StakeInfo {
        uint256 amount;        // 抵押数量
        uint256 votingPeriodId; // 投票期ID
        uint256 startTime;     // 开始时间
        uint256 ticketsMinted; // 已铸造投票券数量
        bool active;          // 是否激活
    }

    // 用户抵押记录
    mapping(address => StakeInfo[]) public userStakes;
    // 总抵押量
    uint256 public totalStaked;

    // 事件
    event Staked(address indexed user, uint256 amount, uint256 votingPeriodId, uint256 ticketsMinted);
    event Unstaked(address indexed user, uint256 stakeIndex, uint256 amount);
    event VotingContractUpdated(address oldContract, address newContract);
    event EmergencyWithdraw(address indexed token, uint256 amount);

    constructor(
        address _vDOTToken,
        address _votingTicketToken,
        address _votingContract
    ) Ownable(msg.sender) {
        vDOTToken = IERC20(_vDOTToken);
        votingTicketToken = IVotingTicket(_votingTicketToken);
        votingContract = IVotingContract(_votingContract);
    }

    /**
     * @dev 抵押 vDOT 并获得投票券（1:1 比例）
     * 锁定到当前投票期开奖后才能解除
     * @param amount 抵押数量
     */
    function stake(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(vDOTToken.balanceOf(msg.sender) >= amount, "Insufficient vDOT balance");
        require(vDOTToken.allowance(msg.sender, address(this)) >= amount, "Insufficient allowance");

        // 获取当前投票期ID
        uint256 currentPeriodId = votingContract.currentVotingPeriodId();
        
        // 按 1:1 比例铸造投票券
        uint256 ticketsToMint = amount;

        // 转移 vDOT 到合约
        vDOTToken.safeTransferFrom(msg.sender, address(this), amount);

        // 铸造投票券给用户
        votingTicketToken.mint(msg.sender, ticketsToMint);

        // 记录抵押信息
        StakeInfo memory stakeInfo = StakeInfo({
            amount: amount,
            votingPeriodId: currentPeriodId,
            startTime: block.timestamp,
            ticketsMinted: ticketsToMint,
            active: true
        });

        userStakes[msg.sender].push(stakeInfo);
        totalStaked += amount;

        emit Staked(msg.sender, amount, currentPeriodId, ticketsToMint);
    }

    /**
     * @dev 解除抵押（只有在投票期开奖后才能解除）
     * @param stakeIndex 抵押记录索引
     */
    function unstake(uint256 stakeIndex) external nonReentrant {
        require(stakeIndex < userStakes[msg.sender].length, "Invalid stake index");

        StakeInfo storage stakeInfo = userStakes[msg.sender][stakeIndex];
        require(stakeInfo.active, "Stake not active");
        
        // 检查投票期是否已开奖
        (, , , bool resolved, ) = votingContract.votingPeriods(stakeInfo.votingPeriodId);
        require(resolved, "Voting period not resolved yet");

        uint256 amount = stakeInfo.amount;

        // 返还 vDOT
        vDOTToken.safeTransfer(msg.sender, amount);

        // 销毁投票券
        votingTicketToken.burn(msg.sender, stakeInfo.ticketsMinted);

        // 更新状态
        stakeInfo.active = false;
        totalStaked -= amount;

        emit Unstaked(msg.sender, stakeIndex, amount);
    }

    /**
     * @dev 计算投票券数量（1:1 比例）
     * @param amount 抵押金额
     * @return 投票券数量
     */
    function calculateTickets(uint256 amount) public pure returns (uint256) {
        return amount;
    }

    /**
     * @dev 获取用户的抵押记录数量
     * @param user 用户地址
     * @return 抵押记录数量
     */
    function getUserStakeCount(address user) external view returns (uint256) {
        return userStakes[user].length;
    }

    /**
     * @dev 获取用户的抵押信息
     * @param user 用户地址
     * @param index 抵押记录索引
     * @return 抵押信息
     */
    function getUserStake(address user, uint256 index) external view returns (StakeInfo memory) {
        require(index < userStakes[user].length, "Invalid index");
        return userStakes[user][index];
    }

    /**
     * @dev 检查抵押是否可以解除（需要投票期已开奖）
     * @param user 用户地址
     * @param stakeIndex 抵押记录索引
     * @return 是否可以解除
     */
    function canUnstake(address user, uint256 stakeIndex) external view returns (bool) {
        if (stakeIndex >= userStakes[user].length) return false;

        StakeInfo memory stakeInfo = userStakes[user][stakeIndex];
        if (!stakeInfo.active) return false;
        
        // 检查投票期是否已开奖
        (, , , bool resolved, ) = votingContract.votingPeriods(stakeInfo.votingPeriodId);
        return resolved;
    }

    /**
     * @dev 更新投票合约地址（仅管理员）
     * @param newVotingContract 新投票合约地址
     */
    function updateVotingContract(address newVotingContract) external onlyOwner {
        require(newVotingContract != address(0), "Invalid address");
        address oldContract = address(votingContract);
        votingContract = IVotingContract(newVotingContract);
        emit VotingContractUpdated(oldContract, newVotingContract);
    }

    /**
     * @dev 暂停合约（紧急情况）
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev 恢复合约
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev 紧急提取代币（仅管理员）
     * @param token 代币地址
     * @param amount 提取数量
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
        emit EmergencyWithdraw(token, amount);
    }

    /**
     * @dev 获取合约内 vDOT 余额
     */
    function getContractVDOTBalance() external view returns (uint256) {
        return vDOTToken.balanceOf(address(this));
    }

    /**
     * @dev 获取合约内投票券余额
     */
    function getContractTicketBalance() external view returns (uint256) {
        return votingTicketToken.balanceOf(address(this));
    }
}
