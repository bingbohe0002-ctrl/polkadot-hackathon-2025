// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IVotingContract
 * @dev 投票合约接口，供 BTCOracle 和 StakingContract 调用
 */
interface IVotingContract {
    /**
     * @dev 获取当前投票期ID
     */
    function currentVotingPeriodId() external view returns (uint256);
    
    /**
     * @dev 投票期信息
     * @param startTime 开始时间
     * @param endTime 结束时间
     * @param active 是否激活
     * @param resolved 是否已开奖
     * @param correctAnswerYear 正确答案年份
     */
    function votingPeriods(uint256 votingPeriodId) external view returns (
        uint256 startTime,
        uint256 endTime,
        bool active,
        bool resolved,
        uint256 correctAnswerYear
    );

    /**
     * @dev 解决投票期（仅限 Oracle 调用）
     * @param votingPeriodId 投票期ID
     * @param correctYear 正确答案年份（0表示永不会）
     */
    function resolveVotingPeriod(uint256 votingPeriodId, uint256 correctYear) external;
}