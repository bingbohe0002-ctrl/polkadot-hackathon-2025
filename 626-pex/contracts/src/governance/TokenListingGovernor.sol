// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/IAccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../interfaces/ISpotMarket.sol";

/**
 * @title TokenListingGovernor
 * @notice Simple on-chain governance for listing new spot markets. PEX holders vote and >=80% approval required.
 * Note: Voting power = native PEX amount sent with vote; funds are locked for 7 days.
 */
contract TokenListingGovernor is AccessControl, ReentrancyGuard {
    bytes32 public constant GOVERNOR_ADMIN_ROLE = keccak256("GOVERNOR_ADMIN_ROLE");

    // Kept for backward compatibility with deployments; not used in voting anymore
    IERC20 public immutable pexToken;
    ISpotMarket public immutable spotMarket;

    uint256 public votingPeriodBlocks; // e.g. 200 blocks
    uint16 public approvalThresholdBps; // 8000 = 80%

    uint256 public constant LOCK_DURATION = 7 days;

    struct Proposal {
        uint256 id;
        address proposer;
        address baseToken;
        address quoteToken;
        string symbol; // e.g. "PEX/USDC"
        uint256 startBlock;
        uint256 endBlock;
        uint256 yesVotes;
        uint256 noVotes;
        bool executed;
    }

    struct LockEntry {
        uint256 amount;
        uint256 releaseTime;
    }

    mapping(uint256 => mapping(address => bool)) public hasVoted; // proposalId => voter => voted
    // Track the chosen direction per voter for a proposal
    mapping(uint256 => mapping(address => bool)) public supportOf; // valid only when hasVoted is true
    // Track cumulative voting weight per voter for a proposal
    mapping(uint256 => mapping(address => uint256)) public weightOf;
    mapping(uint256 => Proposal) public proposals;
    mapping(address => LockEntry[]) public locks; // voter => lock entries
    uint256 public proposalCount;

    event ProposalCreated(
        uint256 indexed id,
        address indexed proposer,
        address indexed baseToken,
        address quoteToken,
        string symbol,
        uint256 startBlock,
        uint256 endBlock
    );
    event VoteCast(uint256 indexed id, address indexed voter, bool support, uint256 weight);
    event ProposalFinalized(uint256 indexed id, bool approved, uint256 yesVotes, uint256 noVotes);
    event TokensLocked(address indexed voter, uint256 amount, uint256 releaseTime);
    event TokensUnlocked(address indexed voter, uint256 amount);

    constructor(address _pexToken, address _spotMarket, uint256 _votingPeriodBlocks, uint16 _approvalBps) {
        require(_spotMarket != address(0), "invalid addr");
        // _pexToken kept for compatibility; may be zero address
        pexToken = IERC20(_pexToken);
        spotMarket = ISpotMarket(_spotMarket);
        votingPeriodBlocks = _votingPeriodBlocks;
        approvalThresholdBps = _approvalBps;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(GOVERNOR_ADMIN_ROLE, msg.sender);
    }

    function setVotingParams(uint256 _votingPeriodBlocks, uint16 _approvalBps) external onlyRole(GOVERNOR_ADMIN_ROLE) {
        require(_approvalBps <= 10000, "bps");
        votingPeriodBlocks = _votingPeriodBlocks;
        approvalThresholdBps = _approvalBps;
    }

    function createProposal(address baseToken, address quoteToken, string memory symbol) external returns (uint256 id) {
        // Allow zero-address for native tokens; frontends pass ZERO for native PEX
        require(bytes(symbol).length > 0, "invalid symbol");

        id = ++proposalCount;
        uint256 start = block.number;
        uint256 end = start + votingPeriodBlocks;

        Proposal storage p = proposals[id];
        p.id = id;
        p.proposer = msg.sender;
        p.baseToken = baseToken;
        p.quoteToken = quoteToken;
        p.symbol = symbol;
        p.startBlock = start;
        p.endBlock = end;
        p.yesVotes = 0;
        p.noVotes = 0;
        p.executed = false;

        emit ProposalCreated(id, msg.sender, baseToken, quoteToken, symbol, start, end);
    }

    // Voting now uses native PEX; amount is msg.value and will be locked for 7 days
    function vote(uint256 proposalId, bool support) external payable {
        Proposal storage p = proposals[proposalId];
        require(p.id != 0, "no proposal");
        require(block.number <= p.endBlock && block.number >= p.startBlock, "voting closed");
        // allow multiple votes from same wallet; direction must be consistent
        require(msg.value > 0, "no amount");

        uint256 weight = msg.value;

        if (!hasVoted[proposalId][msg.sender]) {
            hasVoted[proposalId][msg.sender] = true;
            supportOf[proposalId][msg.sender] = support;
        } else {
            require(supportOf[proposalId][msg.sender] == support, "direction locked");
        }

        // record lock
        locks[msg.sender].push(LockEntry({ amount: weight, releaseTime: block.timestamp + LOCK_DURATION }));
        emit TokensLocked(msg.sender, weight, block.timestamp + LOCK_DURATION);

        weightOf[proposalId][msg.sender] += weight;
        if (support) {
            p.yesVotes += weight;
        } else {
            p.noVotes += weight;
        }
        emit VoteCast(proposalId, msg.sender, support, weight);
    }

    // Claim unlocked funds after 7 days; automatically available for withdrawal
    function claimUnlocked() external nonReentrant {
        LockEntry[] storage ls = locks[msg.sender];
        uint256 n = ls.length;
        uint256 claimable = 0;
        uint256 write = 0;
        for (uint256 i = 0; i < n; i++) {
            if (ls[i].releaseTime <= block.timestamp) {
                claimable += ls[i].amount;
            } else {
                // keep this entry
                ls[write] = ls[i];
                write++;
            }
        }
        // shrink array to remaining locked entries
        while (ls.length > write) {
            ls.pop();
        }

        require(claimable > 0, "nothing to claim");
        (bool sent, ) = payable(msg.sender).call{ value: claimable }("");
        require(sent, "transfer failed");
        emit TokensUnlocked(msg.sender, claimable);
    }

    function getLockedSummary(address user) external view returns (uint256 total, uint256 claimable, uint256 nextRelease) {
        LockEntry[] storage ls = locks[user];
        uint256 minNext = 0;
        for (uint256 i = 0; i < ls.length; i++) {
            total += ls[i].amount;
            if (ls[i].releaseTime <= block.timestamp) {
                claimable += ls[i].amount;
            } else {
                if (minNext == 0 || ls[i].releaseTime < minNext) {
                    minNext = ls[i].releaseTime;
                }
            }
        }
        nextRelease = minNext;
    }

    function finalize(uint256 proposalId) external {
        // Backend permission gate: only wallets with SpotMarket GOVERNOR_ROLE may finalize
        require(IAccessControl(address(spotMarket)).hasRole(keccak256("GOVERNOR_ROLE"), msg.sender), "not governor");

        Proposal storage p = proposals[proposalId];
        require(p.id != 0, "no proposal");
        require(block.number > p.endBlock, "not ended");
        require(!p.executed, "already");

        uint256 total = p.yesVotes + p.noVotes;
        require(total > 0, "no votes");
        bool approved = p.yesVotes * 10000 >= approvalThresholdBps * total;

        if (approved) {
            // Use zero-address heuristic for native tokens on AssetHub
            bool baseIsNative = (p.baseToken == address(0));
            bool quoteIsNative = (p.quoteToken == address(0));
            uint256 marketId = spotMarket.addMarket(p.baseToken, p.quoteToken, p.symbol, baseIsNative, quoteIsNative);
            spotMarket.activateMarket(marketId);
        }

        p.executed = true;
        emit ProposalFinalized(proposalId, approved, p.yesVotes, p.noVotes);
    }
}