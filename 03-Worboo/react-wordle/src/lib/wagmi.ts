import { connectorsForWallets, getDefaultWallets } from '@rainbow-me/rainbowkit'
import { Chain, configureChains, createClient } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'

const moonbaseAlpha: Chain = {
  id: 1287,
  name: 'Moonbase Alpha',
  network: 'moonbase-alpha',
  nativeCurrency: {
    decimals: 18,
    name: 'DEV',
    symbol: 'DEV',
  },
  rpcUrls: {
    default: { http: ['https://rpc.api.moonbase.moonbeam.network'] },
    public: { http: ['https://rpc.api.moonbase.moonbeam.network'] },
  },
  blockExplorers: {
    default: { name: 'Moonscan', url: 'https://moonbase.moonscan.io' },
  },
  testnet: true,
}

const { chains, provider } = configureChains([moonbaseAlpha], [publicProvider()])

const projectId = '225568a047b4d16e33d3a4468110a6b4'
const { wallets } = getDefaultWallets({ appName: 'Worboo', projectId, chains })
const connectors = connectorsForWallets([...wallets])

export const config = createClient({
  autoConnect: true,
  connectors,
  provider,
})

export { chains }
