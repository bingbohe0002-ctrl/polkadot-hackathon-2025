import { useState, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { SearchIcon, UserAddIcon, XIcon } from '@heroicons/react/outline'
import {
  FRIEND_SEARCH_TITLE,
  FRIEND_SEARCH_PLACEHOLDER,
  FRIEND_NOT_FOUND_MESSAGE,
  FRIEND_ADD_BUTTON,
  SHOP_ITEMS
} from '../../constants/strings'

type UserProfile = {
  id: string
  ocid: string
  username: string
  level: number
  bio: string
  worbooPet?: string
}

type Props = {
  isOpen: boolean
  handleClose: () => void
  onAddFriend: (user: UserProfile) => void
}

export const FriendSearchModal = ({ isOpen, handleClose, onAddFriend }: Props) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<UserProfile | null>(null)
  const [error, setError] = useState('')

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setError('Please enter an OCID to search')
      return
    }

    setIsSearching(true)
    setError('')
    
    // Mock API call - in a real app, this would be an actual API call
    setTimeout(() => {
      // Mock user data - in a real app, this would come from the API
      if (searchQuery.includes('0x')) {
        setSearchResult({
          id: '123',
          ocid: searchQuery,
          username: 'worboo_user',
          level: 42,
          bio: 'Learning English with Worboo! Let\'s make learning fun and engaging together. ✨',
          worbooPet: SHOP_ITEMS[Math.floor(Math.random() * SHOP_ITEMS.length)].image
        })
      } else {
        setError(FRIEND_NOT_FOUND_MESSAGE)
        setSearchResult(null)
      }
      setIsSearching(false)
    }, 1000)
  }

  const handleAddFriend = () => {
    if (searchResult) {
      onAddFriend(searchResult)
      handleClose()
    }
  }

  // Using a custom modal implementation instead of BaseModal to control z-index
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[60]" onClose={handleClose}>
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

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
                <div>
                  <div className="absolute right-0 top-0 pr-4 pt-4">
                    <button
                      type="button"
                      className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                      onClick={handleClose}
                    >
                      <XIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  
                  <div className="text-center">
                    <Dialog.Title
                      as="h3"
                      className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100"
                    >
                      {FRIEND_SEARCH_TITLE}
                    </Dialog.Title>
                    
                    <div className="mt-4 space-y-6">
                      <div className="flex items-center space-x-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={FRIEND_SEARCH_PLACEHOLDER}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSearch()
                              }
                            }}
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <button 
                              onClick={handleSearch}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                              <SearchIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {error && (
                        <div className="text-red-500 text-sm">{error}</div>
                      )}

                      {isSearching && (
                        <div className="flex justify-center py-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                      )}

                      {searchResult && (
                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                          <div className="flex space-x-4">
                            {/* Worboo Avatar */}
                            <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center transform transition-all duration-200 group-hover:scale-105 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ring-blue-500/50">
                              {searchResult.worbooPet ? (
                                <img 
                                  src={searchResult.worbooPet} 
                                  alt={searchResult.username} 
                                  className="h-16 w-16 rounded-full object-cover"
                                />
                              ) : (
                                <div className="text-2xl font-bold text-white">
                                  {searchResult.username.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                  {searchResult.username}
                                </h3>
                                <div className="text-sm font-medium text-blue-500 dark:text-blue-400">
                                  Level {searchResult.level}
                                </div>
                              </div>
                              
                              <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                                <span className="mr-1">OCID:</span>
                                <code className="px-1.5 py-0.5 text-xs font-mono bg-gray-100 dark:bg-gray-700 rounded-md">
                                  {searchResult.ocid.slice(0, 6)}...{searchResult.ocid.slice(-4)}
                                </code>
                              </div>
                              
                              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                                {searchResult.bio}
                              </p>
                              
                              <button
                                onClick={handleAddFriend}
                                className="mt-3 inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
                              >
                                <UserAddIcon className="h-4 w-4 mr-1.5" />
                                {FRIEND_ADD_BUTTON}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
