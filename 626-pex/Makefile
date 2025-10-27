# PEX DEX Development Makefile

.PHONY: help install build test clean dev deploy verify lint format

# Default target
help:
	@echo "🚀 PEX DEX Development Commands"
	@echo ""
	@echo "📦 Setup & Installation:"
	@echo "  make install          Install all dependencies (contracts + frontend)"
	@echo "  make install-contracts Install contract dependencies only"
	@echo "  make install-frontend Install frontend dependencies only"
	@echo ""
	@echo "🔨 Build & Compilation:"
	@echo "  make build            Build contracts and frontend"
	@echo "  make build-contracts  Build contracts only (Hardhat + Foundry)"
	@echo "  make build-frontend   Build frontend only"
	@echo "  make compile          Compile contracts (Hardhat)"
	@echo "  make forge-build      Build contracts (Foundry)"
	@echo ""
	@echo "🧪 Testing:"
	@echo "  make test             Run all tests (contracts + frontend)"
	@echo "  make test-contracts   Run contract tests (Hardhat + Foundry)"
	@echo "  make test-frontend    Run frontend tests"
	@echo "  make test-forge       Run Foundry tests"
	@echo "  make test-hardhat     Run Hardhat tests"
	@echo "  make test-coverage    Generate test coverage report"
	@echo ""
	@echo "🚀 Development:"
	@echo "  make dev              Start full development environment"
	@echo "  make dev-node         Start local Hardhat node"
	@echo "  make dev-frontend     Start frontend development server"
	@echo "  make setup-dev        Setup development environment with test data"
	@echo ""
	@echo "🌐 Deployment:"
	@echo "  make deploy-local     Deploy to local network"
	@echo "  make deploy-sepolia   Deploy to Sepolia testnet"
	@echo "  make deploy-mainnet   Deploy to Ethereum mainnet"
	@echo "  make deploy-polkavm   Deploy to PolkaVM testnet"
	@echo ""
	@echo "🔍 Verification:"
	@echo "  make verify-sepolia   Verify contracts on Sepolia"
	@echo "  make verify-mainnet   Verify contracts on mainnet"
	@echo "  make verify-polkavm   Verify contracts on PolkaVM"
	@echo ""
	@echo "🧹 Maintenance:"
	@echo "  make clean            Clean build artifacts"
	@echo "  make lint             Run linting (contracts + frontend)"
	@echo "  make format           Format code (contracts + frontend)"
	@echo "  make gas-report       Generate gas usage report"
	@echo "  make size-contracts   Check contract sizes"
	@echo ""
	@echo "📊 Analysis:"
	@echo "  make analyze          Run security analysis"
	@echo "  make slither          Run Slither security analysis"
	@echo "  make mythril          Run Mythril security analysis"

# Installation targets
install: install-contracts install-frontend
	@echo "✅ All dependencies installed"

install-contracts:
	@echo "📦 Installing contract dependencies..."
	npm install
	@echo "✅ Contract dependencies installed"

install-frontend:
	@echo "📦 Installing frontend dependencies..."
	cd frontend && npm install
	@echo "✅ Frontend dependencies installed"

# Build targets
build: build-contracts build-frontend
	@echo "✅ Build completed"

build-contracts: compile forge-build
	@echo "✅ Contracts built"

build-frontend:
	@echo "🔨 Building frontend..."
	cd frontend && npm run build
	@echo "✅ Frontend built"

compile:
	@echo "🔨 Compiling contracts with Hardhat..."
	npx hardhat compile

forge-build:
	@echo "🔨 Building contracts with Foundry..."
	forge build

# Testing targets
test: test-contracts test-frontend
	@echo "✅ All tests completed"

test-contracts: test-hardhat test-forge
	@echo "✅ Contract tests completed"

test-frontend:
	@echo "🧪 Running frontend tests..."
	cd frontend && npm test

test-hardhat:
	@echo "🧪 Running Hardhat tests..."
	npx hardhat test

test-forge:
	@echo "🧪 Running Foundry tests..."
	forge test -vvv

test-coverage:
	@echo "📊 Generating test coverage..."
	npx hardhat coverage
	forge coverage

# Development targets
dev:
	@echo "🚀 Starting full development environment..."
	@echo "This will start both the local node and frontend server"
	npm run dev

dev-node:
	@echo "🚀 Starting local Hardhat node..."
	npx hardhat node

