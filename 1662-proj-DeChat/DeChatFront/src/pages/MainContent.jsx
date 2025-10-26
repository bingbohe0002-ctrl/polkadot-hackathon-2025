// src/components/MainContent.jsx
import React from 'react';
import UserCard from './UserCard';
import './MainContent.css';

const MainContent = ({ loginPanel }) => {
  const userCardsData = [
    {
      user: 'NFT 门禁 · 身份即通行',
      action: '通过 NFT 验证实现入群权限控制，打造专属的 Web3 社群。每个群都是基于资产和身份的私密空间。',
      //reward: '5 DOT',
    },
    {
      user: '去中心化群聊 · 安全可信',
      action: '基于 XMTP V3 协议构建,无中心服务器。消息端到端加密,确保隐私与数据安全。',
      //reward: '2 DOT',
    },
    {
      user: '链上红包 · 实时到账',
      action: '用户可直接发送和领取链上红包,资金即发即到。红包与 NFT 等级挂钩,解锁不同层级奖励。',
      //reward: '10 DOT',
    },
    {
      user: '社群激励 · 互动共识',
      action: '将 NFT、身份与奖励机制结合,激励用户参与社群。提升社区活跃度,形成真正的 Web3 社交生态。',
      //reward: '5 DOT',
    },
  ];

  return (
    <main className="main-content">
      <div className="user-cards-layout">
        {/* 左上角卡片 - Ron */}
        <div className="user-card-top-left">
          <UserCard
            user={userCardsData[0].user}
            action={userCardsData[0].action}
            //reward={userCardsData[0].reward}
            delay={0.2}
          />
        </div>
        
        {/* 右上角卡片 - Emily */}
        <div className="user-card-top-right">
          <UserCard
            user={userCardsData[1].user}
            action={userCardsData[1].action}
          //  reward={userCardsData[1].reward}
            delay={0.4}
          />
        </div>
        
        {/* 中间区域 - 显示登录面板 */}
        <div className="login-panel-space">
          {loginPanel}
        </div>
        
        {/* 左下角卡片 - n8dawg */}
        <div className="user-card-bottom-left">
          <UserCard
            user={userCardsData[2].user}
            action={userCardsData[2].action}
            //reward={userCardsData[2].reward}
            delay={0.6}
          />
        </div>
        
        {/* 右下角卡片 - FluffySaurus */}
        <div className="user-card-bottom-right">
          <UserCard
            user={userCardsData[3].user}
            action={userCardsData[3].action}
            //reward={userCardsData[3].reward}
            delay={0.8}
          />
        </div>
      </div>
    </main>
  );
};

export default MainContent;