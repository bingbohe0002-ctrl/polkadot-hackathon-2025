import { cookieStorage, createConfig, createStorage, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { moonbaseAlpha, moonbeam, moonriver, hardhat } from "./chains";

// Get WalletConnect project ID from environment - only on client side
const projectId =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
    : undefined;

// Only show warning on client side
if (typeof window !== "undefined" && !projectId) {
  console.warn(
    "⚠️  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. Get one at https://cloud.walletconnect.com",
  );
}

/**
 * Create wagmi configuration with proper SSR handling
 * This function ensures WalletConnect is only initialized on the client side
 */
function createWagmiConfig() {
  const connectors = [
    // Injected connector for browser wallets (MetaMask, etc.)
    injected({
      target: "metaMask",
    }),
  ];

  // Temporarily disable WalletConnect to prevent SSR issues
  // TODO: Re-enable WalletConnect with proper SSR handling
  // if (typeof window !== "undefined" && projectId) {
  //   connectors.push(walletConnect({ ... }));
  // }

  return createConfig({
    chains: [moonbaseAlpha, moonbeam, moonriver, hardhat],
    connectors,
    storage: createStorage({
      storage: cookieStorage,
    }),
    ssr: true,
    multiInjectedProviderDiscovery: false, // Prevent multiple provider detection
    transports: {
      [moonbaseAlpha.id]: http(),
      [moonbeam.id]: http(),
      [moonriver.id]: http(),
      [hardhat.id]: http(),
    },
  });
}

/**
 * Wagmi configuration for EVM chains (Moonbeam, Moonriver)
 * This config is a singleton - created once and reused across the app
 * to prevent WalletConnect from being initialized multiple times
 */
export const wagmiConfig = createWagmiConfig();
