// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title VotingContract
 * @dev 比特币市值预测投票合约
 * 用户可以使用投票券预测比特币是否会被其他竞争链市值反超
 */
contract VotingContract is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    IERC20 public votingTicketToken;

    // 投票选项 - 改为年份值
    // 使用年份值代替枚举，支持自定义年份范围
    // 例如：2027, 2029, 2031, ..., 2065 等（奇数年结束）
    // 特殊值：0 表示"永不会"

    // 投票期信息
    struct VotingPeriod {
        uint256 startTime;      // 开始时间
        uint256 endTime;        // 结束时间
        bool active;           // 是否激活
        bool resolved;         // 是否已开奖
        uint256 correctAnswerYear; // 正确答案年份（0表示永不会）
    }

    // 用户投票信息
    struct UserVote {
        uint256 predictedYear;  // 预测年份（0表示永不会）
        uint256 ticketsUsed;    // 使用的投票券数量
        uint256 votingPeriodId; // 投票期ID
        uint256 timestamp;      // 投票时间
        bool claimed;          // 是否已领取奖励
    }

    // 投票统计
    struct VoteStats {
        uint256 totalTickets;   // 总投票券数量
        mapping(uint256 => uint256) yearTickets; // 各年份投票券数量
    }

    // 投票期计数器
    uint256 public currentVotingPeriodId;
    // 投票期映射
    mapping(uint256 => VotingPeriod) public votingPeriods;
    // 用户投票记录
    mapping(address => UserVote[]) public userVotes;
    // 投票期统计
    mapping(uint256 => VoteStats) private votingStats;
    // 预言机合约地址
    address public oracleContract;

    // 事件
    event VoteCast(address indexed user, uint256 votingPeriodId, uint256 predictedYear, uint256 ticketsUsed);
    event VotingPeriodResolved(uint256 indexed votingPeriodId, uint256 correctYear);
    event RewardClaimed(address indexed user, uint256 voteIndex, uint256 rewardAmount);
    event OracleContractUpdated(address oldOracle, address newOracle);

    constructor(
        address _votingTicketToken,
        address _oracleContract
    ) Ownable(msg.sender) {
        votingTicketToken = IERC20(_votingTicketToken);
        oracleContract = _oracleContract;

        // 初始化第一个投票期（示例）
        currentVotingPeriodId = 1;
        votingPeriods[1] = VotingPeriod({
            startTime: block.timestamp,
            endTime: block.timestamp + 365 days, // 1年投票期
            active: true,
            resolved: false,
            correctAnswerYear: 0 // 0表示永不会
        });
    }

    /**
     * @dev 进行投票
     * @param predictedYear 预测年份（0表示永不会）
     * @param ticketsToUse 使用的投票券数量
     */
    function vote(uint256 predictedYear, uint256 ticketsToUse) external nonReentrant whenNotPaused {
        require(ticketsToUse > 0, "Must use at least 1 ticket");
        require(predictedYear >= 2027 || predictedYear == 0, "Invalid prediction year (must be >= 2027 or 0 for never)");
        require(votingTicketToken.balanceOf(msg.sender) >= ticketsToUse, "Insufficient ticket balance");
        require(votingTicketToken.allowance(msg.sender, address(this)) >= ticketsToUse, "Insufficient allowance");

        VotingPeriod storage currentPeriod = votingPeriods[currentVotingPeriodId];
        require(currentPeriod.active, "No active voting period");
        require(block.timestamp >= currentPeriod.startTime, "Voting period not started");
        require(block.timestamp <= currentPeriod.endTime, "Voting period ended");
        require(!currentPeriod.resolved, "Voting period already resolved");

        // 转移投票券到合约（投票后锁定）
        votingTicketToken.safeTransferFrom(msg.sender, address(this), ticketsToUse);

        // 记录投票
        UserVote memory userVote = UserVote({
            predictedYear: predictedYear,
            ticketsUsed: ticketsToUse,
            votingPeriodId: currentVotingPeriodId,
            timestamp: block.timestamp,
            claimed: false
        });

        userVotes[msg.sender].push(userVote);

        // 更新统计
        votingStats[currentVotingPeriodId].totalTickets += ticketsToUse;
        votingStats[currentVotingPeriodId].yearTickets[predictedYear] += ticketsToUse;

        emit VoteCast(msg.sender, currentVotingPeriodId, predictedYear, ticketsToUse);
    }

    /**
     * @dev 开奖（仅预言机合约可调用）
     * @param votingPeriodId 投票期ID
     * @param correctYear 正确答案年份（0表示永不会）
     */
    function resolveVotingPeriod(uint256 votingPeriodId, uint256 correctYear) external {
        require(msg.sender == oracleContract, "Only oracle can resolve");
        require(correctYear >= 2027 || correctYear == 0, "Invalid year (must be >= 2027 or 0 for never)");
        require(votingPeriods[votingPeriodId].active, "Voting period not active");
        require(!votingPeriods[votingPeriodId].resolved, "Already resolved");

        votingPeriods[votingPeriodId].resolved = true;
        votingPeriods[votingPeriodId].correctAnswerYear = correctYear;

        emit VotingPeriodResolved(votingPeriodId, correctYear);
    }

    /**
     * @dev 领取投票奖励
     * @param voteIndex 投票记录索引
     */
    function claimReward(uint256 voteIndex) external nonReentrant {
        require(voteIndex < userVotes[msg.sender].length, "Invalid vote index");

        UserVote storage userVote = userVotes[msg.sender][voteIndex];
        require(!userVote.claimed, "Reward already claimed");

        VotingPeriod memory period = votingPeriods[userVote.votingPeriodId];
        require(period.resolved, "Voting period not resolved");
        require(period.correctAnswerYear == userVote.predictedYear, "Vote was incorrect");

        // 计算奖励倍数（预测准确的用户可获得奖励）
        uint256 rewardMultiplier = 2; // 2倍奖励
        uint256 rewardAmount = (userVote.ticketsUsed * rewardMultiplier);

        // 标记为已领取
        userVote.claimed = true;

        // 发放奖励（这里可以是原投票券返还或新铸造的奖励券）
        votingTicketToken.safeTransfer(msg.sender, rewardAmount);

        emit RewardClaimed(msg.sender, voteIndex, rewardAmount);
    }

    /**
     * @dev 获取当前投票期信息
     */
    function getCurrentVotingPeriod() external view returns (VotingPeriod memory) {
        return votingPeriods[currentVotingPeriodId];
    }

    /**
     * @dev 获取投票统计
     * @param votingPeriodId 投票期ID
     * @param year 年份
     */
    function getVoteStats(uint256 votingPeriodId, uint256 year) external view returns (uint256) {
        return votingStats[votingPeriodId].yearTickets[year];
    }

    /**
     * @dev 获取用户投票记录数量
     */
    function getUserVoteCount(address user) external view returns (uint256) {
        return userVotes[user].length;
    }

    /**
     * @dev 获取用户投票信息
     * @param user 用户地址
     * @param index 投票记录索引
     */
    function getUserVote(address user, uint256 index) external view returns (UserVote memory) {
        require(index < userVotes[user].length, "Invalid index");
        return userVotes[user][index];
    }

    /**
     * @dev 检查用户是否可以领取奖励
     * @param user 用户地址
     * @param voteIndex 投票记录索引
     */
    function canClaimReward(address user, uint256 voteIndex) external view returns (bool) {
        if (voteIndex >= userVotes[user].length) return false;

        UserVote memory userVote = userVotes[user][voteIndex];
        if (userVote.claimed) return false;

        VotingPeriod memory period = votingPeriods[userVote.votingPeriodId];
        if (!period.resolved) return false;

        return period.correctAnswerYear == userVote.predictedYear;
    }

    /**
     * @dev 创建新的投票期（仅管理员）
     * @param duration 投票持续时间（秒）
     */
    function createVotingPeriod(uint256 duration) external onlyOwner {
        require(duration > 0, "Duration must be greater than 0");

        currentVotingPeriodId++;
        votingPeriods[currentVotingPeriodId] = VotingPeriod({
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            active: true,
            resolved: false,
            correctAnswerYear: 0 // 0表示永不会
        });
    }

    /**
     * @dev 更新预言机合约地址（仅管理员）
     * @param newOracle 新预言机合约地址
     */
    function updateOracleContract(address newOracle) external onlyOwner {
        require(newOracle != address(0), "Invalid oracle address");
        address oldOracle = oracleContract;
        oracleContract = newOracle;

        emit OracleContractUpdated(oldOracle, newOracle);
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
     * @dev 获取合约内投票券余额
     */
    function getContractTicketBalance() external view returns (uint256) {
        return votingTicketToken.balanceOf(address(this));
    }
}
