import { SHOP_ITEMS, ShopItem } from '../constants/strings'

export const WORBOO_CURRENCY_CODE = 'WBOO'

export type OnChainShopItem = {
  item: ShopItem
  tokenId: bigint
}

const onChainItems: OnChainShopItem[] = SHOP_ITEMS.filter(
  (item) => (item.currency ?? WORBOO_CURRENCY_CODE).toUpperCase() === WORBOO_CURRENCY_CODE
).map((item, index) => ({
  item,
  tokenId: BigInt(index + 1),
}))

export const getOnChainShopItems = (): OnChainShopItem[] => onChainItems

export const getShopItemTokenId = (itemId: string): bigint => {
  const entry = onChainItems.find(({ item }) => item.id === itemId)
  if (!entry) {
    throw new Error('Unknown shop item')
  }
  return entry.tokenId
}

