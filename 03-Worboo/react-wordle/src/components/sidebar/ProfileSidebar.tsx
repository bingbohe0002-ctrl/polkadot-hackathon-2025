import { Fragment, useState } from 'react'
import { Dialog, Transition, Disclosure } from '@headlessui/react'
import {
  XIcon,
  UserIcon,
  UsersIcon,
  ChartBarIcon,
  BookOpenIcon,
  GiftIcon,
  ChevronDownIcon,
  PlusIcon,
  ClipboardCopyIcon,
} from '@heroicons/react/outline'
import { FriendSearchModal } from '../modals/FriendSearchModal'
import { FriendProfileCard } from '../friends/FriendProfileCard'
import {
  FRIEND_ADD_BUTTON,
  FRIEND_LIST_TITLE,
  FRIEND_PROFILE_CHALLENGE_BUTTON,
  FRIEND_PROFILE_LEVEL,
} from '../../constants/strings'

type DisclosureRenderProps = {
  open: boolean
}

interface Props {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

type Friend = {
  id: string
  username: string
  level: number
  ocid: string
  bio: string
  avatar?: string
  lastActive?: string
}

export const ProfileSidebar = ({ isOpen, setIsOpen }: Props) => {
  const contributionData = Array(365).fill(0).map(() => Math.floor(Math.random() * 4))
  const [isFriendSearchOpen, setIsFriendSearchOpen] = useState(false)
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const [friends, setFriends] = useState<Friend[]>([
    {
      id: '1',
      username: 'Player 1',
      level: 10,
      ocid: '0x1234...5678',
      bio: 'Learning English with Worboo! Let\'s make learning fun together.',
      lastActive: 'Today'
    },
    {
      id: '2',
      username: 'Player 2',
      level: 20,
      ocid: '0x2345...6789',
      bio: 'English enthusiast and Worboo lover!',
      lastActive: 'Yesterday'
    },
    {
      id: '3',
      username: 'Player 3',
      level: 30,
      ocid: '0x3456...7890',
      bio: 'On a journey to master English through Worboo.',
      lastActive: '3 days ago'
    },
  ])
  
  const handleAddFriend = (newFriend: any) => {
    setFriends([...friends, {
      ...newFriend,
      lastActive: 'Just now'
    }])
  }
  
  const openFriendProfile = (friend: Friend) => {
    setSelectedFriend(friend)
  }
  
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={setIsOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 left-0 flex max-w-full">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500"
                enterFrom="-translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500"
                leaveFrom="translate-x-0"
                leaveTo="-translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto relative w-96">
                  <div className="flex h-full flex-col overflow-y-auto bg-white dark:bg-gray-900 shadow-xl">
                    <div className="px-4 py-6 sm:px-6">
                      <div className="flex items-center justify-between">
                        <Dialog.Title className="text-xl font-semibold leading-6 text-gray-900 dark:text-gray-100">
                          Profile
                        </Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                            onClick={() => setIsOpen(false)}
                          >
                            <XIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* User Info */}
                    <div className="px-4 py-5 sm:px-6 border-t border-gray-200 dark:border-gray-700">
                      {/* Avatar and Basic Info */}
                      <div className="flex justify-between items-start">
                        <div className="flex items-start space-x-4">
                          <div className="relative group">
                            <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center transform transition-all duration-200 group-hover:scale-105 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ring-blue-500/50">
                              <UserIcon className="h-8 w-8 text-white" />
                            </div>
                            <div className="absolute -bottom-1 right-0 h-6 w-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center ring-2 ring-white dark:ring-gray-900">
                              <span className="text-xs font-bold text-white">42</span>
                            </div>
                          </div>
                          <div className="pt-1">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">alfred.edu</h3>
                          </div>
                        </div>
                        <button 
                          className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
                          onClick={() => setIsFriendSearchOpen(true)}
                        >
                          <PlusIcon className="h-4 w-4 mr-1.5" />
                          {FRIEND_ADD_BUTTON}
                        </button>
                      </div>

                      {/* OCID and Bio */}
                      <div className="mt-4 space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-800/30 border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">OCID:</span>
                              <code className="px-2.5 py-1 text-sm font-mono font-medium bg-white dark:bg-gray-800 rounded-md text-blue-600 dark:text-blue-400 border border-gray-200 dark:border-gray-700">0x1234...5678</code>
                            </div>
                          </div>
                          <button className="group p-1.5 rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors focus:outline-none" title="Copy OCID">
                            <ClipboardCopyIcon className="h-5 w-5 transition-transform group-hover:scale-110" />
                          </button>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                          Learning English with Worboo! Let's make learning fun and engaging together. 
                        </p>
                      </div>
                    </div>

                    {/* Contribution Graph */}
                    <div className="px-4 py-6 sm:px-6 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Activity</h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Score:</span>
                          <span className="text-lg font-semibold text-green-600 dark:text-green-400">1337</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        {Array.from({ length: 7 }).map((_, row) => (
                          <div key={row} className="flex gap-1 justify-center">
                            {Array.from({ length: 20 }).map((_, col) => {
                              const value = Math.floor(Math.random() * 4)
                              return (
                                <div
                                  key={`${row}-${col}`}
                                  className={`
                                    w-3 h-3 rounded-sm
                                    ${value === 0 ? 'bg-gray-200 dark:bg-gray-700' :
                                      value === 1 ? 'bg-green-300 dark:bg-green-700' :
                                      value === 2 ? 'bg-green-500 dark:bg-green-600' :
                                      'bg-green-700 dark:bg-green-500'}
                                  `}
                                  title={`${value} contributions`}
                                />
                              )
                            })}
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>Less</span>
                        <div className="flex gap-1">
                          <div className="w-3 h-3 rounded-sm bg-gray-200 dark:bg-gray-700" />
                          <div className="w-3 h-3 rounded-sm bg-green-300 dark:bg-green-700" />
                          <div className="w-3 h-3 rounded-sm bg-green-500 dark:bg-green-600" />
                          <div className="w-3 h-3 rounded-sm bg-green-700 dark:bg-green-500" />
                        </div>
                        <span>More</span>
                      </div>
                    </div>

                    {/* Navigation Links */}
                    <nav className="px-4 py-6 sm:px-6 border-t border-gray-200 dark:border-gray-700">
                      <div className="space-y-2">
                        <Disclosure>
                          {({ open }) => (
                            <>
                              <Disclosure.Button className="flex w-full items-center justify-between rounded-lg bg-blue-50 dark:bg-blue-900/20 px-4 py-3 text-left hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                                <div className="flex items-center space-x-3">
                                  <UsersIcon className="h-6 w-6 text-blue-500 dark:text-blue-400" />
                                  <span className="font-medium text-blue-900 dark:text-blue-100">{FRIEND_LIST_TITLE}</span>
                                </div>
                                <ChevronDownIcon
                                  className={`${open ? 'rotate-180 transform' : ''} h-5 w-5 text-blue-500`}
                                />
                              </Disclosure.Button>
                              <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-gray-600 dark:text-gray-300">
                                <div className="space-y-3">
                                  {friends.map((friend) => (
                                    <div key={friend.id} className="flex items-center justify-between">
                                      <div 
                                        className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg w-full transition-colors"
                                        onClick={() => openFriendProfile(friend)}
                                      >
                                        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                                          <span className="text-white font-bold">{friend.username.charAt(0)}</span>
                                        </div>
                                        <div>
                                          <div className="font-medium">{friend.username}</div>
                                          <div className="text-xs text-gray-500 dark:text-gray-400">{FRIEND_PROFILE_LEVEL} {friend.level}</div>
                                        </div>
                                      </div>
                                      <button className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300">
                                        {FRIEND_PROFILE_CHALLENGE_BUTTON}
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </Disclosure.Panel>
                            </>
                          )}
                        </Disclosure>

                        <Disclosure>
                          {({ open }) => (
                            <>
                              <Disclosure.Button className="flex w-full items-center justify-between rounded-lg bg-green-50 dark:bg-green-900/20 px-4 py-3 text-left hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                                <div className="flex items-center space-x-3">
                                  <ChartBarIcon className="h-6 w-6 text-green-500 dark:text-green-400" />
                                  <span className="font-medium text-green-900 dark:text-green-100">Global Leaderboard</span>
                                </div>
                                <ChevronDownIcon
                                  className={`${open ? 'rotate-180 transform' : ''} h-5 w-5 text-green-500`}
                                />
                              </Disclosure.Button>
                              <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-gray-600 dark:text-gray-300">
                                <div className="space-y-3">
                                  {[1,2,3].map((rank) => (
                                    <div key={rank} className="flex items-center space-x-4">
                                      <span className="font-bold text-lg w-6">{rank}</span>
                                      <div className="flex items-center space-x-3 flex-1">
                                        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-yellow-500 to-red-500"></div>
                                        <div>
                                          <div className="font-medium">Top Player {rank}</div>
                                          <div className="text-xs text-gray-500 dark:text-gray-400">Score: {10000 - rank * 1000}</div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </Disclosure.Panel>
                            </>
                          )}
                        </Disclosure>

                        <Disclosure>
                          {({ open }) => (
                            <>
                              <Disclosure.Button className="flex w-full items-center justify-between rounded-lg bg-purple-50 dark:bg-purple-900/20 px-4 py-3 text-left hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                                <div className="flex items-center space-x-3">
                                  <GiftIcon className="h-6 w-6 text-purple-500 dark:text-purple-400" />
                                  <span className="font-medium text-purple-900 dark:text-purple-100">Worboo Badge</span>
                                </div>
                                <ChevronDownIcon
                                  className={`${open ? 'rotate-180 transform' : ''} h-5 w-5 text-purple-500`}
                                />
                              </Disclosure.Button>
                              <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-gray-600 dark:text-gray-300">
                                <div className="grid grid-cols-4 gap-2">
                                  {Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center hover:border-purple-500 dark:hover:border-purple-400 cursor-pointer transition-colors">
                                      {i < 3 && (
                                        <div className="w-full h-full rounded-md bg-gradient-to-br from-purple-500 to-pink-500"></div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </Disclosure.Panel>
                            </>
                          )}
                        </Disclosure>

                        <Disclosure>
                          {({ open }) => (
                            <>
                              <Disclosure.Button className="flex w-full items-center justify-between rounded-lg bg-orange-50 dark:bg-orange-900/20 px-4 py-3 text-left hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors">
                                <div className="flex items-center space-x-3">
                                  <BookOpenIcon className="h-6 w-6 text-orange-500 dark:text-orange-400" />
                                  <span className="font-medium text-orange-900 dark:text-orange-100">NFT Season</span>
                                </div>
                                <ChevronDownIcon
                                  className={`${open ? 'rotate-180 transform' : ''} h-5 w-5 text-orange-500`}
                                />
                              </Disclosure.Button>
                              <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-gray-600 dark:text-gray-300">
                                <div className="space-y-4">
                                  {[1,2].map((season) => (
                                    <div key={season} className="space-y-2">
                                      <h4 className="font-medium text-base">Season {season}</h4>
                                      <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {season === 1 ? 'The beginning of your Worboo journey...' : 'More adventures await...'}
                                      </p>
                                      <div className="h-24 rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center text-white font-medium">
                                        {season === 1 ? 'Unlocked' : 'Locked'}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </Disclosure.Panel>
                            </>
                          )}
                        </Disclosure>
                      </div>
                    </nav>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
      
      {/* Friend Search Modal */}
      <FriendSearchModal 
        isOpen={isFriendSearchOpen}
        handleClose={() => setIsFriendSearchOpen(false)}
        onAddFriend={handleAddFriend}
      />
      
      {/* Friend Profile Card */}
      {selectedFriend && (
        <FriendProfileCard
          friend={selectedFriend}
          isOpen={!!selectedFriend}
          onClose={() => setSelectedFriend(null)}
        />
      )}
    </Transition.Root>
  )
}
