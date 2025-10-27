export const WORBOO_REGISTRY_ABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'player',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'uint64',
        name: 'dayId',
        type: 'uint64',
      },
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'wordHash',
        type: 'bytes32',
      },
      {
        indexed: false,
        internalType: 'uint8',
        name: 'guesses',
        type: 'uint8',
      },
      {
        indexed: false,
        internalType: 'bool',
        name: 'victory',
        type: 'bool',
      },
      {
        indexed: false,
        internalType: 'uint64',
        name: 'streak',
        type: 'uint64',
      },
      {
        indexed: false,
        internalType: 'uint64',
        name: 'totalGames',
        type: 'uint64',
      },
      {
        indexed: false,
        internalType: 'uint64',
        name: 'totalWins',
        type: 'uint64',
      },
    ],
    name: 'GameRecorded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'player',
        type: 'address',
      },
    ],
    name: 'PlayerRegistered',
    type: 'event',
  },
  {
    inputs: [],
    name: 'MAX_GUESSES',
    outputs: [
      {
        internalType: 'uint8',
        name: '',
        type: 'uint8',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'player',
        type: 'address',
      },
    ],
    name: 'getProfile',
    outputs: [
      {
        internalType: 'bool',
        name: 'isRegistered',
        type: 'bool',
      },
      {
        internalType: 'uint64',
        name: 'totalGames',
        type: 'uint64',
      },
      {
        internalType: 'uint64',
        name: 'totalWins',
        type: 'uint64',
      },
      {
        internalType: 'uint64',
        name: 'currentStreak',
        type: 'uint64',
      },
      {
        internalType: 'uint64',
        name: 'lastDayId',
        type: 'uint64',
      },
      {
        internalType: 'uint40',
        name: 'lastSubmissionAt',
        type: 'uint40',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint64',
        name: 'dayId',
        type: 'uint64',
      },
      {
        internalType: 'bytes32',
        name: 'wordHash',
        type: 'bytes32',
      },
      {
        internalType: 'uint8',
        name: 'guesses',
        type: 'uint8',
      },
      {
        internalType: 'bool',
        name: 'victory',
        type: 'bool',
      },
    ],
    name: 'recordGame',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'register',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

