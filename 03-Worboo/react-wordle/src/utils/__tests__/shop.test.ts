import {
  getOnChainShopItems,
  getShopItemTokenId,
  WORBOO_CURRENCY_CODE,
} from '../shop'

describe('shop utilities', () => {
  test('derives on-chain shop items with sequential token ids', () => {
    const onChainItems = getOnChainShopItems()
    expect(onChainItems.length).toBeGreaterThan(0)

    const tokenIds = onChainItems.map((entry) => entry.tokenId)
    const uniqueIds = new Set(tokenIds.map((id) => id.toString()))
    expect(uniqueIds.size).toBe(onChainItems.length)
    expect(tokenIds[0]).toBe(1n)
    expect(tokenIds[tokenIds.length - 1]).toBe(
      tokenIds[0] + BigInt(onChainItems.length - 1)
    )

    onChainItems.forEach(({ item }) => {
      expect((item.currency ?? WORBOO_CURRENCY_CODE).toUpperCase()).toBe(
        WORBOO_CURRENCY_CODE
      )
    })
  })

  test('throws when requesting unknown item token id', () => {
    expect(() => getShopItemTokenId('unknown-item')).toThrow(
      'Unknown shop item'
    )
  })
})
