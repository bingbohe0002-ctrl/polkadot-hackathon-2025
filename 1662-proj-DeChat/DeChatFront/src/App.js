import './App.css';
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Chat from './pages/Chat';
import JoinGroup from './pages/JoinGroup';
//import Header from './pages/Header';



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
  const [tier, setTier] = useState(null); // 提升 tier 状态

  return (
    <div className="App">
      
      <Routes>
        {/*<Route path="/header" element={<Header />} />*/}
        <Route
          path="/"
          element={
            <Login
              setAccount={setAccount}
              setXmtpClient={setXmtpClient}
              setTier={setTier} // 将 setTier 传递给 Login
            />
          }
        />
        <Route
          path="/chat"
          element={
            account ? (
              <Chat
                account={account}
                xmtpClient={xmtpClient}
                setXmtpClient={setXmtpClient}
                tier={tier} // 将 tier 传递给 Chat
              />
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
