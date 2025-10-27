import { ethers } from 'ethers'

export type ContractsConfig = {
  registry?: `0x${string}`
  token?: `0x${string}`
  shop?: `0x${string}`
}

const WORBOO_REGISTRY_ENV = 'REACT_APP_WORBOO_REGISTRY'
const WORBOO_TOKEN_ENV = 'REACT_APP_WORBOO_TOKEN'
const WORBOO_SHOP_ENV = 'REACT_APP_WORBOO_SHOP'

const sanitizeAddress = (value?: string | null): `0x${string}` | undefined => {
  if (!value) return undefined
  try {
    return ethers.utils.getAddress(value) as `0x${string}`
  } catch {
    return undefined
  }
}

export const getContractsConfig = (): ContractsConfig => ({
  registry: sanitizeAddress(process.env[WORBOO_REGISTRY_ENV]),
  token: sanitizeAddress(process.env[WORBOO_TOKEN_ENV]),
  shop: sanitizeAddress(process.env[WORBOO_SHOP_ENV]),
})

export const isContractsConfigReady = (config: ContractsConfig): boolean =>
  Boolean(config.registry && config.token && config.shop)
