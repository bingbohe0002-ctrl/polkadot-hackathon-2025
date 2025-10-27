import { MAX_CHALLENGES } from '../../constants/settings'
import { CompletedRow, CompletedVerifyRow } from './CompletedRow'
import { CurrentRow } from './CurrentRow'
import { EmptyRow } from './EmptyRow'

type Props = {
  solution: string
  guesses: string[]
  currentGuess: string
  isRevealing?: boolean
  currentRowClassName: string
  showDefinition?: boolean
  wordLength?: number
}

export const Grid = ({
  solution,
  guesses,
  currentGuess,
  isRevealing,
  currentRowClassName,
  showDefinition,
  wordLength = 5,
}: Props) => {
  const empties =
    guesses.length < MAX_CHALLENGES - 1
      ? Array.from(Array(MAX_CHALLENGES - 1 - guesses.length))
      : []

  return (
    <>
      {guesses.map((guess, i) => (
        <CompletedRow
          key={i}
          solution={solution}
          guess={guess}
          isRevealing={isRevealing && guesses.length - 1 === i}
          showDefinition={showDefinition}
          wordLength={wordLength}
        />
      ))}
      {guesses.length < MAX_CHALLENGES && (
        <CurrentRow guess={currentGuess} className={currentRowClassName} wordLength={wordLength} />
      )}
      {empties.map((_, i) => (
        <EmptyRow key={i} wordLength={wordLength} />
      ))}
    </>
  )
}

type VerifyProps = {
  solution: string
  diffs: number[][][]
}

export const VerifyGrid = ({ solution, diffs }: VerifyProps) => {
  return (
    <>
      {diffs.map((diff, i) => (
        <CompletedVerifyRow
          key={i}
          solution={solution}
          diff={diff}
          isRevealing={false}
        />
      ))}
    </>
  )
}
