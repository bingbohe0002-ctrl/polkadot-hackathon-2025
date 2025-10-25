import './App.css';
import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Chat from './pages/Chat';
import Header from './pages/Header';
import MainContent from './pages/MainContent';
import JoinGroup from './pages/JoinGroup';




function App() {
  // 从 localStorage 恢复登录状态
  const [account, setAccount] = useState(() => {
    const savedAccount = localStorage.getItem('dchat_account');
    return savedAccount ? JSON.parse(savedAccount) : null;
  });
  const [xmtpClient, setXmtpClient] = useState(() => {
    const savedClient = localStorage.getItem('dchat_xmtp_client');
    console.log('savedClient:', savedClient);
    return savedClient ? JSON.parse(savedClient) : null;
  });

  return (
    <div className="App">
      <Routes>
        <Route
          path="/"
          element={<Login setAccount={setAccount} setXmtpClient={setXmtpClient} />}
        />
        <Route
          path="/home"
          element={
            <>
              <Header />
              <MainContent />
            </>
          }
        />
        <Route
          path="/chat"
          element={
            account ? (
              <Chat account={account} xmtpClient={xmtpClient} setXmtpClient={setXmtpClient} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route path="/join" element={<JoinGroup />} />
        </Routes>
    </div>
  );
}

export default App;
