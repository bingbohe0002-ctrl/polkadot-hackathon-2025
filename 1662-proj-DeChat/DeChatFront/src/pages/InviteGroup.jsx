import React, { useState } from 'react';
import { Modal, Input, Button, message } from 'antd';
import { UsergroupAddOutlined, CopyOutlined } from '@ant-design/icons';

const InviteGroup = ({ selectedGroupId,selectedConversation, account }) => {
 // console.log(selectedGroupId,'selectedGroupId0------------')
 // console.log(selectedConversation,'selectedConversation------------')
  const [inviteLink, setInviteLink] = useState('');
  const [inviteModalVisible, setInviteModalVisible] = useState(false);

  // 订阅主题函数（避免 no-undef/no-unused-vars）
  /*const subscribeToTopics = async (topics, isSilent) => {
    if (!Array.isArray(topics)) return;
    console.log('Subscribing topics:', topics.length, 'silent:', isSilent);
    // 实际订阅逻辑可根据 XMTP SDK 实现
  };
*/
  const handleGenerateInviteLink = async () => {
    if (!selectedConversation.name) {
      message.error('请先选择一个群组会话');
      return;
    }

    try {
          const inviteUrl = `http://localhost:3000/join?group=${selectedConversation.id}&inviterid=${account}`;
          setInviteLink(inviteUrl);
         setInviteModalVisible(true);
       
    } catch (error) {
      console.error('生成邀请链接错误:', error);
      message.error('生成链接失败');
    }
  };

  return (
    <>
      <Button
        icon={<UsergroupAddOutlined />}
        size="small"
        shape="circle"
        onClick={handleGenerateInviteLink}
        style={{ color: '#1890ff', marginRight: '8px' }}
        title={selectedConversation.name ? '邀请入群' : '请先选择一个群组会话'}
        disabled={!selectedConversation.name}
      />
      <Modal
        title="群邀请链接"
        visible={inviteModalVisible}
        onCancel={() => setInviteModalVisible(false)}
        footer={null}
      >
        <Input
          value={inviteLink}
          readOnly
          addonAfter={
            <Button
              icon={<CopyOutlined />}
              onClick={() => {
                navigator.clipboard.writeText(inviteLink);
                message.success('链接已复制');
              }}
            >
              复制
            </Button>
          }
        />
        <p>分享此链接邀请他人加入群组。新成员加入时，您将收到 silent push 通知。</p>
      </Modal>
    </>
  );
};

export default InviteGroup;