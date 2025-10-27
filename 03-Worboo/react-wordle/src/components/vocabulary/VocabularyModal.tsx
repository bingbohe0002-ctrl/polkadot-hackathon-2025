import { Fragment, useState } from 'react'
import { Transition, Dialog, Tab } from '@headlessui/react'
import { XIcon } from '@heroicons/react/outline'
import {
  VOCABULARY_TITLE,
  VOCABULARY_SUBTITLE,
  VOCABULARY_TABS,
  VOCABULARY_DESCRIPTIONS,
  LEARNING_PLAN_TITLE,
  LEARNING_PLAN_SUBTITLE,
  LEARNING_PLAN_OPTIONS,
  VocabularySet
} from '../../constants/strings'

type Props = {
  isOpen: boolean
  handleClose: () => void
}

export const VocabularyModal = ({ isOpen, handleClose }: Props) => {
  const [activeTab, setActiveTab] = useState(VOCABULARY_TABS[0])
  const [selectedLearningPlan, setSelectedLearningPlan] = useState(LEARNING_PLAN_OPTIONS[1].id) // Default to intermediate
  const [customWordsPerDay, setCustomWordsPerDay] = useState(10)
  const [activeVocabularySets, setActiveVocabularySets] = useState<Record<string, boolean>>({
    'Junior High': true,
    'Senior High': false,
    'CET-4': false,
    'CET-6': false,
    'IELTS': false,
    'TOEFL': false,
    'SAT': false
  })

  // Mock vocabulary sets for each category
  const getVocabularySets = (category: string): VocabularySet[] => {
    switch (category) {
      case 'Junior High':
        return [
          { id: 'jh-basic', name: 'Basic Words', description: 'Fundamental vocabulary for beginners', wordCount: 500, difficulty: 'Easy', isActive: true },
          { id: 'jh-common', name: 'Common Words', description: 'Frequently used words in daily conversations', wordCount: 800, difficulty: 'Easy', isActive: false }
        ]
      case 'Senior High':
        return [
          { id: 'sh-essential', name: 'Essential Words', description: 'Core vocabulary for high school students', wordCount: 1200, difficulty: 'Medium', isActive: true },
          { id: 'sh-advanced', name: 'Advanced Words', description: 'Advanced vocabulary for high school students', wordCount: 1500, difficulty: 'Medium', isActive: false }
        ]
      case 'CET-4':
        return [
          { id: 'cet4-core', name: 'CET-4 Core', description: 'Core vocabulary for CET-4 exam', wordCount: 2500, difficulty: 'Medium', isActive: true },
          { id: 'cet4-complete', name: 'CET-4 Complete', description: 'Complete vocabulary list for CET-4', wordCount: 4000, difficulty: 'Medium', isActive: false }
        ]
      case 'CET-6':
        return [
          { id: 'cet6-core', name: 'CET-6 Core', description: 'Core vocabulary for CET-6 exam', wordCount: 3500, difficulty: 'Hard', isActive: true },
          { id: 'cet6-complete', name: 'CET-6 Complete', description: 'Complete vocabulary list for CET-6', wordCount: 5500, difficulty: 'Hard', isActive: false }
        ]
      case 'IELTS':
        return [
          { id: 'ielts-academic', name: 'IELTS Academic', description: 'Vocabulary for IELTS Academic test', wordCount: 4500, difficulty: 'Hard', isActive: true },
          { id: 'ielts-general', name: 'IELTS General', description: 'Vocabulary for IELTS General Training', wordCount: 4000, difficulty: 'Hard', isActive: false }
        ]
      case 'TOEFL':
        return [
          { id: 'toefl-essential', name: 'TOEFL Essential', description: 'Essential vocabulary for TOEFL exam', wordCount: 5000, difficulty: 'Very Hard', isActive: true },
          { id: 'toefl-advanced', name: 'TOEFL Advanced', description: 'Advanced vocabulary for TOEFL exam', wordCount: 7000, difficulty: 'Very Hard', isActive: false }
        ]
      case 'SAT':
        return [
          { id: 'sat-core', name: 'SAT Core', description: 'Core vocabulary for SAT exam', wordCount: 4500, difficulty: 'Very Hard', isActive: true },
          { id: 'sat-complete', name: 'SAT Complete', description: 'Complete vocabulary list for SAT', wordCount: 8000, difficulty: 'Very Hard', isActive: false }
        ]
      default:
        return []
    }
  }

  const toggleVocabularySet = (setId: string, category: string) => {
    const sets = getVocabularySets(category)
    const updatedSets = sets.map(set => ({
      ...set,
      isActive: set.id === setId ? !set.isActive : set.isActive
    }))
    
    // In a real app, you would update this in a database or state management
    console.log('Updated vocabulary sets:', updatedSets)
  }

  const toggleCategory = (category: string) => {
    setActiveVocabularySets(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  const handleSaveLearningPlan = () => {
    const wordsPerDay = selectedLearningPlan === 'custom' 
      ? customWordsPerDay 
      : LEARNING_PLAN_OPTIONS.find(option => option.id === selectedLearningPlan)?.wordsPerDay || 10
    
    // In a real app, you would save this to a database or state management
    console.log('Learning plan saved:', {
      plan: selectedLearningPlan,
      wordsPerDay,
      activeCategories: Object.entries(activeVocabularySets)
        .filter(([_, isActive]) => isActive)
        .map(([category]) => category)
    })
    
    handleClose()
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-100 text-green-800'
      case 'Medium':
        return 'bg-blue-100 text-blue-800'
      case 'Hard':
        return 'bg-yellow-100 text-yellow-800'
      case 'Very Hard':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="fixed z-10 inset-0 overflow-y-auto" onClose={handleClose}>
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span
            className="hidden sm:inline-block sm:align-middle sm:h-screen"
            aria-hidden="true"
          >
            &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  className="bg-white dark:bg-gray-800 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={handleClose}
                >
                  <span className="sr-only">Close</span>
                  <XIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <Dialog.Title
                    as="h3"
                    className="text-lg leading-6 font-medium text-gray-900 dark:text-white"
                  >
                    {VOCABULARY_TITLE}
                  </Dialog.Title>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {VOCABULARY_SUBTITLE}
                  </p>
                  
                  <div className="mt-4">
                    <Tab.Group>
                      <Tab.List className="flex p-1 space-x-1 bg-gray-100 dark:bg-gray-700 rounded-xl">
                        {VOCABULARY_TABS.map((tab) => (
                          <Tab
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={({ selected }) =>
                              `w-full py-2.5 text-sm leading-5 font-medium rounded-lg focus:outline-none focus:ring-2 ring-offset-2 ring-offset-blue-400 ring-white ring-opacity-60 ${
                                selected
                                  ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-white'
                                  : 'text-gray-600 dark:text-gray-200 hover:bg-white/[0.12] hover:text-gray-700'
                              }`
                            }
                          >
                            {tab}
                          </Tab>
                        ))}
                      </Tab.List>
                      <Tab.Panels className="mt-2">
                        {VOCABULARY_TABS.map((tab) => (
                          <Tab.Panel
                            key={tab}
                            className={`bg-white dark:bg-gray-800 rounded-xl p-3 focus:outline-none`}
                          >
                            <div className="mb-4">
                              <div className="flex items-center justify-between">
                                <h4 className="text-md font-medium text-gray-900 dark:text-white">
                                  {tab}
                                </h4>
                                <div className="flex items-center">
                                  <input
                                    id={`toggle-${tab}`}
                                    type="checkbox"
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    checked={activeVocabularySets[tab] || false}
                                    onChange={() => toggleCategory(tab)}
                                  />
                                  <label
                                    htmlFor={`toggle-${tab}`}
                                    className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                                  >
                                    Active
                                  </label>
                                </div>
                              </div>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {VOCABULARY_DESCRIPTIONS[tab as keyof typeof VOCABULARY_DESCRIPTIONS]}
                              </p>
                            </div>
                            
                            <div className="space-y-4">
                              {getVocabularySets(tab).map((set) => (
                                <div
                                  key={set.id}
                                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h5 className="text-md font-medium text-gray-900 dark:text-white">
                                        {set.name}
                                      </h5>
                                      <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {set.description}
                                      </p>
                                      <div className="flex items-center mt-2 space-x-2">
                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                          {set.wordCount} words
                                        </span>
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${getDifficultyColor(set.difficulty)}`}>
                                          {set.difficulty}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center">
                                      <input
                                        id={`toggle-set-${set.id}`}
                                        type="checkbox"
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        checked={set.isActive}
                                        onChange={() => toggleVocabularySet(set.id, tab)}
                                      />
                                      <label
                                        htmlFor={`toggle-set-${set.id}`}
                                        className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                                      >
                                        Active
                                      </label>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </Tab.Panel>
                        ))}
                      </Tab.Panels>
                    </Tab.Group>
                  </div>
                  
                  <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      {LEARNING_PLAN_TITLE}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {LEARNING_PLAN_SUBTITLE}
                    </p>
                    
                    <div className="mt-4 space-y-4">
                      {LEARNING_PLAN_OPTIONS.map((option) => (
                        <div key={option.id} className="flex items-center">
                          <input
                            id={`plan-${option.id}`}
                            name="learning-plan"
                            type="radio"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            checked={selectedLearningPlan === option.id}
                            onChange={() => setSelectedLearningPlan(option.id)}
                          />
                          <label
                            htmlFor={`plan-${option.id}`}
                            className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            {option.name} - {option.description}
                          </label>
                        </div>
                      ))}
                      
                      {selectedLearningPlan === 'custom' && (
                        <div className="ml-7 mt-2">
                          <label
                            htmlFor="custom-words"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            Words per day
                          </label>
                          <input
                            type="number"
                            id="custom-words"
                            className="mt-1 block w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            value={customWordsPerDay}
                            onChange={(e) => setCustomWordsPerDay(parseInt(e.target.value) || 1)}
                            min="1"
                            max="50"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleSaveLearningPlan}
                >
                  Save Settings
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                  onClick={handleClose}
                >
                  Cancel
                </button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
