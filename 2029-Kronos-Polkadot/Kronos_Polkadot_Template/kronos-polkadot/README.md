# Project Kronos Prediction DApp

## Polkadot Hackathon 2025 Submission

A decentralized cryptocurrency price prediction DApp built on Polkadot ecosystem, integrating advanced Kronos AI prediction model for accurate market forecasting. This project demonstrates the integration of AI/ML models with Polkadot's blockchain infrastructure to create transparent, verifiable, and user-friendly prediction services.

## 📋 Mandatory Parts - Project Information

### 1. Introduction

#### Project Name
**Kronos Prediction DApp**

A decentralized cryptocurrency price prediction application built on Polkadot ecosystem, integrating advanced Kronos AI prediction model for accurate market forecasting.

#### Project Creation Date
**January 2025**

Created specifically for the **Polkadot Hackathon 2025**.

#### Project Background

**GitHub Repository**: https://github.com/NeoQuasar/kronos-polkadot-dapp

**Previous Recognition**:
- Built upon the Kronos financial AI foundation model (https://github.com/shiyu-coder/Kronos)
- Kronos project has received significant attention in the financial AI community
- Integration of cutting-edge Transformer architecture for time-series prediction

**The Problem We're Solving**:

1. **Centralized Prediction Platforms Lack Transparency**: Traditional prediction platforms are opaque, users have no way to verify prediction accuracy or reward fairness
2. **High Barrier to Entry for AI-Powered Trading**: Sophisticated AI prediction models are typically inaccessible to ordinary users
3. **No Decentralized Price Prediction Infrastructure**: There's a lack of on-chain prediction services in the Polkadot ecosystem
4. **Data Quality and Trust Issues**: Users need verifiable, tamper-proof prediction records and automated reward distribution

Our solution combines:
- **Decentralization**: On-chain storage of all predictions and results on Polkadot Westend
- **AI-Powered**: Integration of Kronos model for accurate price forecasting
- **Transparency**: All prediction history and rewards are publicly verifiable on-chain
- **Accessibility**: User-friendly interface making AI predictions available to everyone

---

### 2. Features Planned for Hackathon

#### Status Before Hackathon

**Starting Point**: 
- Basic Kronos AI model implementation
- Initial Polkadot.js integration research
- Basic smart contract structure design

**Pre-existing Components**:
- Kronos AI prediction model (Python-based)
- Binance API integration for historical price data
- Basic React frontend skeleton

#### Features Implemented During Hackathon

**✅ Completed Core Features**:

1. **Smart Contract Development (Ink!)** ✅
   - Prediction submission and storage
   - Result verification mechanism
   - Automatic reward calculation and distribution
   - Multi-asset support (BTC, ETH, DOT, etc.)

2. **AI Prediction Service** ✅
   - Integration of Kronos model with daily/hourly prediction capabilities
   - Historical data aggregation from Binance
   - Trade volume predictions alongside price predictions
   - Confidence scoring system

3. **Frontend DApp** ✅
   - Polkadot.js wallet integration
   - Real-time price charts with historical and predicted data
   - Interactive prediction submission interface
   - Transaction status tracking

4. **Backend API Service** ✅
   - RESTful API for prediction requests
   - Historical data caching
   - WebSocket support for real-time updates
   - Cross-origin resource sharing (CORS)

5. **Data Visualization** ✅
   - Price trend charts (historical vs predicted)
   - Volume analysis charts
   - X-axis alignment between price and volume charts
   - Dynamic Y-axis scaling for optimal visibility

6. **Deployment & Automation** ✅
   - Docker containerization for all services
   - One-click deployment script (`启动Docker并运行.ps1`)
   - Docker Compose orchestration
   - Frontend build optimization

---

### 3. Architecture

#### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                       │
│  ┌──────────────────┐  ┌──────────────────┐                  │
│  │ Wallet Connect   │  │ Prediction Panel │                  │
│  │ (Polkadot.js)    │  │ (Charts & Forms) │                  │
│  └────────┬─────────┘  └────────┬─────────┘                  │
│           │                     │                             │
└───────────┼─────────────────────┼─────────────────────────────┘
            │                     │
            │ HTTP/REST           │ WebSocket
            ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend API (Node.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Route Handler│→ │ Predict API  │→ │ Python Flask │       │
│  │              │  │              │  │ Service      │       │
│  └──────────────┘  └──────────────┘  └──────┬───────┘       │
│                                              │               │
│              ┌──────────────────────────────┘               │
│              │                                                │
│              ▼                                                │
│  ┌────────────────────────────────────────────────┐         │
│  │         Kronos AI Model (Python)                │         │
│  │  • Tokenizer: NeoQuasar/Kronos-Tokenizer-base  │         │
│  │  • Model: NeoQuasar/Kronos-small (24.7M params)│         │
│  │  • Prediction Engine                           │         │
│  └────────────────────────────────────────────────┘         │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   External Data Sources                       │
│  ┌──────────────┐              ┌──────────────┐             │
│  │  Binance API │              │ CoinGecko API│             │
│  │  (Historical)│              │  (Price Data)│             │
│  └──────────────┘              └──────────────┘             │
└─────────────────────────────────────────────────────────────┘
                         │
                         │ Web3 RPC
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Polkadot Westend Testnet                        │
│  ┌─────────────────────────────────────────────────┐        │
│  │      Ink! Smart Contract: kronos_prediction     │        │
│  │  ┌──────────────┐  ┌──────────────┐            │        │
│  │  │ Predictions  │  │    Results   │            │        │
│  │  │   Storage    │  │  Verification│            │        │
│  │  └──────────────┘  └──────────────┘            │        │
│  │  ┌──────────────────────────────────────┐     │        │
│  │  │      Reward Distribution             │     │        │
│  │  └──────────────────────────────────────┘     │        │
│  └─────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

#### Component Description

**Frontend Layer**:
- **Technology**: React 18 + TypeScript + Vite
- **UI Framework**: Material-UI (MUI)
- **Charts**: Recharts for data visualization
- **Web3 Integration**: @polkadot/extension-dapp
- **Key Components**:
  - `WalletConnect.tsx`: Manages Polkadot wallet connection
  - `PredictionPanel.tsx`: Main prediction interface with charts
  - `backend.ts`: API client for backend communication

**Backend Layer**:
- **Technology**: Node.js + Express
- **Features**:
  - RESTful API endpoints
  - Historical data fetching and caching
  - Integration with Python prediction service
- **Endpoints**:
  - `GET /api/predict`: Get AI predictions for a symbol
  - `GET /api/history`: Get historical price data

**AI Service Layer**:
- **Technology**: Python + Flask
- **Model**: Kronos Transformer-based prediction model
- **Capabilities**:
  - Price prediction (daily/hourly)
  - Volume prediction
  - Confidence scoring
  - Trend analysis

**Blockchain Layer**:
- **Technology**: Ink! (Rust-based smart contract)
- **Chain**: Polkadot Westend Testnet
- **Contract Functions**:
  - `submit_prediction`: Store user predictions on-chain
  - `update_result`: Store actual results for verification
  - `reward`: Distribute rewards based on accuracy
  - `get_prediction`: Query prediction history

**Deployment**:
- **Docker**: All services containerized
- **Docker Compose**: Orchestration of frontend, backend, and AI services
- **Nginx**: Static file serving for frontend
- **Ports**: 
  - Frontend: 3000
  - Backend: 5000
  - Python Service: 5001

---

### 4. Schedule

#### Development Timeline

**Week 1: Setup & Smart Contract Development**
- [x] Project initialization
- [x] Smart contract design and implementation
- [x] Basic Ink! contract testing on Westend

**Week 2: Backend & AI Integration**
- [x] Backend API development
- [x] Python prediction service setup
- [x] Kronos model integration
- [x] Binance API integration

**Week 3: Frontend Development**
- [x] React app setup
- [x] Polkadot.js wallet integration
- [x] Chart visualization implementation
- [x] Prediction submission UI

**Week 4: Integration & Testing**
- [x] End-to-end testing
- [x] Frontend-backend integration
- [x] Smart contract interaction testing
- [x] Bug fixes and optimization

**Final Days: Polish & Deployment**
- [x] Chart visualization optimization
- [x] Y-axis scaling improvements
- [x] Docker deployment setup
- [x] Documentation completion

#### Milestones

**Milestone 1: First Submit** ✅
- Date: Week 2
- Deliverables:
  - Working smart contract
  - Basic API service
  - Initial AI prediction integration

**Milestone 2: Pre-Demo** ✅
- Date: Week 4
- Deliverables:
  - Complete frontend implementation
  - Full integration testing
  - Basic documentation

**Milestone 3: Testnet Deployment** ✅
- Date: Final Week
- Deliverables:
  - Live deployment on Westend
  - Docker containerization
  - User documentation

#### Completed Deliverables

✅ **Features**:
- Multi-asset prediction support
- Real-time chart visualization
- On-chain prediction storage
- Automated reward calculation
- Volume prediction alongside price

✅ **Tests**:
- Smart contract unit tests
- Backend API tests
- Integration tests
- End-to-end user flow tests

✅ **Documentation**:
- README.md with setup instructions
- API documentation
- Smart contract interface documentation
- Deployment guide

✅ **Production Ready**:
- Docker containerization
- One-click deployment script
- Optimized for performance
- Error handling and logging

---

### 5. Team Info

#### Team Members

**Team Name**: NeoQuasar

**Bruce: **
- **Role**: Full-stack Developer & Project Lead
- **Background**: 
  - X years of experience in blockchain development
  - Previous work on DeFi applications
  - Expertise in Rust, React, and Python
- **Responsibilities**: 
  - Smart contract development
  - Frontend development
  - System architecture design
- **Contact**:
  - **Email**: [your.email@example.com]
  - **GitHub**: [github.com/yourusername]
  - **Telegram**: @yourusername

**Arthur:**
- **Role**: AI/ML Engineer
- **Background**: 
  - 2 years in machine learning
  - Specialization in time-series prediction
- **Responsibilities**: 
  - Kronos model integration
  - Prediction algorithm optimization
- **Contact**:
  - **Email**: [team.member@example.com]
  - **GitHub**: [github.com/teammember]

**耳东、公治:**
- **Role**: DevOps Engineer
- **Responsibilities**:
  - Docker orchestration
  - Deployment automation
  - Infrastructure setup

---

### 6. Track and Bounty

#### Selected Track
**Infrastructure Track**

We chose the Infrastructure track because our project provides essential prediction infrastructure for the Polkadot ecosystem. Our DApp demonstrates how advanced AI models can be integrated with Polkadot's unique multi-chain architecture to create valuable on-chain services.

**Why Infrastructure?**:
- Provides a **decentralized prediction oracle** for the ecosystem
- Demonstrates **Ink! smart contract capabilities** for complex logic
- Shows **off-chain computing integration** (AI models) with on-chain verification
- Creates a **reusable template** for other prediction-based DApps
- Enables **cross-chain compatibility** through Polkadot's architecture

#### Bounty Targets

**Primary Bounty**: [If applicable - e.g., "Best Infrastructure DApp"]
- Our project qualifies as it provides essential prediction infrastructure

**Secondary Objectives**:
- Showcase Ink! smart contract capabilities
- Demonstrate AI/ML integration with Polkadot
- Provide working example of off-chain computing with on-chain verification

---

### 7. Demo Materials

#### Demo Video
**[Link to YouTube Video](https://youtube.com/watch?v=YOUR_VIDEO_ID)**

**Video Content**:
- Project overview and problem statement
- Live demonstration of the DApp
- Smart contract interaction walkthrough
- AI prediction showcase
- Technical architecture explanation

#### Presentation Slides
**[Link to Google Drive/Google Docs](https://docs.google.com/presentation/d/YOUR_PRESENTATION_ID)**


---

## Optional Parts

### Tokenomics Design
- **Native Token**: KRON (if launched)
- **Use Cases**: 
  - Prediction submission fees
  - Reward distribution
  - Governance voting
- **Distribution**: 
  - 40% Users (rewards for accurate predictions)
  - 30% Team (vested over 3 years)
  - 20% Ecosystem development
  - 10% Liquidity pool

### Marketing Plan
- **Community Building**: 
  - Active Twitter/X presence
  - Discord community engagement
  - Technical blog posts
- **Partnerships**: 
  - Integration with Polkadot ecosystem projects
  - Collaboration with DeFi platforms
- **Content Marketing**:
  - Educational content on prediction markets
  - Technical tutorials and guides

### VC/Investment
- **Current Status**: Bootstrapped for hackathon
- **Future Plans**: Seeking seed funding for mainnet launch
- **Investment Priorities**:
  - Security audits
  - Mainnet deployment
  - Team expansion
  - Marketing and growth

### Community Growth
- **GitHub Stars**: [Current count]
- **Active Users**: [Target metrics]
- **Growth Strategy**:
  - Regular community calls
  - Bounty programs for contributors
  - Developer documentation improvements
  - Integration tutorials

---

## Quick Start

```bash
# Clone repository
git clone https://github.com/NeoQuasar/kronos-polkadot-dapp
cd kronos-polkadot-dapp/kronos-polkadot

# Start with one command
.\启动Docker并运行.ps1
```

Visit http://localhost:3000

---

## Contact

- **Website**: [If applicable]
- **Email**: [team@example.com]
- **Twitter**: [@KronosDApp]
- **GitHub**: https://github.com/NeoQuasar/kronos-polkadot-dapp

---

## 📋 Submission Checklist

### Mandatory Parts - Verification

- [x] **1. Introduction**
  - [x] Project name: Kronos Prediction DApp
  - [x] Project creation date: January 2025
  - [x] Project background with GitHub link
  - [x] Problems the project solves

- [x] **2. Features Planned for Hackathon**
  - [x] Status before participating in Hackathon
  - [x] Features planned and implemented

- [x] **3. Architecture**
  - [x] Architecture diagram included
  - [x] Description for each component

- [x] **4. Schedule**
  - [x] Timeline for all activities during Hackathon
  - [x] Important milestones (first submit, pre-demo, testnet)
  - [x] Completed features, tests, docs

- [x] **5. Team Info**
  - [ ] Team members and backgrounds (TO BE FILLED)
  - [ ] Contact info for each member (TO BE FILLED)

- [x] **6. Track and Bounty**
  - [x] Track chosen: Infrastructure Track

- [ ] **7. Demo Materials (Mandatory before offline demo)**
  - [ ] Demo Video link to YouTube (TO BE FILLED)
  - [ ] PPT link to Google Docs (TO BE FILLED)

### Optional Parts

- [x] Tokenomics Design
- [x] Marketing Plan
- [x] VC/Investment Information
- [x] Community Growth Strategy

---

**Version**: v1.0  
**Last Updated**: January 2025  
**License**: MIT

