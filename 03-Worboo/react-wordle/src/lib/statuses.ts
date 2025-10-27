import { unicodeSplit } from './words'

export type CharStatus = 'absent' | 'present' | 'correct'

export const getStatuses = (
  solution: string,
  guesses: string[]
): { [key: string]: CharStatus } => {
  const charStatuses: { [key: string]: CharStatus } = {}
  const solutionLetters = unicodeSplit(solution)
  
  // 创建字母计数映射用于存在但位置错误的判断
  const solutionLetterCounts: { [key: string]: number } = {}
  solutionLetters.forEach(letter => {
    solutionLetterCounts[letter] = (solutionLetterCounts[letter] || 0) + 1
  })

  guesses.forEach(guess => {
    const guessLetters = unicodeSplit(guess)
    const tempSolutionCounts = { ...solutionLetterCounts }
    const currentGuessStatuses: { [key: string]: CharStatus } = {}

    // 第一遍检查正确位置字母
    guessLetters.forEach((letter, i) => {
      if (letter === solutionLetters[i]) {
        currentGuessStatuses[letter] = 'correct'
        tempSolutionCounts[letter] -= 1
      }
    })

    // 第二遍处理存在但位置错误的字母
    guessLetters.forEach((letter, i) => {
      if (letter !== solutionLetters[i]) {
        if (tempSolutionCounts[letter] > 0) {
          currentGuessStatuses[letter] = 'present'
          tempSolutionCounts[letter] -= 1
        } else {
          currentGuessStatuses[letter] = 'absent'
        }
      }
    })

    // 合并状态，保留最高优先级状态
    Object.entries(currentGuessStatuses).forEach(([letter, status]) => {
      if (!charStatuses[letter] || 
          (status === 'correct') ||
          (status === 'present' && charStatuses[letter] === 'absent')) {
        charStatuses[letter] = status
      }
    })
  })

  return charStatuses
}

export const diffToStatus = (diff: number[][]): CharStatus[] => {
  if (!diff) {
    return []
  }
  const statuses: CharStatus[] = Array.from(Array(diff[0].length))
  for (var i = 0; i < diff[0].length; i++) {
    if (diff[0][i] === 1) {
      statuses[i] = 'correct'
    } else if (diff[1][i] === 1) {
      statuses[i] = 'present'
    } else {
      statuses[i] = 'absent'
    }
  }
  return statuses
}

export const getGuessStatuses = (
  solution: string,
  guess: string
): CharStatus[] => {
  // 将答案和猜测统一转换为小写，防止大小写不匹配
  const normalizedSolution = solution.toLowerCase()
  const normalizedGuess = guess.toLowerCase()
  
  const splitSolution = unicodeSplit(normalizedSolution)
  const splitGuess = unicodeSplit(normalizedGuess)
  const statuses: CharStatus[] = Array.from(Array(guess.length))
  
  // 创建答案中字母计数映射，用于记录每个字母可用的次数
  const solutionLetterCounts: { [key: string]: number } = {}
  splitSolution.forEach(letter => {
    solutionLetterCounts[letter] = (solutionLetterCounts[letter] || 0) + 1
  })
  
  // 第一遍：标记正确位置的字母（绿色），同时减少对应字母的计数
  splitGuess.forEach((letter, i) => {
    if (letter === splitSolution[i]) {
      statuses[i] = 'correct'
      solutionLetterCounts[letter]--
    }
  })
  
  // 第二遍：标记存在但位置错误的字母（黄色）或者字母不存在（灰色）
  splitGuess.forEach((letter, i) => {
    if (!statuses[i]) { // 忽略已标记为绿色的字母
      if (solutionLetterCounts[letter] && solutionLetterCounts[letter] > 0) {
        statuses[i] = 'present'
        solutionLetterCounts[letter]--
      } else {
        statuses[i] = 'absent'
      }
    }
  })
  
  return statuses
}
