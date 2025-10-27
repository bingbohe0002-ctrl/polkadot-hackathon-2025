import { WORDS, Word, WORDS_BY_LENGTH, getWordsByLength, getRandomLength, getRandomWordByLength } from '../constants/wordlistCET4'
import { WRONG_SPOT_MESSAGE, NOT_CONTAINED_MESSAGE } from '../constants/strings'
import { MAX_CHALLENGES } from '../constants/settings'
import { getGuessStatuses } from './statuses'
import { default as GraphemeSplitter } from 'grapheme-splitter'

// 1 January 2022 Game Epoch
export const firstGameDate = new Date(2022, 0)
export const periodInDays = 1

// 定义每日单词状态接口
export interface DailyWords {
  words: Word[]         // 当天的10个单词
  currentWordIndex: number  // 当前正在猜的单词索引
  completed: string[]    // 已完成的单词
  attempted: string[]   // 已尝试过的单词（包括完成和未完成的）
  nextDay: number       // 下一天的时间戳
  guessesForWord: { [key: string]: number } // 每个单词的猜测次数
}

export const isWordInWordList = (word: string) => {
  const solution = getCurrentSolution()
  if (!solution) return false
  
  const wordLength = unicodeLength(word)
  
  // Check if the word length matches the current solution's length
  if (wordLength !== solution.length) {
    return false
  }
  
  // The word length matches, so it's valid
  return true
}

export const getGuessesForCurrentWord = () => {
  const state = loadDailyState()
  const currentWord = state.words[state.currentWordIndex].text
  return state.guessesForWord[currentWord] || 0
}

export const incrementGuessesForCurrentWord = () => {
  const state = loadDailyState()
  const currentWord = state.words[state.currentWordIndex].text
  state.guessesForWord[currentWord] = (state.guessesForWord[currentWord] || 0) + 1
  saveDailyState(state)
  return state.guessesForWord[currentWord]
}

export const getRemainingGuessesForCurrentWord = () => {
  return MAX_CHALLENGES - getGuessesForCurrentWord()
}

export const isWinningWord = (word: string) => {
  const solution = getCurrentSolution()
  return solution.text.toLowerCase() === word.toLowerCase()
}

// build a set of previously revealed letters - present and correct
// guess must use correct letters in that space and any other revealed letters
// also check if all revealed instances of a letter are used (i.e. two C's)
export const findFirstUnusedReveal = (word: string, guesses: string[]) => {
  if (guesses.length === 0) {
    return false
  }

  const lettersLeftArray = new Array<string>()
  const guess = guesses[guesses.length - 1]
  const statuses = getGuessStatuses(solution, guess)
  const splitWord = unicodeSplit(word)
  const splitGuess = unicodeSplit(guess)

  for (let i = 0; i < splitGuess.length; i++) {
    if (statuses[i] === 'correct' || statuses[i] === 'present') {
      lettersLeftArray.push(splitGuess[i])
    }
    if (statuses[i] === 'correct' && splitWord[i] !== splitGuess[i]) {
      return WRONG_SPOT_MESSAGE(splitGuess[i], i + 1)
    }
  }

  // check for the first unused letter, taking duplicate letters
  // into account - see issue #198
  let n
  for (const letter of splitWord) {
    n = lettersLeftArray.indexOf(letter)
    if (n !== -1) {
      lettersLeftArray.splice(n, 1)
    }
  }

  if (lettersLeftArray.length > 0) {
    return NOT_CONTAINED_MESSAGE(lettersLeftArray[0])
  }
  return false
}

export const unicodeSplit = (word: string) => {
  if (!word) return []
  return new GraphemeSplitter().splitGraphemes(word.toString())
}

export const unicodeLength = (word: string) => {
  return unicodeSplit(word).length
}

export const localeAwareLowerCase = (text: string) => {
  return process.env.REACT_APP_LOCALE_STRING
    ? text.toLocaleLowerCase(process.env.REACT_APP_LOCALE_STRING)
    : text.toLowerCase()
}

export const localeAwareUpperCase = (text: string) => {
  return process.env.REACT_APP_LOCALE_STRING
    ? text.toLocaleUpperCase(process.env.REACT_APP_LOCALE_STRING)
    : text.toUpperCase()
}

export const getToday = () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

export const getLastGameDate = (today: Date) => {
  const t = new Date(today)
  t.setHours(0, 0, 0)
  let daysSinceLastGame =
    (t.getDay() - firstGameDate.getDay() + 7) % periodInDays
  const lastDate = new Date(t)
  lastDate.setDate(t.getDate() - daysSinceLastGame)
  return lastDate
}

export const getNextGameDate = (today: Date) => {
  const t = new Date(today)
  t.setHours(0, 0, 0)
  t.setDate(getLastGameDate(today).getDate() + periodInDays)
  return t
}

export const getIndex = (today: Date) => {
  const start = new Date(firstGameDate)
  let index = -1
  do {
    index++
    start.setDate(start.getDate() + periodInDays)
  } while (start <= today)

  return index
}

// 获取指定索引的单词
export const getWordOfDay = (index: number) => {
  if (index < 0) {
    throw new Error('Invalid index')
  }
  return localeAwareUpperCase(WORDS[index % WORDS.length])
}