dev-frontend:
	@echo "🚀 Starting frontend development server..."
	cd frontend && npm run dev

setup-dev:
	@echo "⚙️  Setting up development environment..."
	npx hardhat run scripts/setup-dev.js --network localhost

# Deployment targets
deploy-local:
	@echo "🚀 Deploying to local network..."
	npx hardhat deploy --network localhost
	make setup-dev

deploy-sepolia:
	@echo "🚀 Deploying to Sepolia testnet..."
	npx hardhat deploy --network sepolia

deploy-mainnet:
	@echo "🚀 Deploying to Ethereum mainnet..."
	@echo "⚠️  WARNING: This will deploy to mainnet!"
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ]
	npx hardhat deploy --network mainnet

deploy-polkavm:
	@echo "🚀 Deploying to PolkaVM testnet..."
	npx hardhat run scripts/deploy-polkavm.js --network polkavm-testnet

# Verification targets
verify-sepolia:
	@echo "🔍 Verifying contracts on Sepolia..."
	npx hardhat run scripts/verify-contracts.js --network sepolia

verify-mainnet:
	@echo "🔍 Verifying contracts on mainnet..."
	npx hardhat run scripts/verify-contracts.js --network mainnet

verify-polkavm:
	@echo "🔍 Verifying contracts on PolkaVM..."
	npx hardhat run scripts/verify-contracts.js --network polkavm-testnet

# Maintenance targets
clean:
	@echo "🧹 Cleaning build artifacts..."
	npx hardhat clean
	forge clean
	rm -rf frontend/.next
	rm -rf frontend/out
	rm -rf cache
	rm -rf artifacts
	rm -rf typechain-types
	@echo "✅ Clean completed"

lint:
	@echo "🔍 Running linting..."
	npm run lint
	cd frontend && npm run lint

format:
	@echo "✨ Formatting code..."
	npm run format
	cd frontend && npm run format

gas-report:
	@echo "📊 Generating gas report..."
	REPORT_GAS=true npx hardhat test

size-contracts:
	@echo "📏 Checking contract sizes..."
	npx hardhat size-contracts

# Analysis targets
analyze: slither
	@echo "✅ Security analysis completed"

slither:
	@echo "🔍 Running Slither analysis..."
	slither . --exclude-dependencies

mythril:
	@echo "🔍 Running Mythril analysis..."
	@echo "Note: Mythril analysis can take a long time"
	myth analyze contracts/ --solv 0.8.19

# Environment setup
env-setup:
	@echo "⚙️  Setting up environment files..."
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "📝 Created .env from .env.example"; \
		echo "⚠️  Please update .env with your actual values"; \
	fi
	@if [ ! -f frontend/.env.local ]; then \
		echo "📝 Creating frontend/.env.local..."; \
		echo "NEXT_PUBLIC_CHAIN_ID=31337" > frontend/.env.local; \
		echo "NEXT_PUBLIC_RPC_URL=http://localhost:8545" >> frontend/.env.local; \
		echo "📝 Created frontend/.env.local for local development"; \
	fi

# Quick start for new developers
quickstart: env-setup install build deploy-local
	@echo ""
	@echo "🎉 Quickstart completed!"
	@echo ""
	@echo "📋 Next steps:"
	@echo "1. Update .env with your actual values"
	@echo "2. Run 'make dev' to start the development environment"
	@echo "3. Open http://localhost:3000 in your browser"
	@echo "4. Connect MetaMask to localhost:8545"
	@echo ""
	@echo "🔑 Test accounts are available in the console output above"

# Docker targets (if using Docker)
docker-build:
	@echo "🐳 Building Docker images..."
	docker-compose build

docker-up:
	@echo "🐳 Starting Docker containers..."
	docker-compose up -d

docker-down:
	@echo "🐳 Stopping Docker containers..."
	docker-compose down

docker-logs:
	@echo "📋 Showing Docker logs..."
	docker-compose logs -f

# Database targets (if using a database)
db-migrate:
	@echo "🗄️  Running database migrations..."
	# Add your database migration commands here

db-seed:
	@echo "🌱 Seeding database..."
	# Add your database seeding commands here

# Monitoring targets
monitor-gas:
	@echo "⛽ Monitoring gas prices..."
	# Add gas price monitoring script

monitor-contracts:
	@echo "📊 Monitoring contract events..."
	# Add contract monitoring script