import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ethers } from 'ethers';
import { message, Button } from 'antd';
import { Client } from '@xmtp/browser-sdk'; // 引入 XMTP 浏览器 SDK
const JoinGroup = () => {
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('group');
  const token = searchParams.get('token');
  const [account, setAccount] = useState(null);
  const [xmtpClient, setXmtpClient] = useState(null); // 存储 XMTP 客户端

  const [loading, setLoading] = useState(false);
  // 存储用户的 NFT 数量
  const [nftBalance, setNftBalance] = useState(0);
  const [tier, setTier] = useState(null); // 存储用户的 NFT 等级
// 合约 ABI
const NFT_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function getFirstTokenOfOwner(address owner) external view returns (uint256 tokenId, uint8 tier, string memory uri)'  // 已有（用于获取NFT数量）
];
  // 检查并连接 MetaMask
  const connectMetaMask = async () => {
    if (!window.ethereum) {
      message.error('请安装 MetaMask 扩展！');
      return null;
    }
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum );
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      setAccount(address);
      message.success(`已连接钱包: ${address}`);

      
      // 从配置中读取红包合约地址
      const contractAddress = process.env.REACT_APP_NFT_CONTRACT_ADDRESS;
      console.log(contractAddress,'contractAddress')
      // 打印当前网络
      const network = await provider.getNetwork();
      console.log(network); // 
      
      // 获取 NFT 平衡
      const nftContract = new ethers.Contract(
        process.env.REACT_APP_NFT_CONTRACT_ADDRESS,
        NFT_ABI,
        provider
      );

      
      const { tokenId, tier, uri } = await nftContract.getFirstTokenOfOwner(address);
      setNftBalance(tokenId.toNumber());
      console.log("tier:", tier, "uri:", uri);
      setTier(tier);

      return address;
    } catch (error) {
      message.error('连接 MetaMask 失败: ' + error.message);
      return null;
    }
  };

  // 初始化 XMTP 客户端（已按可行方案：手动封装 signer，使其符合 XMTP identity 接口）
  const initXmtpClient = async (signer) => {
    try {
      // 注意：返回的 getIdentifier 必须是一个对象（struct），不能是纯字符串
      const wrappedIdentity = {
        type: 'EOA',
        getIdentifier: async () => {
          const addr = await signer.getAddress();
          return {
            identifier: addr.toLowerCase(),
            identifierKind: 'Ethereum',
          };
        },
        // SDK 期望 signMessage 返回 Uint8Array
        signMessage: async (message) => {
          // ethers.Signer.signMessage 支持 string 或 Uint8Array
          const sigHex = await signer.signMessage(message);
          return ethers.utils.arrayify(sigHex);
        },
      };

      const client = await Client.create(wrappedIdentity, { env: 'production' }); // 调整 env 如需要
      setXmtpClient(client);
      return client;
    } catch (error) {
      message.error('初始化 XMTP 客户端失败: ' + error.message);
      return null;
    }
  };

 // 处理加入群组 — 多策略尝试获取 inboxId（兼容不同 SDK 版本）
