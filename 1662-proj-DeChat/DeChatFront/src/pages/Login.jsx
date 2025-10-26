import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { motion } from 'framer-motion';
import Header from './Header';
import MainContent from './MainContent';
import './Login.css';
import { Client } from '@xmtp/browser-sdk';



export default function Login({ setAccount, setXmtpClient }) {
  const [nftInfo, setNftInfo] = useState(null); // 存储 NFT 信息

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
const RPC_URL = process.env.REACT_APP_RPC_URL;    
const nftprovider = new ethers.providers.JsonRpcProvider(RPC_URL);
 const contractAddress = process.env.REACT_APP_NFT_CONTRACT_ADDRESS;

    /*    // 合约 ABI
const ABI = [
  "function getNFTLevel(uint256 tokenId) view returns (uint256)", // 新增等级查询方法
  "function balanceOf(address owner) view returns (uint256)", // 已有（用于获取NFT数量）
  "function getFirstTokenOfOwner(address owner) external view returns (uint256 tokenId,Tier tier,string memory uri)", // 已有（用于获取tokenId）
  "function claim(uint256 packetId, uint256 tokenId) external",
  "event PacketClaimed(uint256 indexed packetId, address indexed claimer, uint256 amount)"
];
    const contract = new ethers.Contract(contractAddress, ABI, nftprovider);
    const nftInfo =  await contract.getFirstTokenOfOwner(address);
    console.log(`目标地址 ${contractAddress} 的 NFT 信息: ${nftInfo}`);
    const tokenId = nftInfo.tokenId.toNumber();
    const tier = nftInfo.tier;
    const uri = nftInfo.uri;
    console.log(`目标地址 ${contractAddress} 的 NFT tokenId: ${tokenId}`);
    console.log(`目标地址 ${contractAddress} 的 NFT tier: ${tier}`);
    console.log(`目标地址 ${contractAddress} 的 NFT uri: ${uri}`);
     // 如果需要，将 nftInfo 保存到状态
     setNftInfo(nftInfo); */
      // 导航到聊天页面
      navigate('/chat');
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
          连接到 Paseo PassetHub，开始去中心化聊天
        </motion.p>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="login-page-container">
      {/* Header 组件 */}
      <Header />
      
      {/* MainContent 组件，传递登录面板 */}
      <MainContent loginPanel={loginPanel} />
    </div>
  );
}