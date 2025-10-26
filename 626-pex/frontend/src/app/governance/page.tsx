'use client';

import { useEffect, useMemo, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useNetwork } from 'wagmi';
import toast from 'react-hot-toast';
import { ethers } from 'ethers';
import {
  getProvider,
  getSpotMarketContract,
  getListingGovernorContract,
} from '@/lib/utils/ethersHelpers';
import { getContractAddresses, getTokenAddress } from '@/lib/contracts/addresses';
import VoteSummary from '@/components/governance/VoteSummary';

// Types for proposals aggregated from events
interface ProposalItem {
  id: bigint;
  proposer: string;
  baseToken: string;
  quoteToken: string;
  symbol: string;
  startBlock: bigint;
  endBlock: bigint;
  yesVotes: bigint;
  noVotes: bigint;
  yesCount?: number;
  noCount?: number;
  finalized?: boolean;
  approved?: boolean;
  marketId?: bigint;
  activated?: boolean;
}

export default function GovernancePage() {
  const { address } = useAccount();
  const { chain } = useNetwork();
  const chainId = useMemo(() => chain?.id ?? Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 31337), [chain?.id]);
  const contractAddrs = useMemo(() => getContractAddresses(chainId), [chainId]);
  const isZeroAddress = (addr: string) => !addr || /^0x0{40}$/i.test(addr);
  const networkReady = useMemo(() => {
    return !!contractAddrs.spotMarket && !isZeroAddress(contractAddrs.spotMarket)
      && !!contractAddrs.listingGovernor && !isZeroAddress(contractAddrs.listingGovernor);
  }, [contractAddrs]);

  const [loading, setLoading] = useState(false);
  const [proposals, setProposals] = useState<ProposalItem[]>([]);
  const [markets, setMarkets] = useState<any[]>([]);
  const [votingBalance, setVotingBalance] = useState<string>('');
  const [pexTokenOnChain, setPexTokenOnChain] = useState<string>('');
  const [votingError, setVotingError] = useState<string>('');

  // Create proposal form state
  const [baseSymbol, setBaseSymbol] = useState<string>('BTC');
  const [quoteSymbol, setQuoteSymbol] = useState<string>('USDC');
  const [baseAddress, setBaseAddress] = useState<string>('');
  const [quoteAddress, setQuoteAddress] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  // Add voting amount and lock summary states
  const [voteAmounts, setVoteAmounts] = useState<Record<string, string>>({});
  const [lockedTotal, setLockedTotal] = useState<string>('');
  const [lockedClaimable, setLockedClaimable] = useState<string>('');
  const [lockedNextRelease, setLockedNextRelease] = useState<bigint>(BigInt(0));
  const [approvalThresholdBps, setApprovalThresholdBps] = useState<number>(8000);
  const [claiming, setClaiming] = useState(false);
  const [hasGovernorRole, setHasGovernorRole] = useState(false);
  const [currentBlock, setCurrentBlock] = useState<bigint>(0n);

  // Helper: safely extract args from ethers v6 event logs
  const safeArgs = (log: any) => (log && log.args) ? log.args : [];
  // Helper: safe big int parsing to avoid undefined crashes
  const getBigInt = (v: any, def: bigint = BigInt(0)) => {
    if (v === undefined || v === null) return def;
    try { return BigInt(v as any); } catch (_) { return def; }
  };
  // Helper: decode indexed address from topic
  const topicToAddress = (topic: string): string => {
    try { return ethers.getAddress(ethers.dataSlice(topic, 12)); } catch { return ''; }
  };
  const shortAddr = (a: string) => a ? `${a.slice(0,6)}…${a.slice(-4)}` : '';
  // Helper: format timestamp
  const formatTime = (ts: bigint) => {
    const n = Number(ts);
    if (!n) return '';
    try { return new Date(n * 1000).toLocaleString(); } catch { return String(ts); }
  };
  // Helper: format BigInt weight (wei) to PEX
  const formatPexAmount = (v: bigint) => {
    try {
      const s = ethers.formatEther(v);
      const [intPart, decPartRaw] = s.split('.');
      if (!decPartRaw) return `${intPart} PAS`;
      const decPart = decPartRaw.slice(0, 6).replace(/0+$/, '');
      return `${intPart}${decPart ? '.' + decPart : ''} PAS`;
    } catch {
      return `${String(v)} wei`;
    }
  };

  // Centralized reload function to refresh proposals & markets after changes
  const reloadGovernance = async () => {
    try {
      setLoading(true);
      const provider = getProvider(process.env.NEXT_PUBLIC_RPC_URL);
      const sm = getSpotMarketContract(chainId, provider);
      const gov = getListingGovernorContract(chainId, provider);
      try { console.log('[Governance] ListingGovernor:', await gov.getAddress()); } catch (_) {}
      try {
        const bn = await provider.getBlockNumber();
        setCurrentBlock(BigInt(bn));
      } catch (_) {}

      // Decode ProposalCreated event
      const decodeProposalCreated = (log: any) => {
        const args: any = safeArgs(log);
        const id = getBigInt(args?.id ?? args?.[0]);
        const proposer = String(args?.proposer ?? args?.[1]);
        const baseToken = topicToAddress(log.topics?.[2]);
        const quoteToken = String(args?.quoteToken ?? args?.[3]);
        const symbol = String(args?.symbol ?? args?.[4]);
        const startBlock = getBigInt(args?.startBlock ?? args?.[5]);
        const endBlock = getBigInt(args?.endBlock ?? args?.[6]);
        return { id, proposer, baseToken, quoteToken, symbol, startBlock, endBlock };
      };

      const createdLogs = await gov.queryFilter(gov.filters.ProposalCreated(), 0, 'latest');
      const voteLogs = await gov.queryFilter(gov.filters.VoteCast(), 0, 'latest');
      const finalizedLogs = await gov.queryFilter(gov.filters.ProposalFinalized(), 0, 'latest');
      // try read threshold (fallback 80%)
      try { setApprovalThresholdBps(Number(await (gov as any).approvalThresholdBps())); } catch (_) { setApprovalThresholdBps(8000); }
  
      const map: Record<string, ProposalItem> = {};
      for (const log of createdLogs) {
        const d = decodeProposalCreated(log);
        map[d.id.toString()] = {
          id: d.id, proposer: d.proposer, baseToken: d.baseToken, quoteToken: d.quoteToken,
          symbol: d.symbol, startBlock: d.startBlock, endBlock: d.endBlock, yesVotes: BigInt(0), noVotes: BigInt(0),
          yesCount: 0, noCount: 0,
        };
      }
  
      for (const v of voteLogs) {
        const args: any = safeArgs(v);
        const id = getBigInt(args?.id ?? args?.[0]);
        const support = Boolean(args?.support ?? args?.[2]);
        const weight = getBigInt(args?.weight ?? args?.[3]);
        const key = id.toString();
        if (!map[key]) continue;
        if (support) { map[key].yesVotes += weight; map[key].yesCount = (map[key].yesCount || 0) + 1; }
        else { map[key].noVotes += weight; map[key].noCount = (map[key].noCount || 0) + 1; }
      }
  
      const finalizedById: Record<string, { approved: boolean; logBlock: bigint }> = {};
      for (const f of finalizedLogs) {
        const args: any = safeArgs(f);
        const id = getBigInt(args?.id ?? args?.[0]);
        const approved = Boolean(args?.approved ?? args?.[1]);
        finalizedById[id.toString()] = { approved, logBlock: getBigInt((f as any)?.blockNumber ?? 0) };
      }
  
      const enriched: ProposalItem[] = [];
      for (const key of Object.keys(map)) {
        const p = map[key];
        const finalInfo = finalizedById[key];
        if (finalInfo) {
          p.finalized = true;
          p.approved = finalInfo.approved;
          if (finalInfo.approved) {
            try {
              const addedLogs = await sm.queryFilter(sm.filters.MarketAdded(), Number(p.startBlock), 'latest');
              const matched = addedLogs.find((l: any) => {
                const a: any = safeArgs(l);
                const symbol = String(a?.symbol ?? a?.[3]);
                return symbol === p.symbol;
              });
              if (matched) {
                const a2: any = safeArgs(matched);
                const id = getBigInt(a2?.id ?? a2?.[0]);
                const active = await sm.isMarketActive(id);
                p.marketId = id;
                p.activated = Boolean(active);
              }
            } catch (_) {}
          }
        }
        enriched.push(p);
      }
  
      const addedLogsAll = await sm.queryFilter(sm.filters.MarketAdded(), 0, 'latest');
      const normalizedMarkets = await Promise.all(addedLogsAll.map(async (l: any) => {
        const a: any = safeArgs(l);
        const id = getBigInt(a?.id ?? a?.[0]);
        const symbol = String(a?.symbol ?? a?.[3]);
        const active = await sm.isMarketActive(id);
        return { id, symbol, active: Boolean(active) };
      }));
  
      setMarkets(normalizedMarkets);
      setProposals(enriched.sort((a, b) => Number(b.id - a.id)));
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || '刷新治理数据失败');
    } finally {
      setLoading(false);
    }
  };

  // Load current voting balance from native PEX and lock summary from governor
  const reloadVotingBalance = async () => {
    setVotingError('');
    try {
      if (!address) {
        setVotingBalance('');
        setPexTokenOnChain('');
        setLockedTotal('');
        setLockedClaimable('');
        setLockedNextRelease(BigInt(0));
        return;
      }
      const provider = getProvider(process.env.NEXT_PUBLIC_RPC_URL);
      // Read native balance
      try {
        const bal = await provider.getBalance(address);
        setVotingBalance(ethers.formatEther(bal));
      } catch (err: any) {
        console.error('[Governance] 读取原生PAS余额失败:', err);
        setVotingError(err?.message || '读取失败');
        setVotingBalance('');
      }
      // Read lock summary via governor (if configured)
      try {
        const gov = getListingGovernorContract(chainId, provider);
        try { setPexTokenOnChain(await gov.pexToken()); } catch (_) {}
        const summary: any = await gov.getLockedSummary(address);
        const total = getBigInt(summary?.total ?? summary?.[0] ?? 0n);
        const claimable = getBigInt(summary?.claimable ?? summary?.[1] ?? 0n);
        const nextRelease = getBigInt(summary?.nextRelease ?? summary?.[2] ?? 0n);
        setLockedTotal(ethers.formatEther(total));
        setLockedClaimable(ethers.formatEther(claimable));
        setLockedNextRelease(nextRelease);
      } catch (err: any) {
        console.error('[Governance] 读取锁仓信息失败:', err);
        setVotingError(err?.message || '锁仓信息读取失败');
        setLockedTotal('');
        setLockedClaimable('');
        setLockedNextRelease(BigInt(0));
      }
    } catch (e: any) {
      console.error('[Governance] 读取投票余额失败:', e);
      setVotingError(e?.message || '读取失败');
      setVotingBalance('');
      setLockedTotal('');
      setLockedClaimable('');
      setLockedNextRelease(BigInt(0));
    }
  };

  // Resolve default token addresses from env mapping
  useEffect(() => {
    const b = getTokenAddress(chainId, baseSymbol) || '';
    const q = getTokenAddress(chainId, quoteSymbol) || '';
    setBaseAddress(b);
    setQuoteAddress(q);
  }, [chainId, baseSymbol, quoteSymbol]);

  // Load markets & proposals from events
  useEffect(() => {
    let mounted = true;
    const run = async () => { if (!mounted) return; await reloadGovernance(); };
    run();
    return () => { mounted = false; };
  }, [chainId]);

  // Periodically refresh current block number
  useEffect(() => {
    let mounted = true;
    const provider = getProvider(process.env.NEXT_PUBLIC_RPC_URL);
    const tick = async () => {
      try {
        const bn = await provider.getBlockNumber();
        if (mounted) setCurrentBlock(BigInt(bn));
      } catch (_) {}
    };
    tick();
    const timer = setInterval(tick, 3000);
    return () => { mounted = false; clearInterval(timer); };
  }, [chainId]);

  // Load voting balance when address or chain changes
  useEffect(() => {
    let mounted = true;
    const run = async () => { if (!mounted) return; await reloadVotingBalance(); };
    run();
    return () => { mounted = false; };
  }, [address, chainId]);

  // Governor role check: prefer BrowserProvider to match connected wallet network
  const refreshGovernorRole = async () => {
    try {
      if (!address) return false;
      // If contracts not configured on current network, treat as no role
      if (!networkReady) return false;

      const attempt = async (prov: ethers.AbstractProvider) => {
        const sm = getSpotMarketContract(chainId, prov);
        const role = await sm.GOVERNOR_ROLE();
        const ok = await sm.hasRole(role, address);
        return Boolean(ok);
      };

      let ok = false;

      // Prefer BrowserProvider to match connected wallet network
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          const browserProv = new ethers.BrowserProvider((window as any).ethereum);
          ok = await attempt(browserProv);
        } catch (e) {
          console.warn('[Governance] BrowserProvider role check failed, will fallback to RPC:', e);
        }
      }

      // Fallback to RPC provider if BrowserProvider failed or unavailable
      if (!ok) {
        const rpcProv = getProvider(process.env.NEXT_PUBLIC_RPC_URL);
        try {
          ok = await attempt(rpcProv);
        } catch (e) {
          console.error('[Governance] RPC role check failed:', e);
          ok = false;
        }
      }

      return ok;
    } catch (e) {
      console.error('[Governance] 权限检测失败:', e);
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      const ok = await refreshGovernorRole();
      if (mounted) setHasGovernorRole(ok);
    };
    run();
    const timer = setInterval(run, 5000);
    return () => { mounted = false; clearInterval(timer); };
  }, [chainId, address]);

  const onCreateProposal = async () => {
    try {
      if (!address) { toast.error('请先连接钱包'); return; }
      if (!baseAddress || !quoteAddress) { toast.error('请输入有效的代币地址'); return; }
      const symbol = `${baseSymbol}/${quoteSymbol}`;

      const exists = markets.some((m) => String(m.symbol).toUpperCase() === symbol.toUpperCase());
      if (exists) { toast.error('该交易对已存在，禁止重复上币'); return; }

      const activeDup = proposals.some((p) => !p.finalized && p.baseToken.toLowerCase() === baseAddress.toLowerCase() && p.quoteToken.toLowerCase() === quoteAddress.toLowerCase());
      if (activeDup) { toast.error('已存在相同代币对的有效提案'); return; }

      setSubmitting(true);
      const extProvider = (typeof window !== 'undefined' ? (window as any).ethereum : undefined);
      if (!extProvider) { toast.error('未检测到钱包'); setSubmitting(false); return; }
      const browserProvider = new ethers.BrowserProvider(extProvider);
      const signer = await browserProvider.getSigner();

      const gov = getListingGovernorContract(chainId, signer);
      const tx = await gov.createProposal(baseAddress, quoteAddress, symbol);
      await tx.wait();

      toast.success('提案创建成功');
      await reloadGovernance();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || '提案创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  const onVote = async (proposalId: bigint, support: boolean) => {
    try {
      if (!address) { toast.error('请先连接钱包'); return; }
      const amountStr = (voteAmounts[String(proposalId)] || '').trim();
      if (!amountStr) { toast.error('请输入投票数量'); return; }
      let value: bigint;
      try {
        value = ethers.parseEther(amountStr);
        if (value <= 0n) { toast.error('投票数量必须大于0'); return; }
      } catch {
        toast.error('请输入有效的投票数量（数字）');
        return;
      }
      const extProvider = (typeof window !== 'undefined' ? (window as any).ethereum : undefined);
      if (!extProvider) { toast.error('未检测到钱包'); return; }
      const browserProvider = new ethers.BrowserProvider(extProvider);
      const signer = await browserProvider.getSigner();
      const gov = getListingGovernorContract(chainId, signer);
      const tx = await gov.vote(proposalId, support, { value });
      await tx.wait();
      toast.success('投票成功，代币已锁定7天');
      setVoteAmounts((prev) => ({ ...prev, [String(proposalId)]: '' }));
      await reloadGovernance();
      await reloadVotingBalance();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || '投票失败');
    }
  };

  const onFinalize = async (proposal: ProposalItem) => {
    try {
      if (!address) { toast.error('请先连接钱包'); return; }
      const extProvider = (typeof window !== 'undefined' ? (window as any).ethereum : undefined);
      if (!extProvider) { toast.error('未检测到钱包'); return; }
      const browserProvider = new ethers.BrowserProvider(extProvider);
      const signer = await browserProvider.getSigner();

      const gov = getListingGovernorContract(chainId, signer);
      // 仅执行最终化，不再自动调用 SpotMarket.activate，避免“Already active”报错
      const tx = await gov.finalize(proposal.id);
      await tx.wait();

      toast.success('现货已上架');
      // 刷新治理数据以同步市场激活状态和提案状态
      await reloadGovernance();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || '最终化失败');
    }
  };

  const onClaimUnlocked = async () => {
    try {
      if (!address) { toast.error('请先连接钱包'); return; }
      setClaiming(true);
      const extProvider = (typeof window !== 'undefined' ? (window as any).ethereum : undefined);
      if (!extProvider) { toast.error('未检测到钱包'); setClaiming(false); return; }
      const browserProvider = new ethers.BrowserProvider(extProvider);
      const signer = await browserProvider.getSigner();
      const gov = getListingGovernorContract(chainId, signer);
      const tx = await gov.claimUnlocked();
      await tx.wait();
      toast.success('已领取解锁代币');
      await reloadVotingBalance();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || '领取失败');
    } finally {
      setClaiming(false);
    }
  };

  const switchToLocal = async () => {
    try {
      const extProvider = (typeof window !== 'undefined' ? (window as any).ethereum : undefined);
      if (!extProvider) { toast.error('未检测到钱包'); return; }
      await extProvider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x7a69' }] });
      toast.success('已切换到本地网络');
    } catch (e: any) {
      if (e?.code === 4902 || String(e?.message || '').includes('Unrecognized chain ID')) {
        try {
          const extProvider = (window as any).ethereum;
          await extProvider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x7a69',
              chainName: 'Hardhat Local',
              rpcUrls: [(process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545').replace('localhost', '127.0.0.1')],
              nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
            }]
          });
          toast.success('已添加本地网络，请再次切换');
        } catch (err: any) {
          toast.error(err?.message || '添加网络失败');
        }
      } else {
        toast.error(e?.message || '切换网络失败');
      }
    }
  };
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">治理 / Token Listing</div>
            <div className="flex items-center space-x-4">
              {address && (
                <div className="text-xs text-muted-foreground text-right">
                  <div>PAS余额（原生）：{votingBalance ? votingBalance : (votingError ? votingError : '读取中…')}</div>
                  <div className="mt-1">
                    锁定：{lockedTotal || '—'} | 可领取：{lockedClaimable || '—'}
                    {lockedClaimable && Number(lockedClaimable) > 0 && (
                      <button
                        className="ml-2 px-2 py-1 rounded border hover:bg-muted disabled:opacity-50"
                        onClick={onClaimUnlocked}
                        disabled={claiming}
                      >领取</button>
                    )}
                  </div>
                  {lockedNextRelease && lockedNextRelease > 0n && (
                    <div className="mt-1">下次释放：{formatTime(lockedNextRelease)}</div>
                  )}
                  {pexTokenOnChain && (
                    <div className="mt-1">治理ERC20：{shortAddr(pexTokenOnChain)}</div>
                  )}
                </div>
              )}
              <ConnectButton chainStatus="icon" showBalance={false} accountStatus="address" />
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="container mx-auto px-4 py-4">
        {!networkReady && (
          <div className="mb-4 rounded border border-yellow-500 bg-yellow-50 text-yellow-700 p-3">
            当前连接网络未配置治理合约，请切换到本地 Hardhat (31337)。
            <button
              className="ml-2 px-2 py-1 rounded border hover:bg-yellow-100"
              onClick={switchToLocal}
            >一键切换</button>
          </div>
        )}
        <div className="grid grid-cols-12 gap-4">
          {/* Left: Proposals */}
          <div className="col-span-12 lg:col-span-7">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">提案列表</h2>
                {loading && <div className="text-sm text-muted-foreground">加载中…</div>}
              </div>

              {proposals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">暂无提案</div>
              ) : (
                <div className="space-y-3">
                  {proposals.map((p) => (
                    <div key={String(p.id)} className="border rounded p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{(p.symbol && p.symbol !== 'undefined' && p.symbol.trim() !== '') ? p.symbol : ((p.baseToken && p.quoteToken) ? `${shortAddr(p.baseToken)}/${shortAddr(p.quoteToken)}` : '未知交易对')}</div>
                          <div className="text-xs text-muted-foreground">ID: {String(p.id)}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          票数：YES {formatPexAmount(p.yesVotes)} / NO {formatPexAmount(p.noVotes)}
                        </div>
                      </div>

                      <VoteSummary
                        yesVotes={p.yesVotes}
                        noVotes={p.noVotes}
                        yesCount={p.yesCount}
                        noCount={p.noCount}
                        thresholdBps={approvalThresholdBps}
                      />

                      <div className="mt-2 text-sm text-muted-foreground">
                        <div>开始区块：{String(p.startBlock)}，结束区块：{String(p.endBlock)}，当前区块：{String(currentBlock)}</div>
                        <div>状态：{p.finalized ? (p.approved ? (p.activated ? '已激活' : '已通过，待激活') : '已拒绝') : (currentBlock >= p.endBlock ? '投票结束' : '投票中')}</div>
                        {p.marketId && <div>市场ID：{String(p.marketId)}</div>}
                      </div>

                      <div className="mt-3">
                        <label className="block text-xs text-muted-foreground mb-1">投票数量（PAS，原生）</label>
                        <input
                          className="w-full rounded border px-3 py-2 bg-input"
                          placeholder="例如 0.5"
                          value={voteAmounts[String(p.id)] ?? ''}
                          onChange={(e) => setVoteAmounts((prev) => ({ ...prev, [String(p.id)]: e.target.value }))}
                          disabled={p.finalized}
                        />
                        <div className="mt-1 text-[11px] text-muted-foreground">提交后该数量将锁定7天</div>
                      </div>

                      <div className="mt-3 flex gap-2">
                        <button
                          className="px-3 py-2 rounded border hover:bg-muted disabled:opacity-50"
                          onClick={() => onVote(p.id, true)}
                          disabled={p.finalized || currentBlock >= p.endBlock}
                        >投赞成票</button>
                        <button
                          className="px-3 py-2 rounded border hover:bg-muted disabled:opacity-50"
                          onClick={() => onVote(p.id, false)}
                          disabled={p.finalized || currentBlock >= p.endBlock}
                        >投反对票</button>
                        {hasGovernorRole && (
                          <button
                            className="px-3 py-2 rounded bg-primary text-primary-foreground disabled:opacity-50"
                            onClick={() => onFinalize(p)}
                            disabled={p.finalized}
                          >开启现货交易</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Create Proposal */}
          <div className="col-span-12 lg:col-span-5">
            <div className="bg-card border border-border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">创建上币提案</h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">基础代币（Base）</label>
                  <div className="flex gap-2">
                    <select
                      className="flex-1 rounded border px-3 py-2 bg-input"
                      value={baseSymbol}
                      onChange={(e) => setBaseSymbol(e.target.value)}
                    >
                      {['BTC', 'USDC', 'USDT', 'WETH'].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <input
                      className="flex-[2] rounded border px-3 py-2 bg-input"
                      placeholder="Base Token Address"
                      value={baseAddress}
                      onChange={(e) => setBaseAddress(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-1">计价代币（Quote）</label>
                  <div className="flex gap-2">
                    <select
                      className="flex-1 rounded border px-3 py-2 bg-input"
                      value={quoteSymbol}
                      onChange={(e) => setQuoteSymbol(e.target.value)}
                    >
                      {['USDC', 'USDT', 'WETH', 'PAS'].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <input
                      className="flex-[2] rounded border px-3 py-2 bg-input"
                      placeholder="Quote Token Address"
                      value={quoteAddress}
                      onChange={(e) => setQuoteAddress(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-1">交易对符号</label>
                  <input
                    className="w-full rounded border px-3 py-2 bg-input"
                    value={`${baseSymbol}/${quoteSymbol}`}
                    disabled
                  />
                </div>

                <button
                  className="w-full px-3 py-2 rounded bg-primary text-primary-foreground disabled:opacity-50"
                  onClick={onCreateProposal}
                  disabled={submitting}
                >{submitting ? '提交中…' : '创建提案'}</button>

                <div className="text-xs text-muted-foreground">
                  • 系统将自动进行重复上币检查（现有市场与有效提案）
                  <br />
                  • 提案通过并最终化后，将尝试自动激活市场（需要治理角色权限）
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}