const handleJoin = async () => {
  if (!account) {
    message.warning('请先连接 MetaMask');
    return;
  }

  if (!groupId) {
    message.error('无效的群组');
    return;
  }

  setLoading(true);

  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    // 1) NFT 检查（保持不变）
    const nftContract = new ethers.Contract(
      process.env.REACT_APP_NFT_CONTRACT_ADDRESS,
      NFT_ABI,
      provider
    );
    const balance = await nftContract.getFirstTokenOfOwner(account);
    if (balance.eq(0)) {
      message.error('您没有 NFT，不能入群');
      return;
    }

    // 2) 初始化 XMTP 客户端（你项目里的封装）
    const client = await initXmtpClient(signer);
    if (!client) {
      message.error('XMTP 客户端初始化失败');
      return;
    }

    // 3) 多策略获取 inboxId
    let inboxId;

    // helper: 清理地址（裸 hex、小写）——用于 newDm 回退
    const cleanAddress = (addr) => addr.replace(/^0x/i, '').toLowerCase();

    // Strategy A: 常见属性 client.address
    try {
      if (client.address) {
        inboxId = client.address;
        console.log('inboxId from client.address:', inboxId);
      }
    } catch (e) {
      console.debug('client.address read failed', e);
    }

    // Strategy B: getUserIdentity() -> { address }
    if (!inboxId && typeof client.getUserIdentity === 'function') {
      try {
        const identity = await client.getUserIdentity();
        inboxId = identity && identity.address;
        console.log('inboxId from client.getUserIdentity():', inboxId);
      } catch (e) {
        console.debug('client.getUserIdentity() failed', e);
      }
    }

    // Strategy C: getUserAddresses() / getAddresses()
    if (!inboxId && typeof client.getUserAddresses === 'function') {
      try {
        const addrs = await client.getUserAddresses();
        if (Array.isArray(addrs) && addrs.length) {
          inboxId = addrs[0];
          console.log('inboxId from client.getUserAddresses()[0]:', inboxId);
        }
      } catch (e) {
        console.debug('client.getUserAddresses() failed', e);
      }
    }

    if (!inboxId && typeof client.getAddresses === 'function') {
      try {
        const addrs = await client.getAddresses();
        if (Array.isArray(addrs) && addrs.length) {
          inboxId = addrs[0];
          console.log('inboxId from client.getAddresses()[0]:', inboxId);
        }
      } catch (e) {
        console.debug('client.getAddresses() failed', e);
      }
    }

    // Strategy D: client.inboxId
    if (!inboxId && client.inboxId) {
      try {
        inboxId = client.inboxId;
        console.log('inboxId from client.inboxId:', inboxId);
      } catch (e) {
        console.debug('client.inboxId read failed', e);
      }
    }

    // Strategy E (fallback): 通过 newDm/self-DM 触发/获取 inboxId
    if (!inboxId) {
      try {
        const addrForDm = cleanAddress(account);
        const possibleDm =
          (client.conversations && client.conversations.newDm && await client.conversations.newDm(addrForDm)) ||
          (client.conversations && client.conversations.newDm && await client.conversations.newDm(account));
        inboxId = possibleDm && possibleDm.id;
        console.log('inboxId from newDm fallback:', inboxId);
      } catch (e) {
        console.debug('fallback newDm failed (may be hex/format issue):', e);
      }
    }

    // 最后检查 inboxId
    if (!inboxId) {
      console.error('无法获取 inboxId（所有策略均失败）');
      message.error('failed to get inboxId — 请确保您的钱包已在 XMTP 注册并重试（或刷新页面）');
      return;
    }

    console.log('Submitting redeem request:', {
    inboxId,
    groupId,
    inviterId: searchParams.get('inviterid'),
    });

    // 4) 调用后端接口加入群
    console.log('Submitting redeem request', { inboxId, groupId });
    const redeemRes = await fetch('http://localhost:3001/api/invite/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inboxId, groupId }),
    });

    const redeemData = await redeemRes.json();
    if (redeemData.ok) {
      message.success('成功加入群组！');
    } else {
      throw new Error(redeemData.error || '加入失败');
    }
  } catch (error) {
    console.error('handleJoin error:', error);
    message.error('加入群组失败: ' + (error && error.message ? error.message : String(error)));
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    connectMetaMask(); // 页面加载时自动尝试连接
  }, []);

   return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>加入群组邀请</h2>
      <p>群组 ID: {groupId}</p>
      <p>Token: {token}</p>
      {account ? (
        <>
          <p>当前钱包: {account}</p>
          <p>您的 NFT 等级: {tier}</p>
        </>
      ) : (
        <Button onClick={connectMetaMask}>连接 MetaMask</Button>
      )}
      <Button type="primary" onClick={handleJoin} loading={loading} disabled={!account || nftBalance === 0}>
        加入群组
      </Button>
    </div>
  );
};

export default JoinGroup;
