import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  ChartBarIcon,
  CogIcon,
  InformationCircleIcon,
  QuestionMarkCircleIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  GiftIcon,
  UserCircleIcon,
  XIcon,
  BookOpenIcon
} from '@heroicons/react/outline'
import {
  GAME_TITLE,
  DISCORD_URL,
  TELEGRAM_URL,
  SHOP_TITLE,
  SHOP_TABS,
  SHOP_FULL_WORBOO_ITEMS,
  SHOP_BODY_ITEMS,
  SHOP_HEAD_ITEMS,
  SHOP_EYE_ITEMS,
  SHOP_MOUTH_ITEMS,
  SHOP_ACCESSORY_ITEMS,
  SHOP_TREASURE_ITEMS,
  SHOP_ITEMS,
  SHOP_EQUIP_BUTTON,
  SHOP_UNEQUIP_BUTTON,
  SHOP_EQUIPPED_LABEL,
  SHOP_BUY_BUTTON,
  SHOP_OPEN_BUTTON,
  SHOP_SUBTITLE,
  RARITY,
  ShopItem
} from '../../constants/strings'
import { ConnectButton, useConnectModal } from '@rainbow-me/rainbowkit'
import { ProfileSidebar } from '../sidebar/ProfileSidebar'
import { useAccount } from 'wagmi'
import { VocabularyModal } from '../vocabulary/VocabularyModal'
import { useWorbooPlayer } from '../../hooks/useWorbooPlayer'
import { WORBOO_CURRENCY_CODE } from '../../utils/shop'
import { useRelayerNotifications } from '../../hooks/useRelayerNotifications'
import { useRelayerHealth } from '../../hooks/useRelayerHealth'
import { RelayerStatusBanner } from './RelayerStatusBanner'

type Props = {
  setIsInfoModalOpen: (value: boolean) => void
  setIsStatsModalOpen: (value: boolean) => void
  setIsSettingsModalOpen: (value: boolean) => void
  dailyProgress?: {
    completed: number
    total: number
    currentIndex: number
  }
}

