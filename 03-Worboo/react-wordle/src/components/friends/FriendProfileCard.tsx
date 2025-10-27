import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XIcon, UserIcon, ClipboardCopyIcon, ChatIcon, GiftIcon } from '@heroicons/react/outline'
import {
  FRIEND_PROFILE_LAST_ACTIVE,
  FRIEND_PROFILE_LEVEL,
  FRIEND_PROFILE_OCID,
  FRIEND_PROFILE_MESSAGE_BUTTON,
  FRIEND_PROFILE_GIFT_BUTTON,
  FRIEND_PROFILE_COPY_OCID,
  FRIEND_PROFILE_COPIED_OCID,
  SHOP_ITEMS
} from '../../constants/strings'

type Friend = {
  id: string
  username: string
  level: number
  ocid: string
  bio: string
  avatar?: string
  lastActive?: string
  worbooPet?: string
}

type Props = {
  friend: Friend
  isOpen: boolean
  onClose: () => void
}

export const FriendProfileCard = ({ friend, isOpen, onClose }: Props) => {
  const [copied, setCopied] = useState(false)

  const copyOcid = () => {
    navigator.clipboard.writeText(friend.ocid)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[55]" onClose={onClose}>
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-900 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
                <div>
                  <div className="absolute right-0 top-0 pr-4 pt-4">
                    <button
                      type="button"
                      className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                      onClick={onClose}
                    >
                      <XIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    {/* Avatar */}
                    <div className="relative mb-4">
                      <div className="h-24 w-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center transform transition-all duration-200 hover:scale-105 ring-4 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ring-blue-500/50">
                        {friend.avatar ? (
                          <img 
                            src={friend.avatar} 
                            alt={friend.username} 
                            className="h-24 w-24 rounded-full object-cover"
                          />
                        ) : friend.worbooPet ? (
                          <img 
                            src={friend.worbooPet} 
                            alt={friend.username} 
                            className="h-24 w-24 rounded-full object-cover"
                          />
                        ) : (
                          <UserIcon className="h-12 w-12 text-white" />
                        )}
                      </div>
                      <div className="absolute -bottom-1 right-0 h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center ring-2 ring-white dark:ring-gray-900">
                        <span className="text-xs font-bold text-white">{friend.level}</span>
                      </div>
                    </div>
                    
                    {/* Username */}
                    <Dialog.Title as="h3" className="text-xl font-bold text-gray-900 dark:text-white">
                      {friend.username}
                    </Dialog.Title>
                    
                    {/* Last Active */}
                    {friend.lastActive && (
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {FRIEND_PROFILE_LAST_ACTIVE} {friend.lastActive}
                      </p>
                    )}
                    
                    {/* OCID */}
                    <div className="mt-4 w-full flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-800/30 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{FRIEND_PROFILE_OCID}</span>
                        <code className="px-2 py-1 text-sm font-mono font-medium bg-white dark:bg-gray-800 rounded-md text-blue-600 dark:text-blue-400 border border-gray-200 dark:border-gray-700">
                          {friend.ocid.slice(0, 6)}...{friend.ocid.slice(-4)}
                        </code>
                      </div>
                      <button 
                        className="group p-1.5 rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors focus:outline-none" 
                        title={copied ? FRIEND_PROFILE_COPIED_OCID : FRIEND_PROFILE_COPY_OCID}
                        onClick={copyOcid}
                      >
                        <ClipboardCopyIcon className={`h-5 w-5 transition-transform group-hover:scale-110 ${copied ? "text-green-500" : ""}`} />
                      </button>
                    </div>
                    
                    {/* Bio */}
                    <div className="mt-3 w-full">
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                        {friend.bio}
                      </p>
                    </div>
                    
                    {/* Worboo Pet Display (if available) */}
                    {friend.worbooPet && (
                      <div className="mt-4 w-full">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Favorite Worboo</h4>
                        <div className="flex justify-center">
                          <div className="h-16 w-16 rounded-lg overflow-hidden border-2 border-blue-500/30 dark:border-blue-500/20">
                            <img 
                              src={friend.worbooPet} 
                              alt="Worboo Pet" 
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="mt-6 w-full grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        className="inline-flex justify-center items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
                      >
                        <ChatIcon className="h-5 w-5 mr-2" />
                        {FRIEND_PROFILE_MESSAGE_BUTTON}
                      </button>
                      <button
                        type="button"
                        className="inline-flex justify-center items-center px-4 py-2.5 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
                      >
                        <GiftIcon className="h-5 w-5 mr-2" />
                        {FRIEND_PROFILE_GIFT_BUTTON}
                      </button>
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
