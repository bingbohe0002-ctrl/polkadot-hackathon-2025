'use server';

import { ethers } from 'ethers';
import { getProvider } from '@/lib/utils/ethersHelpers';
import { OrderBookABI, PerpMarketABI } from '@/lib/contracts/abi';

export default async function TxDetailPage({ params }: { params: { hash: string } }) {
  const provider = getProvider(process.env.NEXT_PUBLIC_RPC_URL);
  const tx = await provider.getTransaction(params.hash);
  const receipt = await provider.getTransactionReceipt(params.hash);

  const ifaces = [new ethers.Interface(OrderBookABI), new ethers.Interface(PerpMarketABI)];
  const decodedLogs: Array<{ name: string; args: Record<string, any> }> = [];

  if (receipt) {
    for (const log of receipt.logs) {
      let parsed: any = null;
      for (const iface of ifaces) {
        try {
          parsed = iface.parseLog(log);
          if (parsed) break;
        } catch (_) {
          // ignore
        }
      }
      if (parsed) {
        const args: Record<string, any> = {};
        parsed.fragment.inputs.forEach((inp: any, idx: number) => {
          const v = parsed.args[idx];
          args[inp.name || `arg${idx}`] = typeof v === 'bigint' ? v.toString() : v;
        });
        decodedLogs.push({ name: parsed.name, args });
      }
    }
  }

  const nativeSymbol = 'PEX';
  const formatWeiToNative = (v?: bigint) => {
    if (!v) return '0';
    const s = ethers.formatEther(v);
    const [i, f] = s.split('.');
    return f ? `${i}.${f.slice(0, 6)}` : i;
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">交易详情</h1>

      <div className="space-y-2 text-sm">
        <div><span className="text-muted-foreground">交易哈希：</span>{params.hash}</div>
        {tx && (
          <>
            <div><span className="text-muted-foreground">发起地址：</span>{tx.from}</div>
            <div><span className="text-muted-foreground">目标地址：</span>{tx.to}</div>
            <div><span className="text-muted-foreground">金额：</span>{formatWeiToNative(tx.value)} {nativeSymbol}</div>
            <div><span className="text-muted-foreground">Nonce：</span>{tx.nonce}</div>
          </>
        )}
        {receipt && (
          <>
            <div><span className="text-muted-foreground">区块高度：</span>{receipt.blockNumber}</div>
            <div><span className="text-muted-foreground">状态：</span>{receipt.status === 1 ? '成功' : '失败'}</div>
            <div><span className="text-muted-foreground">Gas 用量：</span>{receipt.gasUsed?.toString()}</div>
            {tx?.gasPrice != null && (
              <div><span className="text-muted-foreground">Gas 单价：</span>{formatWeiToNative(tx.gasPrice)} {nativeSymbol}</div>
            )}
            {tx?.gasPrice != null && receipt?.gasUsed != null && (
              <div><span className="text-muted-foreground">交易费用：</span>{formatWeiToNative(receipt.gasUsed * tx.gasPrice)} {nativeSymbol}</div>
            )}
          </>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">解析事件</h2>
        {decodedLogs.length === 0 ? (
          <div className="text-muted-foreground text-sm">未解析到相关事件</div>
        ) : (
          <div className="space-y-2">
            {decodedLogs.map((l, i) => (
              <div key={i} className="rounded border p-3">
                <div className="font-medium">{l.name}</div>
                <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(l.args, null, 2)}</pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}