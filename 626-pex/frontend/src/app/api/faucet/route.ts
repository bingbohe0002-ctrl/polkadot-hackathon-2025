import { NextResponse } from 'next/server';
import { createWalletClient, createPublicClient, http, parseEther, formatEther, parseUnits, encodeFunctionData } from 'viem';
import type { Chain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { ERC20ABI } from '@/lib/contracts/abi';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import deployed from '@/lib/contracts/deployed.json';
import { getTokenAddress } from '@/lib/contracts/addresses';

export async function POST(request: Request) {
  try {
    const { address, token } = await request.json();

    if (!address || typeof address !== 'string') {
      return NextResponse.json({ error: '缺少有效地址' }, { status: 400 });
    }

    const mode = (process.env.FAUCET_MODE || 'auto').trim().toLowerCase();

    // ===== 优先尝试 PolkaVM revive 路径（仅在未指定 token 时） =====
    const POLKAVM_WS_URL = (process.env.POLKAVM_WS_URL || 'ws://127.0.0.1:9944').trim();
    const POLKAVM_FAUCET_SURI = (process.env.POLKAVM_FAUCET_SURI || '//Alice').trim();
    const FALLBACK_GAS_REF_TIME = Number(process.env.FALLBACK_GAS_REF_TIME || '1000000000');
    const USDC_ADDRESS = (process.env.USDC_ADDRESS || process.env.NEXT_PUBLIC_USDC_ADDRESS || (deployed as any)?.tokens?.usdc || '').trim();

    const tryPolkaVM = async () => {
      const api = await ApiPromise.create({ provider: new WsProvider(POLKAVM_WS_URL) });
      if (!api.tx?.revive) {
        await api.disconnect();
        throw new Error('revive pallet 不可用');
      }
      console.log('[Faucet] Using PolkaVM revive branch:', POLKAVM_WS_URL);
      const keyring = new Keyring({ type: 'sr25519' });
      const signer = keyring.addFromUri(POLKAVM_FAUCET_SURI);
      const to = address as `0x${string}`;
      const nonce = await api.rpc.system.accountNextIndex(signer.address);
      const header = await api.rpc.chain.getHeader();
      console.log('[Faucet][PolkaVM] head:', header.number.toString(), 'nonce:', nonce.toString());
      // 可选：mapAccount（已映射时可能抛错，忽略）
      try {
        const unsub = await api.tx.revive.mapAccount().signAndSend(
          signer,
          { era: 0, nonce: nonce.toNumber() },
          ({ status }) => {
            if (status.isInBlock || status.isFinalized) { try { unsub && unsub(); } catch {}; }
          }
        );
      } catch (e) {
        console.warn('[Faucet][PolkaVM] mapAccount error:', (e as any)?.message || String(e));
      }
      // 发放原生 ETH（默认 FAUCET_AMOUNT 或 0.001）
      const requestedStr = process.env.FAUCET_AMOUNT?.trim() || '0.001';
      const wei = parseUnits(requestedStr, 18);
      const gasWeight = api.registry.createType('WeightV2', { refTime: FALLBACK_GAS_REF_TIME, proofSize: 0 });
      await new Promise(async (resolve, reject) => {
        try {
          const unsub = await api.tx.revive.call(
            to.toLowerCase(),
            wei.toString(),
            gasWeight,
            0,
            '0x'
          ).signAndSend(
            signer,
            { era: 0, nonce: (await api.rpc.system.accountNextIndex(signer.address)).toNumber() },
            ({ status }) => {
              if (status.isInBlock || status.isFinalized) { try { unsub && unsub(); } catch {}; resolve(undefined); }
            }
          );
        } catch (e) { console.error('[Faucet][PolkaVM] revive.call error:', (e as any)?.message || String(e)); reject(e); }
      });
      // 可选：发放 USDC
      const usdcAmountStr = process.env.FAUCET_USDC_AMOUNT?.trim() || '100000';
      let usdcTxDone = false;
      if (USDC_ADDRESS && USDC_ADDRESS.toLowerCase() !== '0x0000000000000000000000000000000000000000') {
        const data = encodeFunctionData({ abi: ERC20ABI as any, functionName: 'transfer', args: [to, parseUnits(usdcAmountStr, 6)] });
        const gasWeight2 = api.registry.createType('WeightV2', { refTime: FALLBACK_GAS_REF_TIME, proofSize: 0 });
        await new Promise(async (resolve, reject) => {
          try {
            const unsub = await api.tx.revive.call(
              USDC_ADDRESS.toLowerCase(),
              '0',
              gasWeight2,
              0,
              data
            ).signAndSend(
              signer,
              { era: 0, nonce: (await api.rpc.system.accountNextIndex(signer.address)).toNumber() },
              ({ status }) => {
                if (status.isInBlock || status.isFinalized) { try { unsub && unsub(); } catch {}; usdcTxDone = true; resolve(undefined); }
              }
            );
          } catch (e) { console.error('[Faucet][PolkaVM] revive.call(USDC) error:', (e as any)?.message || String(e)); reject(e); }
        });
      }
      await api.disconnect();
      return { ok: true, mode: 'polkavm', address: to, amount: `${requestedStr} ETH`, usdcAmount: `${usdcAmountStr} USDC`, usdcSent: usdcTxDone };
    };

    if (!token) {
      if (mode === 'polkavm') {
        try {
          const res = await tryPolkaVM();
          return NextResponse.json(res);
        } catch (err: any) {
          console.error('[Faucet] PolkaVM 模式失败:', err?.message || err);
          return NextResponse.json({ error: 'PolkaVM Faucet 失败', detail: err?.message || String(err) }, { status: 500 });
        }
      } else if (mode === 'auto') {
        // auto 模式：先尝试 PolkaVM，失败则回退到 EVM
        try {
          const res = await tryPolkaVM();
          return NextResponse.json(res);
        } catch (err) {
          console.log('[Faucet] PolkaVM connect or tx failed, fallback to EVM');
        }
      }
    }

    // ===== 回退到 Hardhat/viem EVM 路径 =====
    const privateKey =
      process.env.FAUCET_PRIVATE_KEY || process.env.PRIVATE_KEY || '';
    if (!privateKey || !privateKey.startsWith('0x') || privateKey.length !== 66) {
      return NextResponse.json(
        { error: '服务端未配置水龙头私钥（FAUCET_PRIVATE_KEY 或 PRIVATE_KEY）' },
        { status: 500 }
      );
    }

    const rawRpc = (process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545').trim();
    const rpcUrl = rawRpc.replace('localhost', '127.0.0.1');

    const account = privateKeyToAccount(privateKey as `0x${string}`);
    const evmChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || '420420422');
    const evmChain: Chain = {
      id: evmChainId,
      name: process.env.NEXT_PUBLIC_CHAIN_NAME || (evmChainId === 31337 ? 'Hardhat Local' : 'AssetHub Testnet'),
      network: evmChainId === 31337 ? 'hardhat' : 'assethub',
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      rpcUrls: {
        default: { http: [rpcUrl] },
        public: { http: [rpcUrl] },
      },
    };
    const client = createWalletClient({ account, chain: evmChain, transport: http(rpcUrl) });
    const publicClient = createPublicClient({ chain: evmChain, transport: http(rpcUrl) });

    // 在本地 31337 时可使用 hardhat_setBalance；非本地网络（如 AssetHub）禁用该步骤
    const targetStr = process.env.FAUCET_TARGET_BALANCE?.trim() || '500000000';
    const targetWei = parseEther(targetStr);
    const currentBalance = await publicClient.getBalance({ address: account.address });
    if (evmChainId === 31337 && currentBalance < targetWei) {
      const hexValue = `0x${targetWei.toString(16)}`;
      try {
        await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method: 'hardhat_setBalance', params: [account.address, hexValue] }),
        });
      } catch (_) {}
    }

    // 仅发放代币（USDC/BTC/USDT），不发放原生 PAS；保留 gasPrice 供合约转账使用
    let gasPrice: bigint | null = null;
    try {
      gasPrice = await publicClient.getGasPrice();
    } catch (_) {}
    if (!gasPrice || gasPrice <= 0n) {
      gasPrice = 1000000000n; // 1 gwei fallback
    }
    // 统一设置最低 gasPrice 下限，避免 AssetHub 下的 underpriced 导致 Invalid Transaction
    try {
      const minGwei = BigInt(process.env.FAUCET_MIN_GASPRICE_GWEI || '10');
      const minWei = minGwei * 1000000000n;
      if (gasPrice < minWei) gasPrice = minWei;
    } catch (_) {}

    const usdcAddress = (process.env.NEXT_PUBLIC_USDC_ADDRESS || (deployed as any)?.tokens?.usdc || '').trim();
    const btcAddress = (process.env.NEXT_PUBLIC_BTC_ADDRESS || (deployed as any)?.tokens?.btc || '').trim();
    const usdtAddress = (process.env.NEXT_PUBLIC_USDT_ADDRESS || getTokenAddress(evmChainId, 'USDT') || '').trim();
    const zero = '0x0000000000000000000000000000000000000000';
    const tokenStr = typeof token === 'string' ? token.toUpperCase() : undefined;
    const wantUsdc = tokenStr ? tokenStr === 'USDC' : true;
    const wantBtc = tokenStr ? tokenStr === 'BTC' : true;
    const wantUsdt = tokenStr ? tokenStr === 'USDT' : true;

    let usdcTxHash: `0x${string}` | null = null;
    let usdcError: string | null = null;
    let usdcLastError: string | null = null;
    const usdcAmountStr = process.env.FAUCET_USDC_AMOUNT?.trim() || '100000';

    // USDT 变量声明
    let usdtTxHash: `0x${string}` | null = null;
    let usdtError: string | null = null;
    let usdtLastError: string | null = null;
    const usdtAmountStr = process.env.FAUCET_USDT_AMOUNT?.trim() || '100000';
    try {
      if (!wantUsdc) {
        // 跳过 USDC 发放
      } else if (!usdcAddress || usdcAddress.toLowerCase() === zero) {
        // 无 USDC 地址则跳过
      } else {
        const bytecode = await publicClient.getBytecode({ address: usdcAddress as `0x${string}` });
        if (!bytecode || bytecode === '0x') {
          usdcError = 'USDC 地址未部署或不正确（请检查 NEXT_PUBLIC_USDC_ADDRESS 或 deployed.tokens.usdc）';
        } else {
          const amountUSDC = parseUnits(usdcAmountStr, 6);
          const faucetUsdcBalance = await publicClient.readContract({
            address: usdcAddress as `0x${string}`,
            abi: ERC20ABI as any,
            functionName: 'balanceOf',
            args: [account.address],
          }) as unknown as bigint;
          if (faucetUsdcBalance < amountUSDC) {
            usdcError = `水龙头 USDC 余额不足（当前：${Number(faucetUsdcBalance) / 1e6}，目标：${Number(amountUSDC) / 1e6}）`;
          } else {
            let usdcGas: bigint;
            const usdcGasEnv = process.env.FAUCET_USDC_GAS;
            if (usdcGasEnv && /^\d+$/.test(usdcGasEnv)) {
              usdcGas = BigInt(usdcGasEnv);
            } else {
              try {
                const est = await publicClient.estimateContractGas({
                  account,
                  address: usdcAddress as `0x${string}`,
                  abi: ERC20ABI as any,
                  functionName: 'transfer',
                  args: [address as `0x${string}`, amountUSDC],
                });
                usdcGas = est + est / 5n; // +20% buffer
              } catch (_) {
                usdcGas = 500000000n; // large fallback for AssetHub EVM
              }
            }
            // 检查水龙头 PAS 余额是否足够支付 gas
            const faucetPasBalance = await publicClient.getBalance({ address: account.address });
            const usdcGasBudget = gasPrice * usdcGas;
            if (faucetPasBalance < usdcGasBudget) {
              usdcError = `水龙头 PAS 余额不足支付 USDC 转账 gas（需至少 ${formatEther(usdcGasBudget)} PAS，当前 ${formatEther(faucetPasBalance)} PAS）。请为水龙头地址充值 PAS。`;
            } else {
              let usdcNonce = await publicClient.getTransactionCount({ address: account.address, blockTag: 'pending' });
              let usdcGasPrice = gasPrice;
              let usdcLastError: string | null = null;
              const maxGasPriceWei = BigInt(process.env.FAUCET_MAX_GASPRICE_GWEI || '50') * 1000000000n;
              for (let attempt = 0; attempt < 5; attempt++) {
                try {
                  usdcTxHash = await client.writeContract({
                    account,
                    chain: evmChain,
                    address: usdcAddress as `0x${string}`,
                    abi: ERC20ABI as any,
                    functionName: 'transfer',
                    args: [address as `0x${string}`, amountUSDC],
                    gasPrice: usdcGasPrice,
                    gas: usdcGas,
                    nonce: usdcNonce,
                    type: 'legacy',
                  });
                  const receipt = await publicClient.waitForTransactionReceipt({ hash: usdcTxHash });
                  if (receipt.status !== 'success') {
                    throw new Error('USDC 发放交易失败');
                  }
                  break;
                } catch (e: any) {
                  console.warn(`[USDC] writeContract error:`, e);
                  const msg = (e?.message || '').toLowerCase();
                  usdcLastError = e?.message || usdcLastError;
                  if (msg.includes('temporarily banned') || msg.includes('underpriced') || msg.includes('invalid transaction')) {
                    // bump gas price and retry with refreshed nonce
                    usdcGasPrice = usdcGasPrice + usdcGasPrice / 4n; // +25%
                    if (usdcGasPrice > maxGasPriceWei) usdcGasPrice = maxGasPriceWei;
                    await new Promise((r) => setTimeout(r, 1500));
                    usdcNonce = await publicClient.getTransactionCount({ address: account.address, blockTag: 'pending' });
                    usdcTxHash = null;
                    continue;
                  } else {
                    throw e;
                  }
                }
              }
            }
          }
        }
      }
    } catch (e: any) {
      usdcError = e?.message || 'USDC 发放失败';
    }
    if (wantUsdc && !usdcTxHash) {
      usdcError = `USDC 发放交易未成功提交${usdcLastError ? `（最后错误：${usdcLastError}）` : ''}`;
      try {
        const data = encodeFunctionData({ abi: ERC20ABI as any, functionName: 'transfer', args: [address as `0x${string}`, parseUnits(usdcAmountStr, 6)] });
        const nonce = await publicClient.getTransactionCount({ address: account.address, blockTag: 'pending' });
        let fallbackUsdcGas: bigint;
        const usdcGasEnv2 = process.env.FAUCET_USDC_GAS;
        if (usdcGasEnv2 && /^\d+$/.test(usdcGasEnv2)) {
          fallbackUsdcGas = BigInt(usdcGasEnv2);
        } else {
          try {
            const est2 = await publicClient.estimateContractGas({
              account,
              address: usdcAddress as `0x${string}`,
              abi: ERC20ABI as any,
              functionName: 'transfer',
              args: [address as `0x${string}`, parseUnits(usdcAmountStr, 6)],
            });
            fallbackUsdcGas = est2 + est2 / 5n;
          } catch (_) {
            fallbackUsdcGas = 500000000n;
          }
        }
        const tx = await client.sendTransaction({ account, chain: evmChain, to: usdcAddress as `0x${string}`, data, gas: fallbackUsdcGas, gasPrice, nonce, type: 'legacy' });
        usdcTxHash = tx as `0x${string}`;
        const receipt = await publicClient.waitForTransactionReceipt({ hash: usdcTxHash });
        if (receipt.status !== 'success') throw new Error('USDC Fallback 交易失败');
        usdcError = null;
      } catch (e2: any) {
        console.warn('[USDC] fallback sendTransaction error:', e2);
      }
    }

    // USDT 同步发放：读取映射或环境 USDT 地址并执行 ERC20 transfer（6 位小数，默认目标 100000）
    try {
      if (!wantUsdt) {
        // 跳过 USDT 发放
      } else if (!usdtAddress || usdtAddress.toLowerCase() === zero) {
        // 无 USDT 地址则跳过
      } else {
        const bytecode = await publicClient.getBytecode({ address: usdtAddress as `0x${string}` });
        if (!bytecode || bytecode === '0x') {
          usdtError = 'USDT 地址未部署或不正确（请检查 NEXT_PUBLIC_USDT_ADDRESS 或映射）';
        } else {
          const amountUSDT = parseUnits(usdtAmountStr, 6);
          const faucetUsdtBalance = await publicClient.readContract({
            address: usdtAddress as `0x${string}`,
            abi: ERC20ABI as any,
            functionName: 'balanceOf',
            args: [account.address],
          }) as unknown as bigint;
          if (faucetUsdtBalance < amountUSDT) {
            usdtError = `水龙头 USDT 余额不足（当前：${Number(faucetUsdtBalance) / 1e6}，目标：${Number(amountUSDT) / 1e6}）`;
          } else {
            let usdtGas: bigint;
            const usdtGasEnv = process.env.FAUCET_USDT_GAS;
            if (usdtGasEnv && /^\d+$/.test(usdtGasEnv)) {
              usdtGas = BigInt(usdtGasEnv);
            } else {
              try {
                const est = await publicClient.estimateContractGas({
                  account,
                  address: usdtAddress as `0x${string}`,
                  abi: ERC20ABI as any,
                  functionName: 'transfer',
                  args: [address as `0x${string}`, amountUSDT],
                });
                usdtGas = est + est / 5n; // +20% buffer
              } catch (_) {
                usdtGas = 500000000n; // fallback for AssetHub
              }
            }
            const faucetPasBalance3 = await publicClient.getBalance({ address: account.address });
            const usdtGasBudget = gasPrice * usdtGas;
            if (faucetPasBalance3 < usdtGasBudget) {
              usdtError = `水龙头 PAS 余额不足支付 USDT 转账 gas（需至少 ${formatEther(usdtGasBudget)} PAS，当前 ${formatEther(faucetPasBalance3)} PAS）。请为水龙头地址充值 PAS。`;
            } else {
              let usdtNonce = await publicClient.getTransactionCount({ address: account.address, blockTag: 'pending' });
              let usdtGasPrice = gasPrice;
              const maxGasPriceWei = BigInt(process.env.FAUCET_MAX_GASPRICE_GWEI || '50') * 1000000000n;
              for (let attempt = 0; attempt < 5; attempt++) {
                try {
                  usdtTxHash = await client.writeContract({
                    account,
                    chain: evmChain,
                    address: usdtAddress as `0x${string}`,
                    abi: ERC20ABI as any,
                    functionName: 'transfer',
                    args: [address as `0x${string}`, amountUSDT],
                    gasPrice: usdtGasPrice,
                    gas: usdtGas,
                    nonce: usdtNonce,
                    type: 'legacy',
                  });
                  const receipt = await publicClient.waitForTransactionReceipt({ hash: usdtTxHash });
                  if (receipt.status !== 'success') {
                    throw new Error('USDT 发放交易失败');
                  }
                  break;
                } catch (e: any) {
                  console.warn(`[USDT] writeContract error:`, e);
                  const msg = (e?.message || '').toLowerCase();
                  usdtLastError = e?.message || usdtLastError;
                  if (msg.includes('temporarily banned') || msg.includes('underpriced') || msg.includes('invalid transaction')) {
                    usdtGasPrice = usdtGasPrice + usdtGasPrice / 4n; // +25%
                    if (usdtGasPrice > maxGasPriceWei) usdtGasPrice = maxGasPriceWei;
                    await new Promise((r) => setTimeout(r, 1500));
                    usdtNonce = await publicClient.getTransactionCount({ address: account.address, blockTag: 'pending' });
                    usdtTxHash = null;
                    continue;
                  } else {
                    throw e;
                  }
                }
              }
            }
          }
        }
      }
    } catch (e: any) {
      usdtError = e?.message || 'USDT 发放失败';
    }
    if (wantUsdt && !usdtTxHash) {
      usdtError = `USDT 发放交易未成功提交${usdtLastError ? `（最后错误：${usdtLastError}）` : ''}`;
      try {
        const data = encodeFunctionData({ abi: ERC20ABI as any, functionName: 'transfer', args: [address as `0x${string}`, parseUnits(usdtAmountStr, 6)] });
        const nonce = await publicClient.getTransactionCount({ address: account.address, blockTag: 'pending' });
        let fallbackUsdtGas: bigint;
        const usdtGasEnv2 = process.env.FAUCET_USDT_GAS;
        if (usdtGasEnv2 && /^\d+$/.test(usdtGasEnv2)) {
          fallbackUsdtGas = BigInt(usdtGasEnv2);
        } else {
          try {
            const est2 = await publicClient.estimateContractGas({
              account,
              address: usdtAddress as `0x${string}`,
              abi: ERC20ABI as any,
              functionName: 'transfer',
              args: [address as `0x${string}`, parseUnits(usdtAmountStr, 6)],
            });
            fallbackUsdtGas = est2 + est2 / 5n;
          } catch (_) {
            fallbackUsdtGas = 500000000n;
          }
        }
        const tx = await client.sendTransaction({ account, chain: evmChain, to: usdtAddress as `0x${string}`, data, gas: fallbackUsdtGas, gasPrice, nonce, type: 'legacy' });
        usdtTxHash = tx as `0x${string}`;
        const receipt = await publicClient.waitForTransactionReceipt({ hash: usdtTxHash });
        if (receipt.status !== 'success') throw new Error('USDT Fallback 交易失败');
        usdtError = null;
      } catch (e2: any) {
        console.warn('[USDT] fallback sendTransaction error:', e2);
      }
    }

        // BTC 同步发放：读取环境 BTC 地址并执行 ERC20 transfer（读取 decimals，默认目标 5 BTC）
        let btcTxHash: `0x${string}` | null = null;
        let btcError: string | null = null;
        let btcLastError: string | null = null;
        const btcAmountStr = process.env.FAUCET_BTC_AMOUNT?.trim() || '5';
        try {
          if (!wantBtc) {
            // 跳过 BTC 发放
          } else if (!btcAddress || btcAddress.toLowerCase() === zero) {
            // 无 BTC 地址则跳过
          } else {
            const bytecode = await publicClient.getBytecode({ address: btcAddress as `0x${string}` });
            if (!bytecode || bytecode === '0x') {
              btcError = 'BTC 地址未部署或不正确（请检查 NEXT_PUBLIC_BTC_ADDRESS 或 deployed.tokens.btc）';
            } else {
              // 读取 decimals
              let btcDecimals = 8;
              try {
                const decimalsRaw = await publicClient.readContract({
                  address: btcAddress as `0x${string}`,
                  abi: ERC20ABI as any,
                  functionName: 'decimals',
                  args: [],
                }) as unknown as bigint;
                btcDecimals = Number(decimalsRaw);
              } catch (_) {}
              const amountBTC = parseUnits(btcAmountStr, btcDecimals);
              const faucetBtcBalance = await publicClient.readContract({
                address: btcAddress as `0x${string}`,
                abi: ERC20ABI as any,
                functionName: 'balanceOf',
                args: [account.address],
              }) as unknown as bigint;
              if (faucetBtcBalance < amountBTC) {
                btcError = `水龙头 BTC 余额不足（当前：${Number(faucetBtcBalance) / 10 ** btcDecimals}，目标：${btcAmountStr}）`;
              } else {
                let btcGas: bigint;
                const btcGasEnv = process.env.FAUCET_BTC_GAS;
                if (btcGasEnv && /^\d+$/.test(btcGasEnv)) {
                  btcGas = BigInt(btcGasEnv);
                } else {
                  try {
                    const est = await publicClient.estimateContractGas({
                      account,
                      address: btcAddress as `0x${string}`,
                      abi: ERC20ABI as any,
                      functionName: 'transfer',
                      args: [address as `0x${string}`, amountBTC],
                    });
                    btcGas = est + est / 5n;
                  } catch (_) {
                    btcGas = 600000000n;
                  }
                }
                const faucetPasBalance2 = await publicClient.getBalance({ address: account.address });
                const btcGasBudget = gasPrice * btcGas;
                if (faucetPasBalance2 < btcGasBudget) {
                  btcError = `水龙头 PAS 余额不足支付 BTC 转账 gas（需至少 ${formatEther(btcGasBudget)} PAS，当前 ${formatEther(faucetPasBalance2)} PAS）。请为水龙头地址充值 PAS。`;
                } else {
                  let btcNonce = await publicClient.getTransactionCount({ address: account.address, blockTag: 'pending' });
                  let btcGasPrice = gasPrice;
                  const maxGasPriceWei = BigInt(process.env.FAUCET_MAX_GASPRICE_GWEI || '50') * 1000000000n;
                  for (let attempt = 0; attempt < 5; attempt++) {
                    try {
                      btcTxHash = await client.writeContract({
                        account,
                        chain: evmChain,
                        address: btcAddress as `0x${string}`,
                        abi: ERC20ABI as any,
                        functionName: 'transfer',
                        args: [address as `0x${string}`, amountBTC],
                        gasPrice: btcGasPrice,
                        gas: btcGas,
                        nonce: btcNonce,
                        type: 'legacy',
                      });
                      const receipt = await publicClient.waitForTransactionReceipt({ hash: btcTxHash });
                      if (receipt.status !== 'success') {
                        throw new Error('BTC 发放交易失败');
                      }
                      break;
                    } catch (e: any) {
                      console.warn(`[BTC] writeContract error:`, e);
                      const msg = (e?.message || '').toLowerCase();
                      btcLastError = e?.message || btcLastError;
                      if (msg.includes('temporarily banned') || msg.includes('underpriced') || msg.includes('invalid transaction')) {
                        btcGasPrice = btcGasPrice + btcGasPrice / 4n;
                        if (btcGasPrice > maxGasPriceWei) btcGasPrice = maxGasPriceWei;
                        await new Promise((r) => setTimeout(r, 1500));
                        btcNonce = await publicClient.getTransactionCount({ address: account.address, blockTag: 'pending' });
                        btcTxHash = null;
                        continue;
                      } else {
                        throw e;
                      }
                    }
                  }
                }
              }
            }
          }
        } catch (e: any) {
          btcError = e?.message || 'BTC 发放失败';
        }
        if (wantBtc && !btcTxHash) {
          btcError = `BTC 发放交易未成功提交${btcLastError ? `（最后错误：${btcLastError}）` : ''}`;
          try {
            const data = encodeFunctionData({ abi: ERC20ABI as any, functionName: 'transfer', args: [address as `0x${string}`, parseUnits(btcAmountStr, 8)] });
            const nonce = await publicClient.getTransactionCount({ address: account.address, blockTag: 'pending' });
            let fallbackBtcGas: bigint;
            const btcGasEnv2 = process.env.FAUCET_BTC_GAS;
            if (btcGasEnv2 && /^\d+$/.test(btcGasEnv2)) {
              fallbackBtcGas = BigInt(btcGasEnv2);
            } else {
              try {
                const est2 = await publicClient.estimateContractGas({
                  account,
                  address: btcAddress as `0x${string}`,
                  abi: ERC20ABI as any,
                  functionName: 'transfer',
                  args: [address as `0x${string}`, parseUnits(btcAmountStr, 8)],
                });
                fallbackBtcGas = est2 + est2 / 5n;
              } catch (_) {
                fallbackBtcGas = 600000000n;
              }
            }
            const tx = await client.sendTransaction({ account, chain: evmChain, to: btcAddress as `0x${string}`, data, gas: fallbackBtcGas, gasPrice, nonce, type: 'legacy' });
            btcTxHash = tx as `0x${string}`;
            const receipt = await publicClient.waitForTransactionReceipt({ hash: btcTxHash });
            if (receipt.status !== 'success') throw new Error('BTC Fallback 交易失败');
            btcError = null;
          } catch (e2: any) {
            console.warn('[BTC] fallback sendTransaction error:', e2);
          }
        }
        
        return NextResponse.json({
          usdcTxHash,
          usdcAmount: `${usdcAmountStr} USDC`,
          usdcError,
          usdtTxHash,
          usdtAmount: `${usdtAmountStr} USDT`,
          usdtError,
          btcTxHash,
          // btcAmount 和 btcError 在下方原有逻辑会被设置
          // 这里保持结构一致以方便前端处理
        });
  } catch (error: any) {
    console.error('Faucet error:', error);
    return NextResponse.json(
      { error: error?.message || '领取失败，请稍后重试' },
      { status: 500 }
    );
  }
}