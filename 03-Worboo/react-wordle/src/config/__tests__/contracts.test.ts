import { getContractsConfig, isContractsConfigReady } from '../contracts'

describe('contracts config', () => {
  const originalRegistry = process.env.REACT_APP_WORBOO_REGISTRY
  const originalToken = process.env.REACT_APP_WORBOO_TOKEN
  const originalShop = process.env.REACT_APP_WORBOO_SHOP

  beforeEach(() => {
    delete process.env.REACT_APP_WORBOO_REGISTRY
    delete process.env.REACT_APP_WORBOO_TOKEN
    delete process.env.REACT_APP_WORBOO_SHOP
  })

  afterAll(() => {
    if (originalRegistry) {
      process.env.REACT_APP_WORBOO_REGISTRY = originalRegistry
    } else {
      delete process.env.REACT_APP_WORBOO_REGISTRY
    }
    if (originalToken) {
      process.env.REACT_APP_WORBOO_TOKEN = originalToken
    } else {
      delete process.env.REACT_APP_WORBOO_TOKEN
    }
    if (originalShop) {
      process.env.REACT_APP_WORBOO_SHOP = originalShop
    } else {
      delete process.env.REACT_APP_WORBOO_SHOP
    }
  })

  test('returns undefined addresses when env vars missing', () => {
    const config = getContractsConfig()
    expect(config.registry).toBeUndefined()
    expect(config.token).toBeUndefined()
    expect(config.shop).toBeUndefined()
    expect(isContractsConfigReady(config)).toBe(false)
  })

  test('normalizes valid addresses and detects ready config', () => {
    process.env.REACT_APP_WORBOO_REGISTRY =
      '0x1111111111111111111111111111111111111111'
    process.env.REACT_APP_WORBOO_TOKEN =
      '0x2222222222222222222222222222222222222222'
    process.env.REACT_APP_WORBOO_SHOP =
      '0x3333333333333333333333333333333333333333'

    const config = getContractsConfig()
    expect(config.registry).toBe(
      '0x1111111111111111111111111111111111111111'
    )
    expect(config.token).toBe('0x2222222222222222222222222222222222222222')
    expect(config.shop).toBe('0x3333333333333333333333333333333333333333')
    expect(isContractsConfigReady(config)).toBe(true)
  })
})
