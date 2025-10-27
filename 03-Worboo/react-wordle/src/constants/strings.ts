export const GAME_TITLE = process.env.REACT_APP_GAME_NAME!

export const WIN_MESSAGES = ['Great Job!', 'Awesome', 'Well done!']
export const GAME_COPIED_MESSAGE = 'Game copied to clipboard'
export const NOT_ENOUGH_LETTERS_MESSAGE = 'Not enough letters'
export const WORD_NOT_FOUND_MESSAGE = 'Word not found'
export const HARD_MODE_ALERT_MESSAGE =
  'Hard Mode can only be enabled at the start!'
export const HARD_MODE_DESCRIPTION =
  'Any revealed hints must be used in subsequent guesses'
export const HIGH_CONTRAST_MODE_DESCRIPTION = 'For improved color vision'
export const CORRECT_WORD_MESSAGE = (solution: string) =>
  `The word was "${solution}"`
export const WRONG_SPOT_MESSAGE = (guess: string, position: number) =>
  `Must use ${guess} in position ${position}`
export const NOT_CONTAINED_MESSAGE = (letter: string) =>
  `Guess must contain ${letter}`
export const ENTER_TEXT = 'Enter'
export const DELETE_TEXT = 'Delete'
export const STATISTICS_TITLE = 'Statistics'
export const GUESS_DISTRIBUTION_TEXT = 'Guess Distribution'
export const NEW_WORD_TEXT = 'New day in'
export const SHARE_TEXT = 'Prove'
export const MIGRATE_BUTTON_TEXT = 'Transfer'
export const MIGRATE_DESCRIPTION_TEXT =
  'Click here to transfer your statistics to a new device.'
export const TOTAL_TRIES_TEXT = 'Total tries'
export const SUCCESS_RATE_TEXT = 'Success rate'
export const CURRENT_STREAK_TEXT = 'Current streak'
export const BEST_STREAK_TEXT = 'Best streak'
export const DISCOURAGE_INAPP_BROWSER_TEXT =
  "You are using an embedded browser and may experience problems sharing or saving your results. We encourage you rather to use your device's default browser."

// Social Media
export const DISCORD_URL = 'https://discord.com'
export const TELEGRAM_URL = 'https://t.me/alfredfuu'

// Worboo Chat Bubble Messages
export const WORBOO_CHAT_MESSAGES = [
  'I am Worboo! I can help you narrow down the word choices. Try making a guess first!',
  'This word might be a noun that refers to an everyday object.',
  'This word could be a verb describing a common action.',
  'This word might be related to nature or the environment.',
  'People in professional settings often use this word.',
  'This word is commonly used in casual conversations.',
  'This word might have Latin or Greek origins.',
  'This word could be related to technology or science.',
  'This word might be used frequently in literature or academic writing.',
  'This word could have multiple meanings depending on context.',
  'This word might be something you encounter in your daily routine.'
]

// Friend System
export const FRIEND_SEARCH_TITLE = 'Find Friends'
export const FRIEND_SEARCH_PLACEHOLDER = 'Enter OCID (e.g., 0x1234...5678)'
export const FRIEND_SEARCH_BUTTON = 'Search'
export const FRIEND_ADD_BUTTON = 'Add Friend'
export const FRIEND_ADDED_MESSAGE = 'Friend added successfully!'
export const FRIEND_NOT_FOUND_MESSAGE = 'User not found. Please check the OCID and try again.'
export const FRIEND_ALREADY_ADDED_MESSAGE = 'This user is already in your friends list.'
export const FRIEND_LIST_TITLE = 'Friends List'
export const FRIEND_PROFILE_LAST_ACTIVE = 'Last active:'
export const FRIEND_PROFILE_LEVEL = 'Level'
export const FRIEND_PROFILE_OCID = 'OCID:'
export const FRIEND_PROFILE_MESSAGE_BUTTON = 'Message'
export const FRIEND_PROFILE_GIFT_BUTTON = 'Send Gift'
export const FRIEND_PROFILE_CHALLENGE_BUTTON = 'Challenge'
export const FRIEND_PROFILE_COPY_OCID = 'Copy OCID'
export const FRIEND_PROFILE_COPIED_OCID = 'Copied!'

// Shop constants
export const SHOP_TITLE = 'Worboo Shop'
export const SHOP_SUBTITLE = 'Customize your Worboo with unique items!'
export const SHOP_BUY_BUTTON = 'Buy'
export const SHOP_EQUIP_BUTTON = 'Equip'
export const SHOP_UNEQUIP_BUTTON = 'Unequip'
export const SHOP_EQUIPPED_LABEL = 'Equipped'
export const SHOP_OPEN_BUTTON = 'Open'

export const SHOP_TABS = [
  'Full Worboo',
  'Body',
  'Head',
  'Eyes',
  'Mouth',
  'Accessories',
  'Treasure',
]

// Define shop item type
export interface ShopItem {
  id: string
  name: string
  price: number
  image: string
  description: string
  rarity: {
    id: string
    name: string
    color: string
  }
  currency?: string
}

