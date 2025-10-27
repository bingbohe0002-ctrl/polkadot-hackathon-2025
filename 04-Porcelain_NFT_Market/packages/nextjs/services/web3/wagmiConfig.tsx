import { wagmiConnectors } from "./wagmiConnectors";
import { Chain, createClient, http } from "viem";
import { hardhat, mainnet } from "viem/chains";
import { createConfig } from "wagmi";
import scaffoldConfig from "~~/scaffold.config";
import { getAlchemyHttpUrl } from "~~/utils/scaffold-eth";

const { targetNetworks } = scaffoldConfig;

// We always want to have mainnet enabled (ENS resolution, ETH price, etc). But only once.
export const enabledChains = targetNetworks.find((network: Chain) => network.id === 1)
  ? targetNetworks
  : ([...targetNetworks, mainnet] as const);

export const wagmiConfig = createConfig({
  chains: enabledChains,
  connectors: wagmiConnectors,
  ssr: true,
  client({ chain }) {
    // 为不同链使用不同的 RPC 端点
    let transport;
    if (chain.id === 1287) {
      // Moonbase Alpha - 使用官方 RPC
      transport = http("https://rpc.api.moonbase.moonbeam.network");
    } else if (chain.id === 420420422) {
      // Polkadot Hub Testnet - 使用官方 RPC
      transport = http("https://testnet-passet-hub-eth-rpc.polkadot.io");
    } else {
      // 其他链使用 Alchemy（如果有 API key）
      const alchemyUrl = getAlchemyHttpUrl(chain.id);
      transport = http(alchemyUrl || chain.rpcUrls.default.http[0]);
    }

    return createClient({
      chain,
      transport,
      ...(chain.id !== (hardhat as Chain).id
        ? {
            pollingInterval: scaffoldConfig.pollingInterval,
          }
        : {}),
    });
  },
});