export const Navbar = ({
  setIsInfoModalOpen,
  setIsStatsModalOpen,
  setIsSettingsModalOpen,
  dailyProgress,
}: Props) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isShopModalOpen, setIsShopModalOpen] = useState(false)
  const [isVocabularyModalOpen, setIsVocabularyModalOpen] = useState(false)
  const [selectedWorboo, setSelectedWorboo] = useState<string | null>(null)
  const [equippedWorboo, setEquippedWorboo] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(SHOP_TABS[0])
  const [equippedItems, setEquippedItems] = useState<Record<string, string>>({
    [SHOP_TABS[0]]: '',
    [SHOP_TABS[1]]: '',
    [SHOP_TABS[2]]: '',
    [SHOP_TABS[3]]: '',
    [SHOP_TABS[4]]: '',
    [SHOP_TABS[5]]: '',
  })
  const [inventory, setInventory] = useState<Record<string, boolean>>({})
  // For treasure items
  const [ownedChests, setOwnedChests] = useState<Record<string, number>>({
    wooden_chest: 0,
    silver_chest: 0,
    diamond_chest: 0,
  })
  const [ownedKeys, setOwnedKeys] = useState<Record<string, number>>({
    wooden_key: 0,
    silver_key: 0,
    golden_key: 0,
  })
  const [scoreBalance, setScoreBalance] = useState(1000) // Mock score balance
  const [openingChest, setOpeningChest] = useState<string | null>(null)
  const [rewardMessage, setRewardMessage] = useState<string | null>(null)
  const { address, isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()
  const worbooPlayer = useWorbooPlayer(isConnected ? address : undefined)
  const {
    profile,
    balanceFormatted,
    tokenSymbol,
    register,
    isRegistering,
    purchase,
    isPurchasing,
    inventory: onChainInventory,
    isReady: isWorbooReady,
    refresh,
  } = worbooPlayer

  useEffect(() => {
    if (!onChainInventory) return
    setInventory((prev) => {
      const next = { ...prev }
      Object.entries(onChainInventory).forEach(([itemId, count]) => {
        if (count > 0n) {
          next[itemId] = true
        }
      })
      return next
    })
  }, [onChainInventory])

  const formattedBalance = useMemo(() => {
    const numeric = Number(balanceFormatted)
    if (Number.isFinite(numeric)) {
      return numeric.toLocaleString(undefined, { maximumFractionDigits: 2 })
    }
    return balanceFormatted
  }, [balanceFormatted])

  const handleRewardAcknowledged = useCallback(() => {
    refresh()
  }, [refresh])

  const {
    notification: relayerNotification,
    clearNotification: clearRelayerNotification,
    pendingRewards: pendingRelayerRewards,
  } = useRelayerNotifications({
    tokenSymbol,
    onRewardAcknowledged: handleRewardAcknowledged,
  })

  const {
    health: relayerHealth,
    lastUpdated: relayerHealthUpdated,
    error: relayerHealthError,
  } = useRelayerHealth({
    enabled: Boolean(process.env.REACT_APP_RELAYER_HEALTH_URL),
  })

  const requiresRegistration =
    isConnected && isWorbooReady && profile && !profile.isRegistered

  const handleRegisterOnChain = async () => {
    if (!isConnected) {
      openConnectModal?.()
      return
    }
    try {
      await register()
    } catch (error) {
      console.error(error)
      alert('Registration failed. Please try again after confirming the transaction in your wallet.')
    }
  }

  // Get current items based on active tab
  const getCurrentItems = (): ShopItem[] => {
    switch (activeTab) {
      case SHOP_TABS[0]:
        return SHOP_FULL_WORBOO_ITEMS
      case SHOP_TABS[1]:
        return SHOP_BODY_ITEMS
      case SHOP_TABS[2]:
        return SHOP_HEAD_ITEMS
      case SHOP_TABS[3]:
        return SHOP_EYE_ITEMS
      case SHOP_TABS[4]:
        return SHOP_MOUTH_ITEMS
      case SHOP_TABS[5]:
        return SHOP_ACCESSORY_ITEMS
      case SHOP_TABS[6]:
        return SHOP_TREASURE_ITEMS
      default:
        return SHOP_FULL_WORBOO_ITEMS
    }
  }

  // Get equipped item for current tab
  const getEquippedForCurrentTab = () => {
    return equippedItems[activeTab] || ''
  }

  // Set equipped item for current tab
  const setEquippedForCurrentTab = (itemId: string | null) => {
    const newEquippedItems = { ...equippedItems }
    
    switch (activeTab) {
      case SHOP_TABS[0]:
        newEquippedItems[SHOP_TABS[0]] = itemId || ''
        break
      case SHOP_TABS[1]:
        newEquippedItems[SHOP_TABS[1]] = itemId || ''
        break
      case SHOP_TABS[2]:
        newEquippedItems[SHOP_TABS[2]] = itemId || ''
        break
      case SHOP_TABS[3]:
        newEquippedItems[SHOP_TABS[3]] = itemId || ''
        break
      case SHOP_TABS[4]:
        newEquippedItems[SHOP_TABS[4]] = itemId || ''
        break
      case SHOP_TABS[5]:
        newEquippedItems[SHOP_TABS[5]] = itemId || ''
        break
    }
    
    setEquippedItems(newEquippedItems)
  }

  // Get rarity color class
  const getRarityColorClass = (rarity: typeof RARITY.COMMON) => {
    switch (rarity.color) {
      case 'gray':
        return 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      case 'green':
        return 'bg-green-200 text-green-800 dark:bg-green-700 dark:text-green-300'
      case 'blue':
        return 'bg-blue-200 text-blue-800 dark:bg-blue-700 dark:text-blue-300'
      case 'purple':
        return 'bg-purple-200 text-purple-800 dark:bg-purple-700 dark:text-purple-300'
      case 'orange':
        return 'bg-orange-200 text-orange-800 dark:bg-orange-700 dark:text-orange-300'
      default:
        return 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  // Handle buy item
  const handleBuyItem = async (item: ShopItem) => {
    const currency = (item.currency ?? WORBOO_CURRENCY_CODE).toUpperCase()
    if (currency !== WORBOO_CURRENCY_CODE) {
      setInventory((prev) => ({
        ...prev,
        [item.id]: true,
      }))
      return
    }

    if (!isConnected) {
      openConnectModal?.()
      return
    }

    if (requiresRegistration) {
      await handleRegisterOnChain()
      return
    }

    try {
      await purchase({ itemId: item.id, quantity: 1 })
      setInventory((prev) => ({
        ...prev,
        [item.id]: true,
      }))
      if (item.id.includes('chest')) {
        setOwnedChests((prev) => ({
          ...prev,
          [item.id]: (prev[item.id as keyof typeof prev] || 0) + 1,
        }))
      }
    } catch (error) {
      console.error(error)
      alert('Purchase failed. Please confirm the transaction in your wallet and try again.')
    }
  }

  // Currency helpers
  const isWorbooCurrency = (item: ShopItem) =>
    (item.currency ?? WORBOO_CURRENCY_CODE).toUpperCase() === WORBOO_CURRENCY_CODE

  // Handle buy treasure item
  const handleBuyTreasureItem = async (item: ShopItem) => {
    if (item.id.includes('chest') && isWorbooCurrency(item)) {
      await handleBuyItem(item)
      return
    }

    if (item.id.includes('key')) {
      // Buy key with Score
      if (scoreBalance >= item.price) {
        setScoreBalance(scoreBalance - item.price)
        setOwnedKeys({
          ...ownedKeys,
          [item.id]: (ownedKeys[item.id as keyof typeof ownedKeys] || 0) + 1,
        })
      } else {
        alert('Not enough Score to purchase this key!')
      }
    }
  }

  // Handle open chest
  const handleOpenChest = (chestId: string) => {
    const keyMap: Record<string, string> = {
      wooden_chest: 'wooden_key',
      silver_chest: 'silver_key',
      diamond_chest: 'golden_key',
    }
    
    const requiredKey = keyMap[chestId]
    
    if (ownedKeys[requiredKey as keyof typeof ownedKeys] > 0) {
      setOpeningChest(chestId)
      
      // Simulate opening animation
      setTimeout(() => {
        // Generate random reward
        const rewards = [
          'Game Background',
          'Board Theme',
          'Background Music',
          'Worboo Accessory',
        ]
        
        // Add legendary Worboo NFT as a possible reward for diamond chest
        if (chestId === 'diamond_chest') {
          rewards.push('Legendary Worboo NFT')
        }
        
        const randomReward = rewards[Math.floor(Math.random() * rewards.length)]
        setRewardMessage(`Congratulations! You received a ${randomReward}!`)
        
        // Update inventory
        setOwnedChests({
          ...ownedChests,
          [chestId]: ownedChests[chestId as keyof typeof ownedChests] - 1,
        })
        
        setOwnedKeys({
          ...ownedKeys,
          [requiredKey]: ownedKeys[requiredKey as keyof typeof ownedKeys] - 1,
        })
        
        // Reset opening state after showing reward
        setTimeout(() => {
          setOpeningChest(null)
          
          // Reset reward message after a delay
          setTimeout(() => {
            setRewardMessage(null)
          }, 3000)
        }, 1500)
      }, 1000)
    } else {
      alert(`You need a ${requiredKey.replace('_', ' ')} to open this chest!`)
    }
  }

  // Handle equip/unequip item
  const handleEquipItem = (itemId: string) => {
    setEquippedItems((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab] === itemId ? '' : itemId,
    }))
  }

  const showRelayerBanner = Boolean(
    relayerNotification ||
      pendingRelayerRewards > 0 ||
      (relayerHealth && relayerHealth.status !== 'idle')
  )

  return (
    <div className="navbar">
      {showRelayerBanner && (
        <div className="px-4 pt-3 sm:px-6">
          <RelayerStatusBanner
            notification={relayerNotification}
            pendingRewards={pendingRelayerRewards}
            onDismiss={clearRelayerNotification}
            health={relayerHealth}
            lastUpdated={relayerHealthUpdated}
            error={relayerHealthError}
          />
        </div>
      )}
      <div className="navbar-content px-5">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsVocabularyModalOpen(true)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Open vocabulary library"
            >
              <BookOpenIcon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            </button>
            {isConnected && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Open profile"
              >
                <UserCircleIcon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              </button>
            )}
            <button
              onClick={() => setIsShopModalOpen(true)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Open shop"
            >
              <ShoppingBagIcon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            </button>
            <button
              onClick={() => {
                setActiveTab(SHOP_TABS[6])
                setIsShopModalOpen(true)
              }}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Open treasure chest"
            >
              <GiftIcon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
          <InformationCircleIcon
            className="h-6 w-6 cursor-pointer dark:stroke-white"
            onClick={() => setIsInfoModalOpen(true)}
          />
        </div>
        <div className="flex items-center space-x-4">
          <p className="text-xl font-bold dark:text-white">{GAME_TITLE}</p>
          {dailyProgress && (
            <p className="text-sm dark:text-white">
              Progress: {dailyProgress.completed}/{dailyProgress.total} words
            </p>
          )}
          <ConnectButton />
        </div>
        {requiresRegistration && (
          <div className="mt-3 flex items-center justify-between rounded-lg bg-yellow-100 px-3 py-2 text-sm font-medium text-yellow-900 dark:bg-yellow-900/40 dark:text-yellow-100">
            <span>Register on-chain to start earning {tokenSymbol} rewards.</span>
            <button
              onClick={() => void handleRegisterOnChain()}
              className="inline-flex items-center rounded-md bg-yellow-500 px-3 py-1 text-xs font-semibold text-yellow-900 hover:bg-yellow-400 disabled:opacity-60"
              disabled={isRegistering}
            >
              {isRegistering ? 'Registering…' : 'Register'}
            </button>
          </div>
        )}
        <div className="right-icons">
          <a 
            href={DISCORD_URL} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block mr-3"
            aria-label="Join our Discord"
          >
            <svg 
              className="h-6 w-6 cursor-pointer text-gray-700 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors" 
              fill="currentColor" 
              viewBox="0 0 24 24" 
              aria-hidden="true"
            >
              <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
            </svg>
          </a>
          <a 
            href={TELEGRAM_URL} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block mr-3"
            aria-label="Join our Telegram"
          >
            <svg 
              className="h-6 w-6 cursor-pointer text-gray-700 dark:text-white hover:text-blue-500 dark:hover:text-blue-400 transition-colors" 
              fill="currentColor" 
              viewBox="0 0 24 24" 
              aria-hidden="true"
            >
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
          </a>
          <ChartBarIcon
            className="h-6 w-6 mr-3 cursor-pointer dark:stroke-white"
            onClick={() => setIsStatsModalOpen(true)}
          />
          <CogIcon
            className="h-6 w-6 cursor-pointer dark:stroke-white"
            onClick={() => setIsSettingsModalOpen(true)}
          />
        </div>
      </div>
      <hr></hr>
      <ProfileSidebar isOpen={isSidebarOpen && isConnected} setIsOpen={setIsSidebarOpen} />
      
      {/* Shop Modal */}
      <Transition.Root show={isShopModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setIsShopModalOpen}>
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
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-900 px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:p-6">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <Dialog.Title as="h3" className="text-2xl font-semibold leading-6 text-gray-900 dark:text-gray-100">
                        {SHOP_TITLE}
                      </Dialog.Title>
                      <button
                        className="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        onClick={() => setIsShopModalOpen(false)}
                      >
                        <span className="sr-only">Close</span>
                        <XIcon className="h-6 w-6" aria-hidden="true" />
                      </button>
                    </div>
                    
                    {/* Shop Tabs */}
                    <div className="border-b border-gray-200 dark:border-gray-700">
                      <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
                        {SHOP_TABS.map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`${
                              activeTab === tab
                                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
                          >
                            {tab}
                          </button>
                        ))}
                      </nav>
                    </div>
                    
                    {/* Balances */}
                    {isConnected && (
                      <div className="flex justify-between mt-4 mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {tokenSymbol} Balance:
                          </span>
                          <span className="ml-2 text-blue-600 dark:text-blue-400 font-bold">
                            {formattedBalance}
                          </span>
                        </div>
                        {activeTab === SHOP_TABS[6] && (
                          <div className="flex items-center">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Score Balance:</span>
                            <span className="ml-2 text-green-600 dark:text-green-400 font-bold">
                              {scoreBalance}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Reward Message */}
                    {rewardMessage && (
                      <div className="mt-4 p-4 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-lg text-center animate-pulse">
                        {rewardMessage}
                      </div>
                    )}
                    
                    {/* Items Grid */}
                    <div className="mt-6 grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
                      {getCurrentItems().map((item) => (
                        <div key={item.id} className="group relative">
                          <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700 relative">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                            />
                            {/* Rarity Badge - Moved to top-left */}
                            <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${getRarityColorClass(item.rarity)}`}>
                              {item.rarity.name}
                            </div>
                            {activeTab !== SHOP_TABS[6] && getEquippedForCurrentTab() === item.id && (
                              <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                {SHOP_EQUIPPED_LABEL}
                              </div>
                            )}
                            {/* Owned count for treasure items */}
                            {activeTab === SHOP_TABS[6] && item.id.includes('chest') && ownedChests[item.id as keyof typeof ownedChests] > 0 && (
                              <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                Owned: {ownedChests[item.id as keyof typeof ownedChests]}
                              </div>
                            )}
                            {activeTab === SHOP_TABS[6] && item.id.includes('key') && ownedKeys[item.id as keyof typeof ownedKeys] > 0 && (
                              <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                Owned: {ownedKeys[item.id as keyof typeof ownedKeys]}
                              </div>
                            )}
                          </div>
                          <div className="mt-4 flex items-center justify-between">
                            <div>
                              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {item.name}
                              </h3>
                              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {item.description}
                              </p>
                            </div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {item.price} {(item.currency ?? WORBOO_CURRENCY_CODE).toUpperCase()}
                            </p>
                          </div>
                          <div className="mt-4">
                            {activeTab !== SHOP_TABS[6] ? (
                              inventory[item.id] ? (
                                <button
                                  onClick={() => handleEquipItem(item.id)}
                                  className={`${
                                    getEquippedForCurrentTab() === item.id
                                      ? 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800'
                                      : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800'
                                  } w-full flex items-center justify-center rounded-md border border-transparent py-2 px-8 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
                                >
                                  {getEquippedForCurrentTab() === item.id
                                    ? SHOP_UNEQUIP_BUTTON
                                    : SHOP_EQUIP_BUTTON}
                                </button>
                              ) : (
                                <button
                                  onClick={() => void handleBuyItem(item)}
                                  className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 rounded-md border border-transparent py-2 px-8 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                  disabled={
                                    !isConnected ||
                                    (isWorbooCurrency(item) && (isPurchasing || requiresRegistration))
                                  }
                                >
                                  {SHOP_BUY_BUTTON}
                                </button>
                              )
                            ) : (
                              // Treasure tab buttons
                              <div>
                                {item.id.includes('chest') ? (
                                  <div className="flex flex-col space-y-2">
                                    <button
                                      onClick={() => void handleBuyTreasureItem(item)}
                                      className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 rounded-md border border-transparent py-2 px-4 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                      disabled={
                                        openingChest !== null ||
                                        !isConnected ||
                                        (isWorbooCurrency(item) && (isPurchasing || requiresRegistration))
                                      }
                                    >
                                      {SHOP_BUY_BUTTON}
                                    </button>
                                    {ownedChests[item.id as keyof typeof ownedChests] > 0 && (
                                      <button
                                        onClick={() => handleOpenChest(item.id)}
                                        className={`w-full ${
                                          openingChest === item.id
                                            ? 'bg-yellow-500 animate-pulse'
                                            : 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800'
                                        } rounded-md border border-transparent py-2 px-4 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2`}
                                        disabled={openingChest !== null}
                                      >
                                        {openingChest === item.id ? 'Opening...' : SHOP_OPEN_BUTTON}
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => void handleBuyTreasureItem(item)}
                                    className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 rounded-md border border-transparent py-2 px-8 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                                    disabled={openingChest !== null || !isConnected}
                                  >
                                    {SHOP_BUY_BUTTON}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {selectedWorboo && (
                      <div className="mt-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        {(() => {
                          // Combine all shop items for selection
                          const item = SHOP_ITEMS.find((item) => item.id === selectedWorboo);
                          if (!item) return null;
                          
                          return (
                            <>
                              <div className="flex items-center mb-2">
                                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                  {item.name}
                                </h4>
                                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${getRarityColorClass(item.rarity)}`}>
                                  {item.rarity.name}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                {item.description}
                              </p>
                              <div className="flex justify-end">
                                <button
                                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${
                                    getEquippedForCurrentTab() === selectedWorboo
                                      ? 'text-gray-700 bg-gray-200 dark:text-gray-300 dark:bg-gray-700'
                                      : 'text-white bg-blue-600 hover:bg-blue-700'
                                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                                  onClick={() => {
                                    if (getEquippedForCurrentTab() === selectedWorboo) {
                                      setEquippedForCurrentTab('');
                                    } else {
                                      setEquippedForCurrentTab(selectedWorboo);
                                    }
                                    // In a real app, this would save to user profile
                                  }}
                                >
                                  {getEquippedForCurrentTab() === selectedWorboo ? SHOP_UNEQUIP_BUTTON : SHOP_EQUIP_BUTTON}
                                </button>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}
                    
                    {/* Worboo Preview - Only show when modular parts are equipped */}
                    {(equippedItems[SHOP_TABS[1]] || equippedItems[SHOP_TABS[2]] || equippedItems[SHOP_TABS[3]] || equippedItems[SHOP_TABS[4]] || equippedItems[SHOP_TABS[5]]) && !equippedItems[SHOP_TABS[0]] && (
                      <div className="mt-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
                          Your Custom Worboo
                        </h4>
                        <div className="flex justify-center mb-4">
                          <div className="relative h-40 w-40">
                            {/* This would be a composite image in a real implementation */}
                            {/* For now we'll just show the most recently equipped part */}
                            {equippedItems[SHOP_TABS[1]] && (
                              <img 
                                src={SHOP_BODY_ITEMS.find(item => item.id === equippedItems[SHOP_TABS[1]])?.image} 
                                alt="Body" 
                                className="absolute inset-0 h-full w-full object-contain"
                              />
                            )}
                            {equippedItems[SHOP_TABS[2]] && (
                              <img 
                                src={SHOP_HEAD_ITEMS.find(item => item.id === equippedItems[SHOP_TABS[2]])?.image} 
                                alt="Head" 
                                className="absolute inset-0 h-full w-full object-contain"
                              />
                            )}
                            {equippedItems[SHOP_TABS[3]] && (
                              <img 
                                src={SHOP_EYE_ITEMS.find(item => item.id === equippedItems[SHOP_TABS[3]])?.image} 
                                alt="Eyes" 
                                className="absolute inset-0 h-full w-full object-contain"
                              />
                            )}
                            {equippedItems[SHOP_TABS[4]] && (
                              <img 
                                src={SHOP_MOUTH_ITEMS.find(item => item.id === equippedItems[SHOP_TABS[4]])?.image} 
                                alt="Mouth" 
                                className="absolute inset-0 h-full w-full object-contain"
                              />
                            )}
                            {equippedItems[SHOP_TABS[5]] && (
                              <img 
                                src={SHOP_ACCESSORY_ITEMS.find(item => item.id === equippedItems[SHOP_TABS[5]])?.image} 
                                alt="Accessory" 
                                className="absolute inset-0 h-full w-full object-contain"
                              />
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-center text-gray-600 dark:text-gray-300">
                          Mix and match parts to create your unique Worboo!
                        </p>
                      </div>
                    )}
                    
                    {/* Treasure Shop */}
                    {activeTab === SHOP_TABS[6] && (
                      <div className="mt-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
                          Treasure Shop
                        </h4>
                        <div className="flex justify-center mb-4">
                          <div className="relative h-40 w-40">
                            {/* This would be a composite image in a real implementation */}
                            {/* For now we'll just show the most recently equipped part */}
                            {ownedChests.wooden_chest > 0 && (
                              <img 
                                src={SHOP_TREASURE_ITEMS.find(item => item.id === 'wooden_chest')?.image} 
                                alt="Wooden Chest" 
                                className="absolute inset-0 h-full w-full object-contain"
                              />
                            )}
                            {ownedChests.silver_chest > 0 && (
                              <img 
                                src={SHOP_TREASURE_ITEMS.find(item => item.id === 'silver_chest')?.image} 
                                alt="Silver Chest" 
                                className="absolute inset-0 h-full w-full object-contain"
                              />
                            )}
                            {ownedChests.diamond_chest > 0 && (
                              <img 
                                src={SHOP_TREASURE_ITEMS.find(item => item.id === 'diamond_chest')?.image} 
                                alt="Diamond Chest" 
                                className="absolute inset-0 h-full w-full object-contain"
                              />
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-center text-gray-600 dark:text-gray-300">
                          Open chests to receive rewards!
                        </p>
                        <div className="flex justify-center">
                          {openingChest && (
                            <button
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              onClick={() => handleOpenChest(openingChest)}
                            >
                              Open Chest
                            </button>
                          )}
                          {rewardMessage && (
                            <p className="text-sm text-center text-gray-600 dark:text-gray-300">
                              {rewardMessage}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
      
      {/* Vocabulary Modal */}
      <VocabularyModal
        isOpen={isVocabularyModalOpen}
        handleClose={() => setIsVocabularyModalOpen(false)}
      />
    </div>
  )
}
