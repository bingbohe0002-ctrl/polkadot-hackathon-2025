'use server';

import { ethers } from 'ethers';
import { getProvider, getSpotOrderBookContract, getSpotMarketContract } from '@/lib/utils/ethersHelpers';
import { SpotOrderBookABI, SpotMarketABI } from '@/lib/contracts/abi';

function fmt18(bn: bigint): string {
  try { return ethers.formatEther(bn); } catch { return '0'; }
}

export default async function SpotDebugPage({ params }: { params: { address: string } }) {
  const addr = params.address as `0x${string}`;
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://testnet-passet-hub-eth-rpc.polkadot.io';
  const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 420420422);
  const provider = getProvider(rpcUrl);

  const ob = getSpotOrderBookContract(chainId, provider);
  const sm = getSpotMarketContract(chainId, provider);

  // Resolve markets map
  let markets: Array<{ id: bigint; symbol: string }>;
  try {
    const ms = await sm.getAllMarkets();
    markets = (ms as any[]).map((m) => ({ id: BigInt(m.id ?? m[0]), symbol: String(m.symbol ?? m[3] ?? m[2] ?? '') }));
  } catch {
    markets = [];
  }
  const symbolById = new Map<bigint, string>();
  markets.forEach(m => symbolById.set(m.id, m.symbol));

  let orderIds: bigint[] = [];
  let orders: Array<any> = [];
  let error: string | null = null;

  try {
    orderIds = await ob.getOrdersByTrader(addr);

    // load each order
    for (const oid of orderIds) {
      const o = await ob.getOrder(oid);
      const id = BigInt(o.id ?? o[0]);
      const trader = String(o.trader ?? o[1]);
      const marketId = BigInt(o.marketId ?? o[2]);
      const typeIdx = Number(o.orderType ?? o[3]); // 0 LIMIT, 1 MARKET
      const sideIdx = Number(o.side ?? o[4]); // 0 BUY, 1 SELL
      const size = BigInt(o.size ?? o[5]);
      const price = BigInt(o.price ?? o[6]);
      const filledSize = BigInt(o.filledSize ?? o[7]);
      const ts = BigInt(o.timestamp ?? o[8]);
      // ISpotOrderBook.OrderStatus: PENDING(0), PARTIALLY_FILLED(1), FILLED(2), CANCELLED(3)
      const statusIdx = Number(o.status ?? o[10] ?? o[9]);

      const remaining = size > filledSize ? (size - filledSize) : 0n;
      const type = typeIdx === 0 ? 'LIMIT' : 'MARKET';
      const side = sideIdx === 0 ? 'BUY' : 'SELL';
      const status = (['PENDING', 'PARTIAL', 'FILLED', 'CANCELLED'] as const)[statusIdx] ?? 'PENDING';

      // Diagnosis for orderbook aggregation
      const reasons: string[] = [];
      if (remaining === 0n) reasons.push('remaining=0 已全部成交');
      if (status === 'FILLED' || status === 'CANCELLED') reasons.push(`状态=${status} 不计入订单簿`);
      if (type === 'MARKET') reasons.push('市价单 price=0 不计入订单簿');
      if (price === 0n) reasons.push('price=0');
      const symbol = symbolById.get(marketId) || String(marketId);

      orders.push({
        id: id.toString(),
        trader,
        marketId: marketId.toString(),
        symbol,
        type,
        side,
        size: fmt18(size),
        price: fmt18(price),
        filledSize: fmt18(filledSize),
        remaining: fmt18(remaining),
        status,
        timestamp: Number(ts),
        diagnosis: reasons,
      });
    }
  } catch (e: any) {
    error = e?.message || String(e);
  }

  // Avoid BigInt in JSON: convert market ids to string for display
  const marketsView = markets.map(m => ({ id: m.id.toString(), symbol: m.symbol }));

  const content = {
    chainId,
    rpcUrl,
    address: addr,
    markets: marketsView,
    orderCount: orderIds.length,
    orders,
    error,
  };

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600 }}>Spot Debug - {addr}</h2>
      <pre style={{ fontSize: 12, background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
        {JSON.stringify(content, null, 2)}
      </pre>
    </div>
  );
}