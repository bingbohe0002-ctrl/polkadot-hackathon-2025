// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract WorbooRegistry {
    uint8 public constant MAX_GUESSES = 10;

    struct PlayerProfile {
        bool registered;
        uint64 totalGames;
        uint64 totalWins;
        uint64 currentStreak;
        uint64 lastDayId;
        uint40 lastSubmissionAt;
    }

    mapping(address => PlayerProfile) private profiles;

    event PlayerRegistered(address indexed player);
    event GameRecorded(
        address indexed player,
        uint64 indexed dayId,
        bytes32 wordHash,
        uint8 guesses,
        bool victory,
        uint64 streak,
        uint64 totalGames,
        uint64 totalWins
    );

    function register() external {
        PlayerProfile storage profile = profiles[msg.sender];
        require(!profile.registered, "AlreadyRegistered");

        profile.registered = true;
        emit PlayerRegistered(msg.sender);
    }

    function recordGame(
        uint64 dayId,
        bytes32 wordHash,
        uint8 guesses,
        bool victory
    ) external {
        PlayerProfile storage profile = profiles[msg.sender];
        require(profile.registered, "NotRegistered");
        require(wordHash != bytes32(0), "InvalidWordHash");
        require(guesses > 0 && guesses <= MAX_GUESSES, "InvalidGuesses");
        require(dayId > profile.lastDayId, "DayNotStrictlyIncreasing");

        profile.totalGames += 1;
        if (victory) {
            profile.totalWins += 1;
            if (profile.lastDayId + 1 == dayId) {
                profile.currentStreak += 1;
            } else {
                profile.currentStreak = 1;
            }
        } else {
            profile.currentStreak = 0;
        }

        profile.lastDayId = dayId;
        profile.lastSubmissionAt = uint40(block.timestamp);

        emit GameRecorded(
            msg.sender,
            dayId,
            wordHash,
            guesses,
            victory,
            profile.currentStreak,
            profile.totalGames,
            profile.totalWins
        );
    }

    function getProfile(address player)
        external
        view
        returns (
            bool isRegistered,
            uint64 totalGames,
            uint64 totalWins,
            uint64 currentStreak,
            uint64 lastDayId,
            uint40 lastSubmissionAt
        )
    {
        PlayerProfile storage profile = profiles[player];
        return (
            profile.registered,
            profile.totalGames,
            profile.totalWins,
            profile.currentStreak,
            profile.lastDayId,
            profile.lastSubmissionAt
        );
    }
}
