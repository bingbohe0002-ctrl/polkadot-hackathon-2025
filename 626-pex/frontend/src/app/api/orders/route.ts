import { NextResponse } from 'next/server';
import { OrderBookService, getProvider, getSigner, getPerpMarketContract } from '@/lib/utils/ethersHelpers';

// Simple in-memory cache for market symbol <-> marketId mapping
const marketIdCache: { bySymbol: Map<string, bigint>; lastFetch: number } = {
  bySymbol: new Map<string, bigint>(),
  lastFetch: 0,
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { market, orderType, side, size, price, leverage } = body || {};

    // 参数校验：允许 side=0，避免将 0 误判为缺失
    if (market == null || orderType == null || side === undefined || size === undefined) {
      return NextResponse.json({ success: false, error: '缺少必要参数' }, { status: 400 });
    }

    const rawRpc = (process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545').trim();
    const rpcUrl = rawRpc.replace('localhost', '127.0.0.1');
    const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 31337);
    const pk = process.env.PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;
    if (!pk) {
      return NextResponse.json({ success: false, error: '服务端未配置私钥' }, { status: 500 });
    }
    const provider = getProvider(rpcUrl);
    const signer = getSigner(pk, provider);
    const ob = new OrderBookService(chainId, signer);

    // Resolve marketId from symbol using PerpMarket.getAllMarkets and cache locally
    // Refresh cache if empty or stale (> 60s)
    let marketId = marketIdCache.bySymbol.get(market);
    if (!marketId || (Date.now() - marketIdCache.lastFetch) > 60_000) {
      const pm = getPerpMarketContract(chainId, provider);
      const markets = await pm.getAllMarkets();
      marketIdCache.bySymbol.clear();
      (markets as any[]).forEach((m) => {
        const id = BigInt(m?.id ?? m?.[0]);
        const sym = m?.symbol ?? m?.[1];
        if (sym) marketIdCache.bySymbol.set(sym, id);
      });
      marketIdCache.lastFetch = Date.now();
      marketId = marketIdCache.bySymbol.get(market);
    }
    if (!marketId) {
      return NextResponse.json({ success: false, error: `未找到交易对: ${market}` }, { status: 400 });
    }
    // marketId is ensured by cache

    let txHash: string | undefined;
    const lev = Number(leverage || 10);
    const sideStr: 'BUY' | 'SELL' = Number(side) === 0 ? 'BUY' : 'SELL';
    if (orderType === 'MARKET') {
      const tx = await ob.placeMarketOrder(marketId, sideStr, String(size), lev);
      txHash = tx?.hash;
    } else {
      if (price == null) {
        return NextResponse.json({ success: false, error: '限价单缺少价格' }, { status: 400 });
      }
      const tx = await ob.placeLimitOrder(marketId, sideStr, String(size), String(price), lev);
      txHash = tx?.hash;
    }

    return NextResponse.json({ success: true, data: { txHash } });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || '下单异常' }, { status: 500 });
  }
}