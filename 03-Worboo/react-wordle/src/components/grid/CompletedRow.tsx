import { diffToStatus, getGuessStatuses } from '../../lib/statuses'
import { Cell } from './Cell'
import { unicodeSplit, currentWord } from '../../lib/words'

type Props = {
  solution: string
  guess: string
  isRevealing?: boolean
  showDefinition?: boolean
  wordLength?: number
}

export const CompletedRow = ({ solution, guess, isRevealing, showDefinition }: Props) => {
  const statuses = getGuessStatuses(solution, guess)
  const splitGuess = unicodeSplit(guess)
  const isWinningRow = solution === guess

  return (
    <div className={`flex flex-col items-center mb-1 ${isWinningRow && showDefinition ? 'gap-2' : ''}`}>
      <div className="flex justify-center">
        {splitGuess.map((letter, i) => (
          <Cell
            key={i}
            value={letter}
            status={statuses[i]}
            position={i}
            isRevealing={isRevealing}
            isCompleted
          />
        ))}
      </div>
      {isWinningRow && showDefinition && (
        <div className="text-sm text-gray-500 dark:text-gray-400 flex flex-col items-center gap-1">
          <div>{currentWord.chineseDef}</div>
          <div>{currentWord.englishDef}</div>
        </div>
      )}
    </div>
  )
}

type VerifyProps = {
  solution: string
  diff: number[][]
  isRevealing?: boolean
}

export const CompletedVerifyRow = ({ diff, isRevealing }: VerifyProps) => {
  const statuses = diffToStatus(diff)
  const splitSolution = unicodeSplit('fluff')

  return (
    <div className="flex justify-center mb-1">
      {splitSolution.map((letter, i) => (
        <Cell
          key={i}
          value={''}
          status={statuses[i]}
          position={i}
          isRevealing={isRevealing}
          isCompleted
        />
      ))}
    </div>
  )
}
