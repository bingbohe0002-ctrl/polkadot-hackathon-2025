import axios from 'axios';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { web3FromAddress } from '@polkadot/extension-dapp';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const WS_PROVIDER = import.meta.env.VITE_WS_PROVIDER || 'wss://westend-rpc.polkadot.io';
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

// Contract ABI (简化版本，实际应该从编译的 metadata.json 导入)
const CONTRACT_ABI = {
  source: {
    hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    language: "ink! 4.3.0",
    compiler: "rustc 1.70.0",
  },
  contract: {
    name: "kronos_prediction",
    version: "0.1.0",
    authors: ["Kronos Team"],
  },
  spec: {
    constructors: [
      {
        args: [],
        docs: [],
        label: "new",
        payable: false,
        returnType: {
          displayName: ["ink_primitives", "ConstructorResult"],
          type: 0,
        },
        selector: "0x9bae9d5e",
      },
    ],
    docs: [],
    events: [],
    lang_error: {
      displayName: ["ink", "LangError"],
      type: 3,
    },
    messages: [
      {
        args: [
          {
            label: "symbol",
            type: {
              displayName: ["String"],
              type: 6,
            },
          },
          {
            label: "predicted_value",
            type: {
              displayName: ["u128"],
              type: 5,
            },
          },
        ],
        docs: ["Submit a prediction"],
        label: "submit_prediction",
        mutates: true,
        payable: false,
        returnType: {
          displayName: ["ink", "MessageResult"],
          type: 0,
        },
        selector: "0x12345678",
      },
    ],
  },
  storage: {
    root: {
      layout: {
        struct: {
          fields: [],
          name: "KronosPrediction",
        },
      },
      root_key: "0x00000000",
    },
  },
  types: [
    {
      id: 0,
      type: {
        def: {
          variant: {
            variants: [
              {
                fields: [
                  {
                    type: 1,
                  },
                ],
                index: 0,
                name: "Ok",
              },
              {
                fields: [
                  {
                    type: 2,
                  },
                ],
                index: 1,
                name: "Err",
              },
            ],
          },
        },
        params: [
          {
            name: "T",
            type: 1,
          },
          {
            name: "E",
            type: 2,
          },
        ],
        path: ["Result"],
      },
    },
  ],
};

/**
 * 从后端获取预测数据
 */
export async function getPrediction(symbol: string, days: number = 7) {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/predict`, {
      params: { symbol, days },
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching prediction:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch prediction');
  }
}

/**
 * 获取历史数据
 */
export async function getHistory(symbol: string, days: number = 7) {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/history`, {
      params: { symbol, days },
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching history:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch history');
  }
}

/**
 * 获取支持的资产列表
 */
export async function getSupportedAssets() {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/assets`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching assets:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch assets');
  }
}

/**
 * 提交预测到链上
 */
export async function submitPredictionToChain(
  account: InjectedAccountWithMeta,
  symbol: string,
  predictedValue: number
) {
  try {
    // 如果合约地址未配置，模拟提交
    if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === '') {
      console.warn('Contract address not configured, simulating submission');
      
      // 模拟延迟
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        success: true,
        blockHash: '0x' + Math.random().toString(16).substr(2, 64),
        message: 'Prediction submitted successfully (simulated)',
      };
    }

    // 连接到 Polkadot
    const wsProvider = new WsProvider(WS_PROVIDER);
    const api = await ApiPromise.create({ provider: wsProvider });

    // 创建合约实例
    const contract = new ContractPromise(api, CONTRACT_ABI, CONTRACT_ADDRESS);

    // 获取注入器
    const injector = await web3FromAddress(account.address);

    // 将价格转换为合约所需格式（去除小数点）
    const valueInContract = Math.floor(predictedValue * 100); // 保留2位小数精度

    // 估算 gas
    const gasLimit = api.registry.createType('WeightV2', {
      refTime: 30000000000,
      proofSize: 1000000,
    }) as any;

    // 提交交易
    const result = await new Promise((resolve, reject) => {
      contract.tx
        .submitPrediction(
          { gasLimit, storageDepositLimit: null },
          symbol,
          valueInContract
        )
        .signAndSend(
          account.address,
          { signer: injector.signer },
          ({ status, events, dispatchError }) => {
            if (status.isInBlock) {
              console.log('In block:', status.asInBlock.toHex());
            }

            if (status.isFinalized) {
              console.log('Finalized:', status.asFinalized.toHex());
              
              // 检查错误
              if (dispatchError) {
                if (dispatchError.isModule) {
                  const decoded = api.registry.findMetaError(dispatchError.asModule);
                  reject(new Error(`${decoded.section}.${decoded.name}: ${decoded.docs}`));
                } else {
                  reject(new Error(dispatchError.toString()));
                }
              } else {
                resolve({
                  success: true,
                  blockHash: status.asFinalized.toHex(),
                  events: events.map(e => e.toHuman()),
                });
              }
            }
          }
        )
        .catch(reject);
    });

    await api.disconnect();
    return result;
  } catch (error: any) {
    console.error('Error submitting prediction:', error);
    throw new Error(error.message || 'Failed to submit prediction to chain');
  }
}

/**
 * 查询链上预测
 */
export async function queryPrediction(
  accountAddress: string,
  symbol: string
) {
  try {
    if (!CONTRACT_ADDRESS) {
      throw new Error('Contract address not configured');
    }

    const wsProvider = new WsProvider(WS_PROVIDER);
    const api = await ApiPromise.create({ provider: wsProvider });
    const contract = new ContractPromise(api, CONTRACT_ABI, CONTRACT_ADDRESS);

    const { result, output } = await contract.query.getPrediction(
      accountAddress,
      { gasLimit: -1 },
      accountAddress,
      symbol
    );

    await api.disconnect();

    if (result.isOk) {
      return output?.toHuman();
    } else {
      throw new Error('Query failed');
    }
  } catch (error: any) {
    console.error('Error querying prediction:', error);
    throw new Error(error.message || 'Failed to query prediction');
  }
}

