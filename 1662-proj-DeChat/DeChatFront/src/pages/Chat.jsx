import React, { useEffect, useState } from 'react';
import './Chat.css';
import { ethers } from 'ethers';
import {
  Modal, Form, Input, Button, message as AntMessage,
  Layout, Space, Typography, Card, 
  Dropdown, Menu, Avatar, Badge, List,Select
} from 'antd';

import { Client } from '@xmtp/browser-sdk';
import InviteGroup from './InviteGroup';
import {
  MessageOutlined, MoreOutlined,
  SendOutlined,
  SearchOutlined, GiftOutlined
} from '@ant-design/icons';
import { createRedPacket } from './RedPackageCreat';// 创建红包
import { claimRedPacket } from './ClaimRedPacket'; // 添加领红包

const { Option } = Select;
const { Header, Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

function Chat({ account, xmtpClient, setXmtpClient }) {
  console.log('Chat组件渲染 - xmtpClient:', xmtpClient ? '已连接' : '未连接');
  console.log('account:', account);
  const [modalVisible, setModalVisible] = useState(false);
  // 状态：是否正在创建群组
const [isCreatingGroup, setIsCreatingGroup] = useState(false);
//状态：是否正在发红包
const [isSendingRedPacket, setIsSendingRedPacket] = useState(false);
//状态：是否正确领红包
const [claimingPacketId, setClaimingPacketId] = useState(null);
  const [redPacketModalVisible, setRedPacketModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [redPacketForm] = Form.useForm();
// 函数：缩写地址
  const shortenAddress = (account) => {
    if (!account) return '';
    return `${account.slice(0, 6)}...${account.slice(-4)}`;
  };
   const tier = localStorage.getItem('nftTier'); // 从 localStorage 中读取 tier
   console.log("从 localStorage 中读取的 NFT 等级:", tier);
  // XMTP聊天相关状态
 const [conversations, setConversations] = useState([
    {
      id: 'initial-topic-1', // 补充初始ID（模拟topic）
    name: 'initName',
    members: 2,
    lastMessage: '123',
    description: '456',
    time: new Date().toLocaleTimeString(), // 确保time有值
    unread: 1
    }
  ]); 
  const [messages, setMessages] = useState([
    {
      id: '1',   
      content: '123',
      sender: '0x1787...4561',
      time: '2025/09/29 10:31:14',
      type: 'text'
    },
    {
      id: '2',
      content: '123',
      sender: '0x1787...4561',
      time: '2025/09/29 10:31:21',
      type: 'text'
    }
  ]);
  const [selectedConversation, setSelectedConversation] = useState({});
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  

  // 初始化 XMTP 客户端（如果未初始化）
  useEffect(() => {
    const initializeXmtpClient = async () => {
      if (xmtpClient) {
        console.log('XMTP 客户端已存在，无需重新初始化');
        return;
      }

      if (!account) {
        console.log('账户未登录，无法初始化 XMTP');
        return;
      }

      if (!window.ethereum) {
        console.log('MetaMask 未安装');
        AntMessage.error('请安装 MetaMask 浏览器扩展');
        return;
      }

      try {
        console.log('开始初始化 XMTP 客户端...');

        // 创建以太坊提供者
        //创建一个以太坊提供者（Provider），用于连接区块链网络。它充当应用与以太坊之间的桥梁，能查询数据（如余额、交易）或发送请求。
        //window.ethereum 是 MetaMask 注入的全局对象，提供 RPC 接口，让浏览器应用与以太坊交互。
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        const client = await Client.create({
        type: 'EOA',
        getIdentifier: () => ({ identifier: address, identifierKind: 'Ethereum' }),
        signMessage: async (message) => { const sigHex = await signer.signMessage(message); return ethers.utils.arrayify(sigHex); }
      }, { env: 'dev' });

        console.log('XMTP 客户端初始化成功', client);
        setXmtpClient(client);

        // 保存到 localStorage（注意：client 对象可能无法直接序列化）
        localStorage.setItem('dchat_xmtp_client_initialized', 'true');
      console.log("1111",111111);    
      } catch (error) {
        console.error('初始化 XMTP 客户端失败:', error);
        console.error('错误详情:', error.message);
        AntMessage.error(`初始化 XMTP 失败: ${error.message}`);
      }

    }
   initializeXmtpClient();
  }, [account, xmtpClient, setXmtpClient]);
   const getXmtpClient = async () => {
    if (xmtpClient) {
      return xmtpClient;
    }
    // 如果未初始化，等待 useEffect 中的初始化逻辑完成
    // 可以添加等待机制，例如使用 Promise 或状态检查
    await new Promise(resolve => setTimeout(resolve, 1000)); // 示例等待，实际可优化
    if (!xmtpClient) {
      throw new Error('XMTP client 未初始化');
    }
    return xmtpClient;
  };


  // 加载 XMTP 会话
  useEffect(() => {
    if (!xmtpClient) return;

    const loadXMTPConversations = async () => {
      try {
        console.log('开始加载 XMTP 会话...');
        const allConversations = await xmtpClient.conversations.list();
        console.log('找到会话数量:', allConversations.length);

        const formattedConversations = await Promise.all(
          allConversations.map(async (conv) => {
            const members = await conv.members();
            return {
              id: conv.id,                     // 唯一标识
              name: conv.name || 'Unknown Group',
              description: conv.description || 'No Description',
              members: members.length,
              isGroup: members.length > 0,
              xmtpConversation: conv,             // 真实 XMTP 对象（内存使用）
              lastMessage: '点击查看消息',
              createdAt: conv.createdAt,       // 添加创建时间
              time: conv.createdAt.toLocaleTimeString(),
            };
          })
        );

        // 按创建时间倒序排序（最新创建的先）
        formattedConversations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        // 正确：数组 map，并读取格式化后对象的 {id,name}
        console.log('加载的XMTP会话(含id):', formattedConversations.map(c => ({ id: c.id, name: c.name })));

        setConversations(formattedConversations);

        if (formattedConversations.length > 0 && !selectedConversation) {
          setSelectedConversation(formattedConversations[0]);
          console.log('自动选择第一个会话:', formattedConversations[0].name);
        }

        // 可选：持久化基础元数据（不包含 xmtpConversation）
        const serializable = formattedConversations.map(({ xmtpConversation, ...rest }) => rest);
        localStorage.setItem("dchat_xmtp_conversations", JSON.stringify(serializable));
      } catch (error) {
        console.error('加载会话失败:', error);
        AntMessage.error(`加载会话失败: ${error.message}`);
      }
    };

    loadXMTPConversations();
  }, [xmtpClient]);

  // 监听选定会话的消息
  useEffect(() => {
    if (!selectedConversation?.xmtpConversation) return;
// 先检查方法是否存在
  if (typeof selectedConversation.xmtpConversation.stream !== 'function') {
    console.error('xmtpConversation 不包含 stream 方法', selectedConversation.xmtpConversation);
    return;
    }
    const streamMessages = async () => {
      try {
        for await (const message of await selectedConversation.xmtpConversation.stream()) {
          // 处理新消息
          const newMessage = {
            id: message.id,
            content: message.content,
            sender: message.senderAddress,
            time: new Date(message.sent).toLocaleString('zh-CN'),
            type: 'text'
          };
          console.log('取到的新消息newMessage:', newMessage)
          setMessages(prev => [...prev, newMessage]);
        }
      } catch (error) {
        console.error('监听消息失败:', error.message, error.stack);
      }
    };

    streamMessages();
  }, [selectedConversation]);  // 添加依赖

  // 生成随机卡通头像
  const getCartoonAvatar = (username) => {
    const styles = ['adventurer', 'avataaars', 'big-ears', 'big-smile', 'bottts', 'croodles', 'fun-emoji', 'icons', 'identicon', 'initials', 'lorelei', 'micah', 'miniavs', 'open-peeps', 'personas', 'pixel-art', 'shapes', 'thumbs'];
    const selectedStyle = styles[Math.floor(Math.random() * styles.length)];
    const seed = username || Math.random().toString(36).substring(2, 15);
    return `https://api.dicebear.com/7.x/${selectedStyle}/svg?seed=${seed}`;
  };

  // 使用 useMemo 缓存头像 URL，避免每次渲染都重新生成
  const cachedAvatars = React.useMemo(() => {
    const avatars = {};
    // 为所有消息的发送者预先生成头像
    messages.forEach(message => {
      if (!avatars[message.sender]) {
        avatars[message.sender] = getCartoonAvatar(message.sender);
      }
    });
    return avatars;
  }, [messages]);  // 改为 [messages]

  // 用户登录时生成头像
  useEffect(() => {
    if (account) {
      const avatar = getCartoonAvatar(account);
      setUserAvatar(avatar);
    }
  }, [account]);

  // 处理发送消息 - 使用 XMTP 发送真实消息
  const handleSendMessage = async () => {
    console.log('尝试发送消息:', { inputValue, hasXmtpClient: !!xmtpClient, hasSelectedConversation: !!selectedConversation });

    if (!inputValue.trim()) {
      console.log('消息内容为空');
      return;
    }

    if (!xmtpClient) {
      console.log('XMTP 客户端未初始化');
      AntMessage.error('XMTP 客户端未初始化，请重新登录');
      return;
    }

    if (!selectedConversation) {
      console.log('未选择会话');
      AntMessage.error('请先选择一个会话');
      return;
    }

    if (!selectedConversation.xmtpConversation) {
      console.log('选中的会话没有 XMTP 会话对象');
      AntMessage.error('会话无效，请选择其他会话');
      return;
    }

    try {
      console.log('开始发送消息到 XMTP 网络');

      // 发送消息到 XMTP 网络（使用原始 XMTP 会话对象）
      await selectedConversation.xmtpConversation.send(inputValue);
      console.log('消息发送成功');

      // 更新本地消息列表（乐观更新）
      const newMessage = {
        id: Date.now().toString(),
        content: inputValue,
        sender: account,
        time: new Date().toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }).replace(',', ''),
        type: 'text'
      };

      setMessages([...messages, newMessage]);
      setInputValue('');

      AntMessage.success('消息发送成功！');

    } catch (error) {
      console.error('发送消息失败:', error);
      console.error('错误详情:', error.message, error.stack);
      AntMessage.error(`消息发送失败: ${error.message}`);
    }
  };
 const contractAddress = process.env.REACT_APP_NFT_CONTRACT_ADDRESS;
  if (!contractAddress) throw new Error('合约地址未配置，请检查 .env 文件');


  // 处理领取红包的函数（更新为动态获取 tokenId）
  const handleClaimRedPacket = async (packetId, packetType) => {
    setClaimingPacketId(packetId);
    try {
      if (!window.ethereum) {
        AntMessage.error('请安装 MetaMask');
        return;
      }
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const userAddress = await signer.getAddress(); // 获取当前账户地址
     // console.log(userAddress,'userAddress')
      console.log("当前账户地址:", userAddress);
      
      if (!tier) {
        AntMessage.error('无法获取 NFT tier');
        return;
      }
  
      const packetTypeString = packetType.toString();
      if (tier === '0' && packetTypeString !== '0') {
        AntMessage.error('您的 NFT 等级仅支持领取普通红包');
        return;
      } else if (tier === '1' && packetTypeString === '1') {
        AntMessage.error('您的 NFT 等级仅支持领取普通和高级红包');
        return;
      }

      // 调用 claimRedPacket
      const result = await claimRedPacket(signer, packetId, tier);
      AntMessage.success(`红包领取成功！金额: ${result.claimedAmount}`);

      // 更新本地消息状态（例如，标记为已领取）
      setMessages(prev => prev.map(msg => 
        msg.id === packetId ? { ...msg, redPacketData: { ...msg.redPacketData, status: 'claimed' } } : msg
      ));
    } catch (error) {
      console.error('领取红包失败:', error);
      AntMessage.error('领取红包失败: ' + error.message);
    } finally {
      setClaimingPacketId(null);
    }
  };

  // 处理发送红包
  const handleSendRedPacket = async () => {
    setIsSendingRedPacket(true);
    try {
      const values = await redPacketForm.validateFields();
      const { amount, quantity,  packetType } = values;
      
      // 检查 MetaMask 是否安装
      if (!window.ethereum) {
        AntMessage.error('请安装 MetaMask 浏览器扩展');
        return;
      }
      
      // 请求 MetaMask 连接账户
    await window.ethereum.request({ method: 'eth_requestAccounts' });

      // 获取当前网络链 ID（返回的是十六进制字符串，如 "0x1" 表示以太坊主网）
    const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
    console.log('链 ID(十六进制):', chainIdHex);

    // 正确转换：将十六进制字符串转为十进制数字（基数应为 16）
    const chainId = parseInt(chainIdHex, 16);
    console.log('链 ID(十进制):', chainId);

    // 初始化 Provider 时指定网络
    const provider = new ethers.providers.Web3Provider(window.ethereum, {
       name: 'Paseo PassetHub', 
        chainId: chainId, // 使用正确解析的链 ID
        ens: false, // 完全禁用 ENS 解析，解决不支持的操作错误
      });
    
      const signer = await provider.getSigner();
      // 从配置中读取红包合约地址
      const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS_RED;
      console.log(contractAddress,'contractAddress')
      if (!contractAddress) throw new Error('合约地址未配置，请检查 .env 文件');
      
      // 生成唯一ID（可选）
      const id = Date.now().toString();
      
      // 调用 createRedPacket（amount 作为 totalEther）
      const txResult = await createRedPacket(signer, contractAddress, packetType, quantity, amount);
      //--- 新增：查询余额逻辑 ---
    // 1. 获取钱包地址（通过 signer 获得）
    const walletAddress = await signer.getAddress();
    console.log('钱包地址:', walletAddress);

    // 2. 查询钱包的 PAS 余额（单位：wei，需格式化）
    const walletEthBalanceWei = await signer.provider.getBalance(walletAddress);
    const walletEthBalance = ethers.utils.formatEther(walletEthBalanceWei);
    console.log('钱包余额:', walletEthBalance, 'PAS');

    // 3. 查询合约的 PAS 余额
    const contractEthBalanceWei = await signer.provider.getBalance(contractAddress);
    const contractEthBalance = ethers.utils.formatEther(contractEthBalanceWei);
    console.log('合约余额:', contractEthBalance, 'PAS');
    // --- 余额查询结束 ---
      // 从结果中提取 packetId
      const packetId = txResult.packetId || id;
      console.log(packetId,'packetId')
      // 更新本地消息
      const redPacketMessage = {
        id: packetId,
        type: 'redpacket',
        sender: account,
        time: new Date().toLocaleString('zh-CN'),
        redPacketData: {
          amount: parseFloat(amount),
          quantity: parseInt(quantity),
          //content: content || '恭喜发财，大吉大利！',
          status: 'pending',
          packetType
        }
      };
      
      setMessages(prev => [...prev, redPacketMessage]);
      setRedPacketModalVisible(false);
      redPacketForm.resetFields();
      AntMessage.success('红包发送成功！交易哈希: ' + txResult.receipt.transactionHash);
    } catch (error) {
      console.error('发送红包失败:', error);
      AntMessage.error('红包发送失败: ' + error.message);
    }finally {
      setIsSendingRedPacket(false);
    }
  };

  // 处理按Enter发送消息
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // 处理选择会话
  const handleSelectConversation = async (conversation) => {
    setSelectedConversation(conversation);
console.log(conversation,'handleSelectConversation+conversation')
    // 仅当为群聊时设置 selectedGroupId，否则清空
    if (conversation.isGroup) {
        setSelectedGroupId(conversation.id);
    } else {
        setSelectedGroupId(conversation.id);
    }

    // 加载该会话的历史消息
    if (conversation.xmtpConversation) {
      console.log('conversation.xmtpConversation存在,开始加载消息')
        try {
            const messages = await conversation.xmtpConversation.messages();
            console.log('消息列表messages:', messages)
            const formattedMessages = messages.map(msg => {
              console.log('Raw senderAddress for msg:', msg); // 打印每个消息的原始 senderAddress
              return {
                id: msg.id,
                content: msg.content,
                sender: account,
                time: new Date(msg.sent).toLocaleString('zh-CN'),
                type: 'text'
              };
            });
            setMessages(formattedMessages);
            //打印sender
           // console.log('sender', formattedMessages.map(msg => msg.sender))
        } catch (error) {
            console.error('加载消息历史失败:',  error.message, error.stack, error.name);
        }
    }
  };

  // 会话列表项渲染
  const renderConversationItem = (item) => (
    <List.Item
      key={item.id}
      onClick={() => handleSelectConversation(item)}
      className={`conversation-list-item ${selectedConversation?.id === item.id ? 'conversation-list-item-selected' : ''}`}
    >
      <div>{console.log('会话item的id:', item.id, '会话名称:', item.name)}</div>
      <List.Item.Meta
        avatar={<Avatar icon={<MessageOutlined />} />}
        title={
          <Space direction="vertical" size="small">
            <Text strong className="conversation-meta-title">{item.name}</Text>
            <Text type="secondary" className="conversation-meta-members">
              {item.members} members
            </Text>
          </Space>
        }
        description={
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text ellipsis className="conversation-meta-lastmsg">{item.lastMessage}</Text>
            <Text ellipsis className="conversation-meta-lastmsg">{item.description}</Text>
            <Text type="secondary" className="conversation-meta-time">
              {item.lastTime}
            </Text>
          </Space>
        }
      />
      {item.unread > 0 && (
        <Badge count={item.unread} size="small" />
      )}
    </List.Item>
  );

  // 消息项渲染 - 微信风格（带头像）
  const renderMessageItem = (item) => {
  
    const normalizedSender = item.sender?.toLowerCase();
    const normalizedAccount = account?.toLowerCase();
  
    //判断历史消息是自己发的还是别人发的
    const isMine = normalizedSender === normalizedAccount;
    
    const messageClass = isMine ? 'message-item mine' : 'message-item theirs';
    const bubbleClass = isMine ? 'message-bubble mine' : 'message-bubble theirs';
    const senderAvatar = isMine ? userAvatar : cachedAvatars[item.sender];

    // 根据红包类型返回背景图片样式
    const getRedPacketBackground = (packetType) => {
      let imageUrl;
      switch (packetType) {
        case 0: // 普通红包
          imageUrl = '/20251025121709_782_28.jpg';
          break;
        case 1: // 高级红包
          imageUrl = '/20251025122449_784_28.jpg';
          break;
        case 2: // 超级红包
          imageUrl = '/20251025121126_780_28.jpg';
          break;
        default: // 默认：使用普通红包图片或自定义
          imageUrl = '/normal.png';
          break;
      }
      return {
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: 'white' // 保持文字颜色
      };
    };

    return (
      <div key={item.id} className={messageClass}>
        {/* 对方消息显示头像在左侧 */}
        {!isMine && (
          <div className={item.level === 1 ? 'level1' : 'level2'}>
            <Avatar
              src={senderAvatar}
              size={48}
              style={{ marginRight: '8px', alignSelf: 'flex-start' }}
            />
          </div>
        )}

        <div className="message-content-wrapper">
          <div className="message-header">
            {!isMine && <Text className="message-sender">{shortenAddress(item.sender)}</Text>}
            {isMine && <Text className="message-sender">{shortenAddress(account)}</Text>}
          </div>

          {item.type === 'redpacket' ? (
            <Card
              className={`${bubbleClass} red-packet-bubble`}
              style={{
                ...getRedPacketBackground(item.redPacketData.packetType),
                cursor: item.redPacketData.status === 'claimed' || claimingPacketId === item.id ? 'not-allowed' : 'pointer',
                width: '300px', // 放大宽度
                minHeight: '300px', // 放大最小高度，确保内容不挤压
              }}
              onClick={
                item.redPacketData.status !== 'claimed' && claimingPacketId !== item.id
                  ? () => handleClaimRedPacket(item.id, item.redPacketData.packetType)
                  : undefined
              }
            >
             <div style={{ textAlign: 'center', padding: '20px' }}>
                <Paragraph style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', margin: '0' }}>
                  
                </Paragraph>
              </div>
            </Card>
          ) : (
            <Card className={bubbleClass}>
              <Paragraph style={{ margin: 0 }}>{item.content}</Paragraph>
            </Card>
          )}
        </div>

        {/* 自己的消息显示头像在右侧 */}
        {isMine && (
          <Avatar
            src={senderAvatar}
            size="small"
            style={{ marginLeft: '8px', alignSelf: 'flex-start' }}
          />
        )}
      </div>
    );
  };

  // 会话列表菜单
  const conversationMenu = (
    <Menu>
      <Menu.Item key="1">New Conversation</Menu.Item>
      <Menu.Item key="2">Archive</Menu.Item>
      <Menu.Item key="3">Delete</Menu.Item>
    </Menu>
  );

  // 处理登出
  const handleLogout = () => {
    localStorage.removeItem('dchat_account');
    localStorage.removeItem('dchat_xmtp_client');
    // 清除所有 IndexedDB 数据库
    const clearIndexedDB = async () => {
      try {
        const databases = await window.indexedDB.databases();
        for (const db of databases) {
          if (db.name) {
            window.indexedDB.deleteDatabase(db.name);
          }
        }
        console.log('IndexedDB 数据库已清除');
      } catch (error) {
        console.warn('清除 IndexedDB 失败:', error);
      }
    };

    // 清除 localStorage 和 sessionStorage
    localStorage.clear();
    sessionStorage.clear();

    clearIndexedDB().then(() => {
      window.location.href = '/';
    });
  };
  // 创建乐观群聊
  const handleCreateGroup = async () => {
    //创建群聊开始
    setIsCreatingGroup(true);
    try {
      const values = await form.validateFields();
      if (!xmtpClient) {
        AntMessage.error('XMTP 客户端未初始化');
        return;
      }

      const options = {
        name: values.groupName,
        description: values.groupDesc,
        //optimistic: true,
      };
      const newGroup = await xmtpClient.conversations.newGroup([], options);

      // 获取成员数量并标记群类型
      const membersCount = (await newGroup.members()).length;

      const formattedConversation = {
        id: newGroup.id,                 // 使用 topic 作为唯一 ID
        name: values.groupName,
        description: values.groupDesc,
        xmtpConversation: newGroup,         // 仅在内存中保留，便于 send/stream
        lastMessage: 'Group created',
        createdAt: newGroup.createdAt || new Date(),  // 添加创建时间
        time: (newGroup.createdAt || new Date()).toLocaleTimeString(),
        members: membersCount,
        isGroup: membersCount > 0,
        unread: 0,
      };

      // 更新状态并持久化可序列化数据（不包含 xmtpConversation）
      setConversations(prev => {
        const next = [...prev, formattedConversation];
        // 按创建时间倒序排序（最新创建的先）
        next.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        // 序列化存储时保留原生id（topic）和 createdAt
        const toSerializable = ({ id, name, description, lastMessage, time, members, createdAt }) => ({
          id, name, description, lastMessage, time, members, createdAt: createdAt.toISOString()
        });
        localStorage.setItem("dchat_xmtp_conversations", JSON.stringify(next.map(toSerializable)));
        console.log('存储的会话(含id):', next.map(conv => ({ id: conv.id, name: conv.name })));
        return next;
      });

      setSelectedConversation(formattedConversation);
      setSelectedGroupId(formattedConversation.id);   // 同步设置选中群 ID，邀请功能可用
      console.log('选中的会话id:', formattedConversation.id); // 明确打印id
      //创建群聊完成
      setModalVisible(false);
      form.resetFields();
      AntMessage.success('群聊创建成功！');
    } catch (err) {
      AntMessage.error('群聊创建失败: ' + (err.message || err));
    } finally {
      setIsCreatingGroup(false);
    }
  };

  return (
    <Layout className="xmtp-chat-layout">
      {/* 主布局 */}
      <Layout>
        {/* 左侧会话列表 */}
        <Sider className="conversation-sider" collapsible={false}>
          <Header className="conversation-header">
            <Space className="conversation-header-content">
              <Button type="primary" onClick={() => setModalVisible(true)} size="small">
                创建群聊
              </Button>
              <span style={{ marginLeft: '40px',fontSize: '20px' }}>
                {tier === '0' && '🥉'}
                {tier === '1' && '🥈'}
                {tier === '2' && '🏅'}
              </span>
              <Dropdown overlay={conversationMenu}>
                <Button icon={<MoreOutlined />} type="text" size="small" />
              </Dropdown>
            </Space>
          </Header>

          <div className="conversation-search">
            <Input
              placeholder="Search conversations"
              prefix={<SearchOutlined />}
              size="small"
            />
          </div>

          <Content className="conversation-list-container">
            {console.log(conversations, '2222')}
            <List
              dataSource={conversations}
              renderItem={renderConversationItem}
              bordered
            />
          </Content>


        </Sider>

        {/* 右侧聊天区域 */}
        <Layout className="chat-area">
            {/* 聊天区域头部 */}
            <Header className="chat-header">
                <Space className="chat-header-content">
                    <div>
                        <Title level={5} className="chat-title">
                            {selectedConversation?.name || '选择会话'}
                        </Title>
                    </div>
               
                    <Button onClick={handleLogout}>退出登录</Button>
                </Space>
            </Header>
            {/* 聊天消息区域 */}
            <Content className="chat-messages-container">
                <div className="chat-messages-content">
                    {messages.map(renderMessageItem)}
                </div>
            </Content>

            {/* 消息输入区域 */}
            <div className="message-input-area">
                <div className="message-input-content">
                    <InviteGroup selectedConversation={selectedConversation} getXmtpClient={getXmtpClient} account={account} />
                    <Button
                        icon={<GiftOutlined />}
                        size="small"
                        shape="circle"
                        onClick={() => setRedPacketModalVisible(true)}
                        style={{ color: '#ff6b6b', marginRight: '8px' }}
                        title="发红包"
                        visible={redPacketModalVisible}
                        onCancel={() => setRedPacketModalVisible(false)}
                        onOk={handleSendRedPacket}
                        okText="发送红包"
                        cancelText="取消"
                        width={400}
                       okButtonProps={{ loading: isSendingRedPacket }}
                    />
                    <Input
                        placeholder="Type a message..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        style={{ flex: 1 }}
                    />
                    <Button
                        icon={<SendOutlined />}
                        type="primary"
                        onClick={handleSendMessage}
                    >
                        Send
                    </Button>
                </div>
            </div>
        </Layout>
      </Layout>

      
      <Modal
        title="创建群聊"
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleCreateGroup}
        okText="确定"
        cancelText="取消"
        okButtonProps={{ loading: isCreatingGroup }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="群名称"
            name="groupName"
            rules={[{ required: true, message: '请输入群名称' }]}
          >
            <Input placeholder="请输入群名称" />
          </Form.Item>
          <Form.Item
            label="群描述"
            name="groupDesc"
            rules={[{ required: true, message: '请输入群描述' }]}
          >
            <Input placeholder="请输入群描述" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 发红包弹窗 */}
      <Modal
        title="发红包"
        visible={redPacketModalVisible}
        onCancel={() => setRedPacketModalVisible(false)}
        onOk={handleSendRedPacket}
        okText="发送红包"
        cancelText="取消"
        width={400}
        okButtonProps={{ loading: isSendingRedPacket }}
      >
        <Form form={redPacketForm} layout="vertical">
          <Form.Item
            label="红包金额"
            name="amount"
            rules={[
              { required: true, message: '请输入红包金额' },
              { pattern: /^\d+(\.\d{1,2})?$/, message: '请输入正确的金额格式' },
              { min: 0.01, message: '金额不能小于0.01元' }
            ]}
          >
            <Input
              placeholder="请输入金额"
              prefix="PAS"
              type="number"
              step="0.01"
              min="0.01"
            />
          </Form.Item>
          <Form.Item
            label="红包数量"
            name="quantity"
            rules={[
              { required: true, message: '请输入红包数量' },
              { pattern: /^\d+$/, message: '请输入整数' },
              { min: 1, message: '数量不能小于1' }
            ]}
          >
            <Input
              placeholder="请输入数量"
              suffix="个"
              type="number"
              min="1"
            />
          </Form.Item>
          <Form.Item
            label="红包类型"
            name="packetType"
            rules={[{ required: true, message: '请选择红包类型' }]}
          >
            <Select placeholder="请选择红包类型">
              <Option value={0}>Normal (普通)</Option>
              <Option value={1}>Advanced (高级)</Option>
              <Option value={2}>Super (超级)</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}

export default Chat;