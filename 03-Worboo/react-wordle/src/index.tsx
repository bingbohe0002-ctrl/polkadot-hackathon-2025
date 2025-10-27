import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import reportWebVitals from './reportWebVitals'
import { AlertProvider } from './context/AlertContext'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Home from './Home'
import Verify from './Verify'

import '@rainbow-me/rainbowkit/styles.css'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { WagmiConfig } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config, chains } from './lib/wagmi'

const queryClient = new QueryClient()

ReactDOM.render(
  <React.StrictMode>
    <WagmiConfig client={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider chains={chains} theme={darkTheme()} modalSize="compact">
          <AlertProvider>
            <Router>
              <Routes>
                <Route path="/verify/:ipfsHash" element={<Verify />} />
                <Route path="/" element={<Home />} />
              </Routes>
            </Router>
          </AlertProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiConfig>
  </React.StrictMode>,
  document.getElementById('root')
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
