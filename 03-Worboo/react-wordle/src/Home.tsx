// 导入React核心hooks和组件
import { useState, useEffect } from 'react'
// 导入Web3钱包相关hook
import { useAccount } from 'wagmi'
// 导入游戏主要组件
import { Grid } from './components/grid/Grid'
import { Keyboard } from './components/keyboard/Keyboard'
// 导入各种模态框组件
import { InfoModal } from './components/modals/InfoModal'
import Spline from '@splinetool/react-spline'
import { StatsModal } from './components/modals/StatsModal'
import { SettingsModal } from './components/modals/SettingsModal'
import {
  WIN_MESSAGES,
  GAME_COPIED_MESSAGE,
  NOT_ENOUGH_LETTERS_MESSAGE,
  WORD_NOT_FOUND_MESSAGE,
  CORRECT_WORD_MESSAGE,
  HARD_MODE_ALERT_MESSAGE,
  DISCOURAGE_INAPP_BROWSER_TEXT,
  WORBOO_CHAT_MESSAGES,
} from './constants/strings'
import {
  MAX_CHALLENGES,
  REVEAL_TIME_MS,
  WELCOME_INFO_MODAL_MS,
  DISCOURAGE_INAPP_BROWSERS,
} from './constants/settings'
import {
  isWordInWordList,
  isWinningWord,
  findFirstUnusedReveal,
  unicodeLength,
  getCurrentSolution,
  markCurrentWordAsCompleted,
  getDailyProgress,
  getRemainingGuessesForCurrentWord,
  loadDailyState,
  incrementGuessesForCurrentWord,
} from './lib/words'
import { addStatsForCompletedGame, loadStats } from './lib/stats'
import {
  loadGameStateFromLocalStorage,
  saveGameStateToLocalStorage,
  setStoredIsHighContrastMode,
  getStoredIsHighContrastMode,
} from './lib/localStorage'
import { default as GraphemeSplitter } from 'grapheme-splitter'

import './Home.css'
import { AlertContainer } from './components/alerts/AlertContainer'
import { useAlert } from './context/AlertContext'
import { Navbar } from './components/navbar/Navbar'
import { isInAppBrowser } from './lib/browser'
import { MigrateStatsModal } from './components/modals/MigrateStatsModal'
import { WordDetailModal } from './components/modals/WordDetailModal'
import { ChatBubble } from './components/chat/ChatBubble'

