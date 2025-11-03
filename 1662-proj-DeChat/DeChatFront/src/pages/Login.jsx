import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { motion } from 'framer-motion';
//import Header from './Header';
import MainContent from './MainContent';
import './Login.css';
import { Client } from '@xmtp/browser-sdk';



export default function Login({ setAccount, setXmtpClient }) {
  const [nftInfo, setNftInfo] = useState(null); // 存储 NFT 信息
// 合约 ABI
const NFT_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function getFirstTokenOfOwner(address owner) external view returns (uint256 tokenId, uint8 tier, string memory uri)'  // 已有（用于获取NFT数量）
];
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const connect = async () => {
    setErr('');
    setLoading(true);
    
    try {
      if (!window.ethereum) {
        setErr('未检测到 MetaMask，请先安装 MetaMask 浏览器扩展。');
        setLoading(false);
        return;
      }

      // 检查网络连接
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const network = await provider.getNetwork();
      console.log('当前钱包链接的网络ID是:', network.chainId);
      

      // 连接 MetaMask，获取地址（仅进行身份验证）
      await provider.send('eth_requestAccounts', []);
      const eoaSigner = provider.getSigner();
      const address = (await eoaSigner.getAddress()).toLowerCase();

      // 初始化 XMTP 客户端
      const client = await Client.create({
        type: 'EOA',
        getIdentifier: () => ({
          identifier: address,
          identifierKind: 'Ethereum',
        }),
        
        signMessage: async (message) => {
          const sigHex = await eoaSigner.signMessage(message);
          return ethers.utils.arrayify(sigHex);
        }
      }, {
        env: 'dev' // 切换到开发环境
      });
      
      setAccount(address);
      setXmtpClient(client);
      localStorage.setItem('dchat_account', JSON.stringify(address));
      localStorage.setItem('dchat_login_time', Date.now().toString());
      localStorage.setItem('dchat_xmtp_client_initialized', 'true');
      console.log("1111",111111);

    //获取账户的nft等级
    // 从配置中读取红包合约地址
      const contractAddress = process.env.REACT_APP_NFT_CONTRACT_ADDRESS;
      console.log('合约地址:', contractAddress);

      //创建nft实例
     const nftContract = new ethers.Contract(
        process.env.REACT_APP_NFT_CONTRACT_ADDRESS,
        NFT_ABI,
        provider
      );
      console.log('钱包地址',address);
      console.log('provider',provider);
      const { tokenId, tier, uri } = await nftContract.getFirstTokenOfOwner(address);
      setNftInfo({ tier, tokenId, uri });
      localStorage.setItem('nftTier', tier);
      console.log("NFT等级:", tier);

      // 导航到聊天页面
      navigate('/chat', { state: { tier } });
    } catch (e) {
      console.error(e);
      setErr(e?.message || '连接失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 创建登录面板
  const loginPanel = (
    <motion.div
      className="login-wrapper"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.6 }}
    >
      <motion.div
        className="login-card"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.7, duration: 0.5, ease: "easeOut" }}
        whileHover={{ scale: 1.02 }}
      >
        <motion.h1
          className="login-title"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
        >
          DeChat        </motion.h1>
        
        <motion.p
          className="login-description"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.4 }}
        >
          链上沟通，以价值相连
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.4 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
           
          <button onClick={connect} disabled={loading} className="primary-btn" style={{ fontSize: '25px' }}>
            {loading ? '连接中...' : '🚀 连接MetaMask钱包登陆'}
          </button>
        </motion.div>
        
        {err ? (
          <motion.p
            className="error-text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.3 }}
          >
            {err}
          </motion.p>
        ) : null}
        
        <motion.p
          className="login-footer"
            style={{ 
           position: 'absolute', 
            top: '300px', // 距离父容器顶部 100px，数值越大越靠下
          //  left: '0' // 可选，固定水平位置
           }} 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.4 }}
        >
        </motion.p>
      </motion.div>
    </motion.div>
  );

  return (
    <MainContent loginPanel={loginPanel} />
  );
}