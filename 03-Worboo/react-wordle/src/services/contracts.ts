import { useMemo } from 'react'
import { useProvider, useSigner } from 'wagmi'
import { Contract } from 'ethers'

import {
  getContractsConfig,
  isContractsConfigReady,
} from '../config/contracts'
import { WORBOO_REGISTRY_ABI } from '../contracts/worbooRegistry'
import { WORBOO_TOKEN_ABI } from '../contracts/worbooToken'
import { WORBOO_SHOP_ABI } from '../contracts/worbooShop'

type WorbooContracts = {
  registry: Contract | null
  registryWrite: Contract | null
  token: Contract | null
  tokenWrite: Contract | null
  shop: Contract | null
  shopWrite: Contract | null
  isReady: boolean
}

const createContract = (
  address: `0x${string}` | undefined,
  abi: readonly unknown[],
  signerOrProvider: any
) => {
  if (!address || !signerOrProvider) return null
  return new Contract(address, abi, signerOrProvider)
}

export const useWorbooContracts = (): WorbooContracts => {
  const config = getContractsConfig()
  const provider = useProvider()
  const { data: signer } = useSigner()
  const readProvider = provider ?? signer?.provider

  return useMemo(() => {
    const ready = isContractsConfigReady(config) && Boolean(readProvider)
    if (!ready) {
      return {
        registry: null,
        registryWrite: null,
        token: null,
        tokenWrite: null,
        shop: null,
        shopWrite: null,
        isReady: false,
      }
    }

    const writeProvider = signer ?? readProvider

    return {
      registry: createContract(config.registry, WORBOO_REGISTRY_ABI, readProvider),
      registryWrite: createContract(
        config.registry,
        WORBOO_REGISTRY_ABI,
        writeProvider
      ),
      token: createContract(config.token, WORBOO_TOKEN_ABI, readProvider),
      tokenWrite: createContract(
        config.token,
        WORBOO_TOKEN_ABI,
        writeProvider
      ),
      shop: createContract(config.shop, WORBOO_SHOP_ABI, readProvider),
      shopWrite: createContract(
        config.shop,
        WORBOO_SHOP_ABI,
        writeProvider
      ),
      isReady: true,
    }
  }, [config, readProvider, signer])
}