// Rarity levels
export const RARITY = {
  COMMON: { id: 'common', name: 'Common', color: 'gray' },
  UNCOMMON: { id: 'uncommon', name: 'Uncommon', color: 'green' },
  RARE: { id: 'rare', name: 'Rare', color: 'blue' },
  EPIC: { id: 'epic', name: 'Epic', color: 'purple' },
  LEGENDARY: { id: 'legendary', name: 'Legendary', color: 'orange' }
}

// Full Worboo NFTs
export const SHOP_FULL_WORBOO_ITEMS: ShopItem[] = [
  {
    id: 'worboo-default',
    name: 'Classic Worboo',
    price: 100,
    image: '/worboo/worboo.png',
    description: 'The original Worboo character',
    rarity: RARITY.COMMON,
    currency: 'WBOO'
  },
  {
    id: 'worboo-sunglass',
    name: 'Cool Worboo',
    price: 150,
    image: '/worboo/worboo-sunglass.png',
    description: 'Worboo with stylish sunglasses',
    rarity: RARITY.UNCOMMON,
    currency: 'WBOO'
  },
  {
    id: 'worboo-unruly',
    name: 'Unruly Worboo',
    price: 150,
    image: '/worboo/worboo-unruly.png',
    description: 'Worboo with a wild attitude',
    rarity: RARITY.UNCOMMON,
    currency: 'WBOO'
  },
  {
    id: 'worboo-like',
    name: 'Friendly Worboo',
    price: 200,
    image: '/worboo/worboo-like.png',
    description: 'Worboo giving a thumbs up',
    rarity: RARITY.RARE,
    currency: 'WBOO'
  },
  {
    id: 'worboo-pig',
    name: 'Piggy Worboo',
    price: 250,
    image: '/worboo/worboo-pig.png',
    description: 'Worboo in pig costume',
    rarity: RARITY.EPIC,
    currency: 'WBOO'
  },
  {
    id: 'worboo-redpepper',
    name: 'Spicy Worboo',
    price: 250,
    image: '/worboo/worboo-redpepper.png',
    description: 'Worboo with a hot pepper',
    rarity: RARITY.EPIC,
    currency: 'WBOO'
  }
]

// Body parts NFTs
export const SHOP_BODY_ITEMS: ShopItem[] = [
  {
    id: 'body-default',
    name: 'Classic Body',
    price: 50,
    image: '/worboo/worboo.png',
    description: 'The original Worboo body',
    rarity: RARITY.COMMON,
    currency: 'WBOO'
  },
  {
    id: 'body-blue',
    name: 'Blue Body',
    price: 80,
    image: '/worboo/worboo-like.png',
    description: 'A cool blue Worboo body',
    rarity: RARITY.UNCOMMON,
    currency: 'WBOO'
  },
  {
    id: 'body-pig',
    name: 'Pig Body',
    price: 120,
    image: '/worboo/worboo-pig.png',
    description: 'Adorable pig-themed body',
    rarity: RARITY.RARE,
    currency: 'WBOO'
  }
]

// Head parts NFTs
export const SHOP_HEAD_ITEMS: ShopItem[] = [
  {
    id: 'head-default',
    name: 'Classic Head',
    price: 50,
    image: '/worboo/worboo.png',
    description: 'The original Worboo head',
    rarity: RARITY.COMMON,
    currency: 'WBOO'
  },
  {
    id: 'head-unruly',
    name: 'Unruly Head',
    price: 75,
    image: '/worboo/worboo-unruly.png',
    description: 'A head with wild hair',
    rarity: RARITY.UNCOMMON,
    currency: 'WBOO'
  }
]

// Eye parts NFTs
export const SHOP_EYE_ITEMS: ShopItem[] = [
  {
    id: 'eyes-default',
    name: 'Classic Eyes',
    price: 30,
    image: '/worboo/worboo.png',
    description: 'The original Worboo eyes',
    rarity: RARITY.COMMON,
    currency: 'WBOO'
  },
  {
    id: 'eyes-sunglass',
    name: 'Sunglasses',
    price: 60,
    image: '/worboo/worboo-sunglass.png',
    description: 'Cool sunglasses for your Worboo',
    rarity: RARITY.UNCOMMON,
    currency: 'WBOO'
  }
]

// Mouth parts NFTs
export const SHOP_MOUTH_ITEMS: ShopItem[] = [
  {
    id: 'mouth-default',
    name: 'Classic Mouth',
    price: 30,
    image: '/worboo/worboo.png',
    description: 'The original Worboo mouth',
    rarity: RARITY.COMMON,
    currency: 'WBOO'
  },
  {
    id: 'mouth-pepper',
    name: 'Spicy Mouth',
    price: 70,
    image: '/worboo/worboo-redpepper.png',
    description: 'A mouth with a hot pepper',
    rarity: RARITY.RARE,
    currency: 'WBOO'
  }
]

