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

 // const [xmtpClient, setXmtpClient] = useState(null);
  const [loading, setLoading] = useState(false);
  // 存储用户的 NFT 数量
  const [nftBalance, setNftBalance] = useState(0);
// 合约 ABI
const NFT_ABI = [
  "function balanceOf(address owner) view returns (uint256)", // 已有（用于获取NFT数量）
];
  // 检查并连接 MetaMask
  const connectMetaMask = async () => {
    if (!window.ethereum) {
      message.error('请安装 MetaMask 扩展！');
      return null;
    }
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      setAccount(address);
      message.success(`已连接钱包: ${address}`);

      // 获取 NFT 平衡
      const nftContract = new ethers.Contract(
        process.env.REACT_APP_NFT_CONTRACT_ADDRESS,
        NFT_ABI,
        provider
      );
      const balance = await nftContract.balanceOf(address);
      setNftBalance(balance.toNumber());

      return address;
    } catch (error) {
      message.error('连接 MetaMask 失败: ' + error.message);
      return null;
    }
  };

  // 初始化 XMTP 客户端
  const initXmtpClient = async (signer) => {
    try {
      const client = await Client.create(signer, { env: 'production' }); // 调整 env 如需要
      setXmtpClient(client);
      return client;
    } catch (error) {
      message.error('初始化 XMTP 客户端失败: ' + error.message);
      return null;
    }
  };

  // 处理加入群组
  const handleJoin = async () => {
    if (!account) {
      message.warning('请先连接 MetaMask');
      return;
    }
   /* if (!groupId || !token) {
      message.error('无效的邀请链接');
      return;
    }*/
    setLoading(true);

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const client = await initXmtpClient(signer);
      if (!client) return;

     //检查当前账户是否有NFT
      // 实例化 NFT 合约,从配置中读取NFT地址**需确认
      const nftContract = new ethers.Contract(
        process.env.REACT_APP_NFT_CONTRACT_ADDRESS,
        NFT_ABI,
        provider
      );

      // 获取用户拥有的 NFT 数量（使用状态，如果已设置）
      if (nftBalance === 0) {
        message.error('您没有 NFT 不能入群');
        return;
      }
/*
      // 步骤1: 获取 nonce
      const nonceRes = await fetch(`/api/invite/nonce?token=${token}`);
      const { nonce } = await nonceRes.json();
      if (!nonce) throw new Error('获取 nonce 失败');

      // 步骤2: 签名 nonce
      const signature = await signer.signMessage(nonce);
*/
      // 步骤3: 获取 inboxId (从 XMTP 客户端)
      const inboxId = client.address; // 或使用 client.inboxId 如果可用

      // 步骤4: 兑换邀请
      const redeemRes = await fetch('/api/invite/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, inboxId, inviterid: account }),
      });
      const redeemData = await redeemRes.json();
      if (redeemData.ok) {
        message.success('成功加入群组！');
      } else {
        throw new Error(redeemData.error || '加入失败');
      }
    } catch (error) {
      message.error('加入群组失败: ' + error.message);
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
          <p>您的 NFT 数量: {nftBalance}</p>
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