// 获取当天的10个单词
export const getDailyWords = (today: Date): DailyWords => {
  const words: Word[] = []
  const attempted: string[] = []
  
  // 从 localStorage 获取已尝试的单词
  const dailyStateStr = localStorage.getItem('gameState')
  if (dailyStateStr) {
    try {
      const dailyState = JSON.parse(dailyStateStr)
      if (dailyState.attempted) {
        attempted.push(...dailyState.attempted)
      }
    } catch (e) {
      // 如果解析失败，忽略错误
    }
  }
  
  // 从词库中随机选择10个单词
  const maxAttempts = 50 // 防止无限循环
  let attempts = 0
  
  while (words.length < 10 && attempts < maxAttempts) {
    const length = getRandomLength()
    const word = getRandomWordByLength(length)
    // 检查单词是否已经在列表中或已经被尝试过
    if (word && 
        !words.some(w => w.text === word.text) && 
        !attempted.includes(word.text)) {
      // Add length to each word
      words.push({
        ...word,
        length: unicodeLength(word.text)
      })
    }
    attempts++
  }
  
  return {
    words,
    currentWordIndex: 0,
    completed: [],
    attempted: [], // 初始化attempted数组
    nextDay: getNextGameDate(today).valueOf(),
    guessesForWord: {}
  }
}

// 获取解决方案信息
export const getSolution = (today: Date) => {
  const nextGameDate = getNextGameDate(today)
  const index = getIndex(today)
  const wordOfTheDay = getWordOfDay(index)
  return {
    solution: wordOfTheDay,
    solutionIndex: index,
    tomorrow: nextGameDate.valueOf(),
  }
}

// 从 localStorage 加载或初始化每日状态
export const loadDailyState = (): DailyWords => {
  const state = localStorage.getItem('dailyState')
  if (!state) {
    return getDailyWords(getToday())
  }

  try {
    const parsedState = JSON.parse(state)
    const today = getToday()
    const nextDay = getNextGameDate(today).valueOf()

    // 检查是否是新的一天
    if (parsedState.nextDay && parsedState.nextDay <= Date.now()) {
      return getDailyWords(today)
    }

    // 验证并修复状态字段
    const validState: DailyWords = {
      words: Array.isArray(parsedState.words) && parsedState.words.length > 0 
        ? parsedState.words.filter((word: any) => 
            word && typeof word === 'object' && typeof word.text === 'string'
          )
        : getDailyWords(today).words,
      currentWordIndex: typeof parsedState.currentWordIndex === 'number' && 
        parsedState.currentWordIndex >= 0 && 
        parsedState.currentWordIndex < 10
        ? parsedState.currentWordIndex
        : 0,
      completed: Array.isArray(parsedState.completed) 
        ? parsedState.completed.filter((word: string) => typeof word === 'string')
        : [],
      attempted: Array.isArray(parsedState.attempted)
        ? parsedState.attempted.filter((word: string) => typeof word === 'string')
        : [],
      nextDay: nextDay,
      guessesForWord: typeof parsedState.guessesForWord === 'object'
        ? parsedState.guessesForWord
        : {}
    }

    // 确保 words 数组中的每个单词都有正确的长度属性
    validState.words = validState.words.map(word => ({
      ...word,
      length: unicodeLength(word.text)
    }))

    // 如果状态有效，返回修复后的状态
    if (validState.words.length === 10) {
      return validState
    }
  } catch (e) {
    console.error('Error parsing daily state:', e)
  }

  // 如果状态无效或解析错误，返回新的状态
  return getDailyWords(getToday())
}

// 保存每日状态
export const saveDailyState = (state: DailyWords) => {
  localStorage.setItem('dailyState', JSON.stringify(state))
}

// 检查是否需要重置（新的一天）
export const checkAndResetDaily = () => {
  const state = loadDailyState()
  if (!state || !state.nextDay) {
    const newState = getDailyWords(getToday())
    saveDailyState(newState)
    return newState
  }
  
  const now = new Date().valueOf()
  if (now >= state.nextDay) {
    const newState = getDailyWords(getToday())
    saveDailyState(newState)
    return newState
  }
  return state
}

// 获取当前需要猜的单词
export const getCurrentSolution = (): Word => {
  const state = loadDailyState()
  if (!state || !state.words || state.currentWordIndex >= state.words.length) {
    // Provide a default word if state is invalid
    return {
      text: 'hello',
      chineseDef: '你好',
      englishDef: 'greeting',
      length: 5
    }
  }
  return state.words[state.currentWordIndex]
}

// 标记当前单词为已完成并移到下一个单词
export const markCurrentWordAsCompleted = () => {
  const state = loadDailyState()
  if (!state || !state.words || state.currentWordIndex >= state.words.length) {
    return state
  }
  
  const currentWord = state.words[state.currentWordIndex].text
  
  // 将当前单词标记为已尝试（包括猜对和猜错的情况）
  if (!state.attempted.includes(currentWord)) {
    state.attempted.push(currentWord)
  }
  
  // 直接将下标自增，切换到下一个单词
  if (state.currentWordIndex < state.words.length - 1) {
    state.currentWordIndex++
  }
  
  saveDailyState(state)
  return state
}

// 获取今天的游戏进度
export const getDailyProgress = () => {
  const state = loadDailyState()
  return {
    completed: state.completed.length,
    total: state.words.length,
    currentIndex: state.currentWordIndex
  }
}

// 导出兼容性变量
export const currentWord = getCurrentSolution()
export const solution = currentWord.text
export const chineseDef = currentWord.chineseDef
export const englishDef = currentWord.englishDef