// Home组件：游戏的主要组件
function Home() {
  // 检测系统是否处于深色模式
  const prefersDarkMode = window.matchMedia(
    '(prefers-color-scheme: dark)'
  ).matches

  // 提示相关的hooks
  const { showError: showErrorAlert, showSuccess: showSuccessAlert, clearAlert } =
    useAlert()
  // 游戏状态相关的state
  const [currentGuess, setCurrentGuess] = useState('') // 当前猜测的单词
  const [isGameWon, setIsGameWon] = useState(false)  // 游戏是否获胜
  // 各种模态框的显示状态
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false)
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false)
  const [isMigrateStatsModalOpen, setIsMigrateStatsModalOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [isWordDetailModalOpen, setIsWordDetailModalOpen] = useState(false)
  // 当前行的样式类
  const [currentRowClass, setCurrentRowClass] = useState('')
  // 游戏是否失败
  const [isGameLost, setIsGameLost] = useState(false)
  // 深色模式状态管理
  // 优先使用localStorage中存储的主题设置，如果没有则使用系统主题
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem('theme')
      ? localStorage.getItem('theme') === 'dark'
      : prefersDarkMode
      ? true
      : false
  )
  // 高对比度模式状态
  const [isHighContrastMode, setIsHighContrastMode] = useState(
    getStoredIsHighContrastMode()
  )
  const [isRevealing, setIsRevealing] = useState(false)
  // Initialize state from daily words
  const [dailyState] = useState(() => loadDailyState())
  const [solution, setSolution] = useState(() => dailyState.words[dailyState.currentWordIndex])
  const [solutionText, setSolutionText] = useState(() => solution.text)
  useEffect(() => {
    setSolutionText(solution.text)
  }, [solution])
  const [currentWordLength, setCurrentWordLength] = useState(() => solution.length)
  const [dailyProgress, setDailyProgress] = useState(() => getDailyProgress())

  const [guesses, setGuesses] = useState<string[]>(() => {
    const loaded = loadGameStateFromLocalStorage()
    if (loaded?.solution !== solutionText) {
      return []
    }
    const gameWasWon = loaded.guesses.includes(solutionText)
    if (gameWasWon) {
      setIsGameWon(true)
    }
    if (loaded.guesses.length === MAX_CHALLENGES && !gameWasWon) {
      setIsGameLost(true)
      showErrorAlert(CORRECT_WORD_MESSAGE(solutionText), {
        persist: true,
      })
    }
    return loaded.guesses
  })

  const [stats, setStats] = useState(() => loadStats())
  const { address, isConnected } = useAccount()
  const [remainingGuesses, setRemainingGuesses] = useState(10)
  const [aiMessage, setAiMessage] = useState(WORBOO_CHAT_MESSAGES[0])
  const [aiMessageIndex, setAiMessageIndex] = useState(0)
  const [isAiThinking, setIsAiThinking] = useState(false)

  // Web3功能：检查钱包连接状态和剩余猜测次数
  // 每个用户每天有10次猜测机会
  useEffect(() => {
    if (!isConnected) {
      // 提示用户需要先连接钱包
      showErrorAlert('Please connect your wallet first', { persist: true })
      return
    }

    // 钱包已连接，清除错误消息
    clearAlert()
    
    // 从 localStorage 获取今天的猜测次数
    const today = new Date().toISOString().split('T')[0]
    const guessesKey = `${address}-${today}-guesses`
    const storedGuesses = localStorage.getItem(guessesKey)
    const guessesCount = storedGuesses ? parseInt(storedGuesses) : 0
    setRemainingGuesses(10 - guessesCount)
  }, [isConnected, address, showErrorAlert, clearAlert])

  // 更新剩余猜测次数
  const updateRemainingGuesses = () => {
    const today = new Date().toISOString().split('T')[0]
    const guessesKey = `${address}-${today}-guesses`
    const usedGuesses = parseInt(localStorage.getItem(guessesKey) || '0')
    const newUsedGuesses = usedGuesses + 1
    localStorage.setItem(guessesKey, newUsedGuesses.toString())
    setRemainingGuesses(10 - newUsedGuesses)
  }

  const [isHardMode, setIsHardMode] = useState(
    localStorage.getItem('gameMode')
      ? localStorage.getItem('gameMode') === 'hard'
      : false
  )

  // 首次加载游戏时显示教程
  useEffect(() => {
    // 如果没有找到已保存的游戏状态
    // 显示游戏说明模态框
    if (!loadGameStateFromLocalStorage()) {
      setTimeout(() => {
        setIsInfoModalOpen(true)
      }, WELCOME_INFO_MODAL_MS)
    }
  }, [])

  useEffect(() => {
    DISCOURAGE_INAPP_BROWSERS &&
      isInAppBrowser() &&
      showErrorAlert(DISCOURAGE_INAPP_BROWSER_TEXT, {
        persist: false,
        durationMs: 7000,
      })
  }, [showErrorAlert])

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    if (isHighContrastMode) {
      document.documentElement.classList.add('high-contrast')
    } else {
      document.documentElement.classList.remove('high-contrast')
    }
  }, [isDarkMode, isHighContrastMode])

  const handleDarkMode = (isDark: boolean) => {
    setIsDarkMode(isDark)
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }

  const handleHardMode = (isHard: boolean) => {
    if (guesses.length === 0 || localStorage.getItem('gameMode') === 'hard') {
      setIsHardMode(isHard)
      localStorage.setItem('gameMode', isHard ? 'hard' : 'normal')
    } else {
      // 提示用户只能在游戏开始时启用困难模式
      showErrorAlert(HARD_MODE_ALERT_MESSAGE)
    }
  }

  const handleHighContrastMode = (isHighContrast: boolean) => {
    setIsHighContrastMode(isHighContrast)
    setStoredIsHighContrastMode(isHighContrast)
  }

  // 处理移动到下一个单词的逻辑
  const onNextWord = () => {
    // 先关闭所有模态框
    setIsWordDetailModalOpen(false)
    setIsStatsModalOpen(false)
    
    // 清除任何显示的错误提示，特别是"The word was..."
    clearAlert()
    
    // 延迟300ms后更新游戏状态
    setTimeout(() => {
      const newState = markCurrentWordAsCompleted()
      const nextWord = newState.words[newState.currentWordIndex]
      setSolution(nextWord)
      setCurrentWordLength(nextWord.length)
      setDailyProgress(getDailyProgress())
      setGuesses([])
      setIsGameWon(false)
      setIsGameLost(false)
      setCurrentGuess('')
      // Reset chat message to the first one
      setAiMessageIndex(0)
      setAiMessage(WORBOO_CHAT_MESSAGES[0])
    }, 300)
  }

  const clearCurrentRowClass = () => {
    setCurrentRowClass('')
  }

  useEffect(() => {
    saveGameStateToLocalStorage({ guesses, solution: solutionText })
  }, [guesses])

  // 监听游戏状态变化，更新进度
  useEffect(() => {
    setDailyProgress(getDailyProgress())
  }, [guesses, isGameWon, isGameLost])

  useEffect(() => {
    // 游戏胜利时的处理
    // 处理游戏胜利状态
    if (isGameWon) {
      const winMessage =
        WIN_MESSAGES[Math.floor(Math.random() * WIN_MESSAGES.length)]
      const delayMs = REVEAL_TIME_MS * solution.length

      showSuccessAlert(winMessage, {
        delayMs,
        onClose: () => {
          setIsWordDetailModalOpen(true)
          setTimeout(() => setIsStatsModalOpen(true), 100)
        },
      })
    }

    // 处理游戏失败状态
    if (isGameLost) {
      setTimeout(() => {
        setIsWordDetailModalOpen(true)
        setTimeout(() => setIsStatsModalOpen(true), 100)
      }, (solution.length + 1) * REVEAL_TIME_MS)
    }
  }, [isGameWon, isGameLost, showSuccessAlert])

  const onChar = (value: string) => {
    if (!isConnected) {
      showErrorAlert('Please connect your wallet first', { persist: false })
      return
    }
    
    const remainingGuessesForWord = getRemainingGuessesForCurrentWord()
    // 检查是否已用完当前单词的猜测次数
    if (remainingGuessesForWord <= 0) {
      showErrorAlert('You have used all 6 guesses for this word') // 提示已用完6次猜测机会
      return
    }
    
    if (
      unicodeLength(`${currentGuess}${value}`) <= currentWordLength &&
      !isGameWon
    ) {
      setCurrentGuess(`${currentGuess}${value}`)
    }
  }

  const onDelete = () => {
    setCurrentGuess(
      new GraphemeSplitter().splitGraphemes(currentGuess).slice(0, -1).join('')
    )
  }

  const onEnter = () => {
    if (!isConnected) {
      showErrorAlert('Please connect your wallet first', { persist: false })
      return
    }
    
    const remainingGuessesForWord = getRemainingGuessesForCurrentWord()
    // 检查是否已用完当前单词的猜测次数
    if (remainingGuessesForWord <= 0) {
      showErrorAlert('You have used all 6 guesses for this word') // 提示已用完6次猜测机会
      return
    }
    
    if (isGameWon || isGameLost) {
      return
    }

    const guessLength = unicodeLength(currentGuess)
    if (guessLength !== currentWordLength) {
      setCurrentRowClass('jiggle')
      // 根据输入长度显示不同的错误提示：字母不足或超出长度限制
      const message = guessLength < currentWordLength ? NOT_ENOUGH_LETTERS_MESSAGE : `Word must be ${currentWordLength} letters long`
      return showErrorAlert(message, {
        onClose: clearCurrentRowClass,
      })
    }

    // Temporarily disable word validation
    // if (!isWordInWordList(currentGuess)) {
    //   setCurrentRowClass('jiggle')
    //   return showErrorAlert(WORD_NOT_FOUND_MESSAGE, {
    //     onClose: clearCurrentRowClass,
    //   })
    // }

    // enforce hard mode - all guesses must contain all previously revealed letters
    if (isHardMode) {
      // 困难模式下检查是否使用了所有已揭示的字母
      const firstMissingReveal = findFirstUnusedReveal(currentGuess, guesses)
      if (firstMissingReveal) {
        setCurrentRowClass('jiggle') // 添加抖动效果
        return showErrorAlert(firstMissingReveal, {
          onClose: clearCurrentRowClass,
        })
      }
    }

    setIsRevealing(true)
    // turn this back off after all
    // chars have been revealed
    setTimeout(() => {
      setIsRevealing(false)
    }, REVEAL_TIME_MS * solution.length)

    const winningWord = isWinningWord(currentGuess)

    if (
      unicodeLength(currentGuess) === solution.length &&
      guesses.length < MAX_CHALLENGES &&
      !isGameWon
    ) {
      setGuesses([...guesses, currentGuess])
      setCurrentGuess('')

      setIsAiThinking(true)
      setTimeout(() => {
        const nextIndex = (aiMessageIndex + 1) % WORBOO_CHAT_MESSAGES.length
        setAiMessageIndex(nextIndex)
        setAiMessage(WORBOO_CHAT_MESSAGES[nextIndex])
        setIsAiThinking(false)
      }, REVEAL_TIME_MS * solution.length)

      if (winningWord) {
        // 猜对了，增加猜测次数并更新统计
        incrementGuessesForCurrentWord()
        setStats(addStatsForCompletedGame(stats, guesses.length))
        setIsGameWon(true)
        return
      } else if (guesses.length >= MAX_CHALLENGES) {
        setIsGameLost(true)
        return
      }

      const guessCount = incrementGuessesForCurrentWord()
      if (guessCount >= MAX_CHALLENGES) {
        setStats(addStatsForCompletedGame(stats, guesses.length + 1))
        setIsGameLost(true)
        const newState = markCurrentWordAsCompleted() // Mark as failed
        
        if (getDailyProgress().completed >= 10) {
          // All words attempted, show final stats
          setTimeout(() => {
            setIsWordDetailModalOpen(true)
            setTimeout(() => setIsStatsModalOpen(true), 100)
          }, REVEAL_TIME_MS * solution.length + 1)
        } else {
          // Show current word details before moving to next word
          setTimeout(() => {
            setIsWordDetailModalOpen(true)
          }, REVEAL_TIME_MS * solution.length + 1)
        }
        showErrorAlert(CORRECT_WORD_MESSAGE(solution.text), {
          persist: true,
          delayMs: REVEAL_TIME_MS * solution.length + 1,
        })
      }
    }
  }

  return (
    <div className="h-screen flex flex-col relative">
      <div className="absolute inset-0 z-0">
        <Spline scene="https://prod.spline.design/L1yMm4bIAw49zQIR/scene.splinecode" />
      </div>
      <div className="relative z-10 flex flex-col h-full backdrop-blur-sm bg-white/30 dark:bg-black/30">
      <Navbar
        setIsInfoModalOpen={setIsInfoModalOpen}
        setIsStatsModalOpen={setIsStatsModalOpen}
        setIsSettingsModalOpen={setIsSettingsModalOpen}
        dailyProgress={{
          completed: getDailyProgress().completed,
          total: 10,
          currentIndex: getDailyProgress().completed
        }}
      />
      <div className="pt-2 px-1 pb-8 md:max-w-7xl w-full mx-auto sm:px-6 lg:px-8 flex flex-col grow">
        <div className="pb-6 grow">
          <div className="text-center mb-4 text-xl font-bold dark:text-white">
            The current word length is {currentWordLength}
          </div>
          <div className="relative">
            <Grid
              solution={solutionText}
              guesses={guesses}
              currentGuess={currentGuess}
              isRevealing={isRevealing}
              currentRowClassName={currentRowClass}
              wordLength={currentWordLength}
            />
            <div className="absolute left-[80%] top-1/2 -translate-y-1/2">
              <ChatBubble message={aiMessage} isLoading={isAiThinking} />
              <div className="mt-12 flex justify-center">
                <img 
                  src="/worboo/worboo-unruly.png" 
                  alt="Worboo" 
                  className="w-60 h-60 animate-bounce duration-[2000ms]" 
                />
              </div>
            </div>
          </div>
          {/* 将气泡提示放在 Grid 下、Keyboard 上 */}
          {!isWordDetailModalOpen && (isGameWon || isGameLost) && (
            <div
              className="cursor-pointer text-center mt-4 text-red-500"
              onClick={() => setIsWordDetailModalOpen(true)}
            >
              {CORRECT_WORD_MESSAGE(solutionText)}
            </div>
          )}
        </div>
        <Keyboard
          onChar={onChar}
          onDelete={onDelete}
          onEnter={onEnter}
          solution={solutionText}
          guesses={guesses}
          isRevealing={isRevealing}
        />
        <InfoModal
          isOpen={isInfoModalOpen}
          handleClose={() => setIsInfoModalOpen(false)}
        />
        <StatsModal
          isOpen={isStatsModalOpen}
          handleClose={() => setIsStatsModalOpen(false)}
          solution={solutionText}
          guesses={guesses}
          gameStats={stats}
          isGameLost={isGameLost}
          isGameWon={isGameWon}
          handleShareToClipboard={() => showSuccessAlert(GAME_COPIED_MESSAGE)}
          handleMigrateStatsButton={() => {
            setIsStatsModalOpen(false)
            setIsMigrateStatsModalOpen(true)
          }}
          isHardMode={isHardMode}
          isDarkMode={isDarkMode}
          isHighContrastMode={isHighContrastMode}
          numberOfGuessesMade={guesses.length}
          dailyProgress={dailyProgress}
        />
        <MigrateStatsModal
          isOpen={isMigrateStatsModalOpen}
          handleClose={() => setIsMigrateStatsModalOpen(false)}
        />
        <SettingsModal
          isOpen={isSettingsModalOpen}
          handleClose={() => setIsSettingsModalOpen(false)}
          isHardMode={isHardMode}
          handleHardMode={handleHardMode}
          isDarkMode={isDarkMode}
          handleDarkMode={handleDarkMode}
          isHighContrastMode={isHighContrastMode}
          handleHighContrastMode={handleHighContrastMode}
        />
        <AlertContainer />
        <WordDetailModal
          isOpen={isWordDetailModalOpen}
          handleClose={() => setIsWordDetailModalOpen(false)}
          word={solution}
          showNext={isGameWon || isGameLost}
          onNext={onNextWord}
        />
      </div>
      </div>
    </div>
  )
}

export default Home