// Accessories NFTs
export const SHOP_ACCESSORY_ITEMS: ShopItem[] = [
  {
    id: 'accessory-none',
    name: 'No Accessory',
    price: 0,
    image: '/worboo/worboo.png',
    description: 'No accessories',
    rarity: RARITY.COMMON,
    currency: 'WBOO'
  },
  {
    id: 'accessory-thumbsup',
    name: 'Thumbs Up',
    price: 40,
    image: '/worboo/worboo-like.png',
    description: 'A friendly thumbs up gesture',
    rarity: RARITY.UNCOMMON,
    currency: 'WBOO'
  }
]

// Treasure shop items
export const SHOP_TREASURE_ITEMS: ShopItem[] = [
  {
    id: 'wooden_chest',
    name: 'Wooden Chest',
    description: 'A basic chest that may contain common items. Requires a wooden key to open.',
    price: 50,
    image: '/treasure/wooden.png',
    rarity: RARITY.COMMON,
    currency: 'WBOO'
  },
  {
    id: 'silver_chest',
    name: 'Silver Chest',
    description: 'A valuable chest that may contain rare items. Requires a silver key to open.',
    price: 150,
    image: '/treasure/silver.png',
    rarity: RARITY.RARE,
    currency: 'WBOO'
  },
  {
    id: 'diamond_chest',
    name: 'Diamond Chest',
    description: 'A premium chest that may contain legendary items. Requires a golden key to open.',
    price: 300,
    image: '/treasure/diamond.png',
    rarity: RARITY.LEGENDARY,
    currency: 'WBOO'
  },
  {
    id: 'wooden_key',
    name: 'Wooden Key',
    description: 'Used to open Wooden Chests. May reveal common game backgrounds, board themes, or Worboo accessories.',
    price: 100,
    image: '/treasure/wooden_key.png',
    rarity: RARITY.COMMON,
    currency: 'Score'
  },
  {
    id: 'silver_key',
    name: 'Silver Key',
    description: 'Used to open Silver Chests. May reveal rare game backgrounds, board themes, BGM, or Worboo accessories.',
    price: 250,
    image: '/treasure/silver_key.png',
    rarity: RARITY.RARE,
    currency: 'Score'
  },
  {
    id: 'golden_key',
    name: 'Golden Key',
    description: 'Used to open Diamond Chests. May reveal legendary game backgrounds, board themes, BGM, or Worboo NFTs.',
    price: 500,
    image: '/treasure/golden_key.png',
    rarity: RARITY.LEGENDARY,
    currency: 'Score'
  },
]

// Possible treasure rewards
export const TREASURE_REWARDS = {
  BACKGROUND: 'Game Background',
  BOARD_THEME: 'Board Theme',
  BGM: 'Background Music',
  WORBOO_ACCESSORY: 'Worboo Accessory',
  WORBOO_NFT: 'Legendary Worboo',
}

// All shop items combined for convenience
export const SHOP_ITEMS: ShopItem[] = [
  ...SHOP_FULL_WORBOO_ITEMS,
  ...SHOP_BODY_ITEMS,
  ...SHOP_HEAD_ITEMS,
  ...SHOP_EYE_ITEMS,
  ...SHOP_MOUTH_ITEMS,
  ...SHOP_ACCESSORY_ITEMS,
  ...SHOP_TREASURE_ITEMS
]

// Vocabulary Library
export const VOCABULARY_TITLE = 'Vocabulary Library'
export const VOCABULARY_SUBTITLE = 'Choose your word difficulty level'
export const VOCABULARY_TABS = ['Junior High', 'Senior High', 'CET-4', 'CET-6', 'IELTS', 'TOEFL', 'SAT']

// Vocabulary descriptions
export const VOCABULARY_DESCRIPTIONS = {
  'Junior High': 'Basic vocabulary suitable for beginners. Includes common everyday words.',
  'Senior High': 'Intermediate vocabulary with more complex words and phrases.',
  'CET-4': 'College English Test Level 4 vocabulary for undergraduate students.',
  'CET-6': 'College English Test Level 6 vocabulary with advanced terms.',
  'IELTS': 'International English Language Testing System vocabulary for academic and general training.',
  'TOEFL': 'Test of English as a Foreign Language vocabulary for academic settings.',
  'SAT': 'Scholastic Assessment Test vocabulary with focus on analytical and critical thinking.'
}

// Learning Plan
export const LEARNING_PLAN_TITLE = 'Learning Plan'
export const LEARNING_PLAN_SUBTITLE = 'Set your daily learning goals'
export const LEARNING_PLAN_OPTIONS = [
  { id: 'beginner', name: 'Beginner', wordsPerDay: 5, description: '5 words per day' },
  { id: 'intermediate', name: 'Intermediate', wordsPerDay: 10, description: '10 words per day' },
  { id: 'advanced', name: 'Advanced', wordsPerDay: 15, description: '15 words per day' },
  { id: 'expert', name: 'Expert', wordsPerDay: 20, description: '20 words per day' },
  { id: 'custom', name: 'Custom', wordsPerDay: 0, description: 'Set your own goal' }
]

// Vocabulary Library Types
export interface VocabularySet {
  id: string;
  name: string;
  description: string;
  wordCount: number;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Very Hard';
  isActive: boolean;
}
