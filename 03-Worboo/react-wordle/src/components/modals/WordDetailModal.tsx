import { BaseModal } from './BaseModal'
import { Word } from '../../constants/wordlistCET4'

type Props = {
  isOpen: boolean
  handleClose: () => void
  word: Word | null
  onNext?: () => void
  showNext?: boolean
}

export const WordDetailModal = ({
  isOpen,
  handleClose,
  word,
  onNext,
  showNext = false,
}: Props) => {
  if (!word) return null

  return (
    <BaseModal
      title="Word Details"
      isOpen={isOpen}
      handleClose={handleClose}
    >
      <div className="flex flex-col space-y-4">
        <div className="text-2xl font-bold text-center dark:text-white">
          {word.text}
        </div>
        
        <div className="mt-4">
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Chinese Definition
          </h4>
          <p className="text-gray-500 dark:text-gray-300">
            {word.chineseDef}
          </p>
        </div>

        {word.englishDef && (
          <div className="mt-4">
            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              English Definition
            </h4>
            <p className="text-gray-500 dark:text-gray-300">
              {word.englishDef}
            </p>
          </div>
        )}

        {showNext && (
          <div className="mt-5 sm:mt-6">
            <button
              type="button"
              className="w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
              onClick={() => {
                if (onNext) onNext()
                handleClose()
              }}
            >
              Next Word
            </button>
          </div>
        )}
      </div>
    </BaseModal>
  )
}
