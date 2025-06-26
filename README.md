# bTree - Experimental Economics Platform

A modern web application for conducting economic experiments with blockchain-based incentives using the Algorand network. bTree enables researchers to create, manage, and analyze economic experiments with real monetary rewards distributed automatically via smart contracts.

## 🚀 Quick Start

### Prerequisites
- **Node.js** (version 18 or higher)
- **npm** (comes with Node.js)
- **Pera Wallet** (for Algorand blockchain integration)

### Installation & Setup

1. **Clone and install dependencies**
   ```bash
   git clone <your-repository-url>
   cd btree-experimental-economics
   npm install
   ```

2. **Start the backend server**
   ```bash
   cd server
   npm install
   npm start
   ```
   The server will run on `http://localhost:3001`

3. **Start the frontend (in a new terminal)**
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`

4. **Open your browser**
   Navigate to `http://localhost:5173` to view bTree.

## 📚 Detailed Documentation

For comprehensive guides on using bTree, see our detailed documentation:

- **[Running Experiments Guide](./documentation/running-experiments.md)** - Complete walkthrough of demo mode, live experiments, and multi-tab testing using Trust Game examples
- **[Making Experiments Guide](./documentation/making-experiments.md)** - Comprehensive guide to creating experiments in bTree, including Trust Game configuration and Bolt development workflow
- **[Trust Game Tutorial](./documentation/running-experiments.md#trust-game-walkthrough)** - Step-by-step Trust Game experiment setup
- **[Payment Processing](./documentation/running-experiments.md#payment-processing)** - Automated payment system documentation
- **[Troubleshooting](./documentation/running-experiments.md#troubleshooting)** - Common issues and solutions

## 🎮 Multi-Tab Trust Game Setup (Same Wallet)

### For Testing with Same Wallet Across Multiple Tabs:

1. **Start the backend server** in one terminal:
   ```bash
   cd server
   npm start
   ```
   You should see: "Trust Game Server running on port 3001"

2. **Start the frontend** in another terminal:
   ```bash
   npm run dev
   ```
   You should see: "Local: http://localhost:5173/"

3. **Connect your wallet** in the first tab:
   - Go to `http://localhost:5173`
   - Click "Connect Wallet" and connect your Pera Wallet
   - Make sure you have some TestNet ALGO (get from faucet if needed)

4. **Create a Trust Game experiment**:
   - Go to Dashboard → Create Experiment
   - Choose "Trust Game" 
   - Set parameters (2 participants minimum)
   - Launch the experiment
   - Copy the participant link

5. **Open multiple tabs** with the participant link:
   - **Tab 1**: Paste the participant link
   - **Tab 2**: Open another tab with the same participant link
   - Each tab will use the same wallet but get unique session IDs

6. **Both tabs will show**:
   - ✅ Connected to server (green indicator)
   - Same wallet address but different participant IDs
   - Real-time synchronization between tabs

### What Happens with Same Wallet:

- ✅ **Same wallet address** is used for both participants
- ✅ **Unique session IDs** distinguish between tabs
- ✅ **Real-time communication** works between tabs
- ✅ **Game state synchronization** across participants
- ✅ **Role assignment** (one tab gets Player A, other gets Player B)
- ✅ **Live updates** when decisions are made

## 🔧 Architecture

### Backend Server (`server/`)
- **Express.js** REST API for experiment management
- **Socket.IO** for real-time communication between participants
- **In-memory storage** (easily replaceable with database)
- **Cross-origin support** for multi-computer setups
- **Session management** for unique participant tracking

### Frontend (`src/`)
- **React 18** with TypeScript
- **WebSocket integration** for real-time updates
- **Algorand wallet integration** via Pera Wallet
- **Responsive design** with Tailwind CSS
- **Framer Motion** for smooth animations
- **React Router** for navigation

### Key Features for Multi-Tab Support:
- ✅ **Real-time synchronization** across different tabs
- ✅ **Unique participant identification** with session management
- ✅ **Cross-tab communication** via WebSocket events
- ✅ **Automatic reconnection** handling
- ✅ **Participant presence detection** with heartbeat system
- ✅ **Game state persistence** during network interruptions
- ✅ **Same wallet, different sessions** support

## 🎯 Trust Game Flow (With Server)

1. **Researcher creates experiment** → Gets shareable lobby URL
2. **Participants join lobby** → Read instructions and connect wallets (can be same wallet)
3. **Server assigns unique session IDs** → Each tab gets unique participant identity
4. **All participants ready** → Game automatically starts with role assignment
5. **Player A makes decision** → Sent amount multiplied and given to Player B
6. **Player B makes decision** → Returns chosen amount to Player A
7. **Results displayed** → Final payoffs calculated and shown
8. **Automatic payments** → Earnings distributed to participant wallets
9. **Real-time updates** → All changes synchronized across tabs instantly

## 🌐 Network Configuration

bTree supports both Algorand networks:

### TestNet (Default - Recommended for Testing)
- **Purpose**: Development and testing
- **ALGO**: Test tokens with no real value
- **Faucet**: Get free test ALGO from [Algorand TestNet Dispenser](https://testnet.algoexplorer.io/dispenser)

### MainNet (Production)
- **Purpose**: Real experiments with actual monetary value
- **ALGO**: Real cryptocurrency
- **⚠️ Warning**: Only use for actual research with proper funding

## 💳 Payment System

bTree includes an advanced payment transaction system:

### Features:
- **Automatic payment processing** for experiment participants
- **Bulk payment transactions** with individual tracking
- **Real-time payment status updates**
- **Failed payment retry mechanisms**
- **CSV export** of payment results
- **Multi-participant support** with unique wallet addresses

### Payment Flow:
1. Experiment completes with participant earnings calculated
2. Researcher opens payment form with participant data
3. System validates all wallet addresses and amounts
4. Payments processed individually with status tracking
5. Results exported and participants notified

## 🔍 Troubleshooting

### Common Issues:

1. **"Not connected to game server"**
   - Make sure the backend server is running (`cd server && npm start`)
   - Check that the server URL is correct in the frontend configuration
   - Verify firewall settings allow connections on port 3001

2. **Same wallet in multiple tabs not working**
   - Ensure both tabs are connected to the same server
   - Check that WebSocket connections are established (green indicator)
   - Verify each tab has a unique session ID in the participant info

3. **Payment transaction failures**
   - Ensure wallet is connected and has sufficient balance
   - Check network connection (TestNet vs MainNet)
   - Verify recipient wallet addresses are valid
   - Try refreshing wallet connection

4. **Wallet connection issues**
   - Install Pera Wallet browser extension or mobile app
   - Make sure wallet is unlocked and on the correct network (TestNet/MainNet)
   - Clear browser cache if connection fails

### Debug Information:
- Open browser developer tools (F12) to see console logs
- WebSocket connection status is shown in the top-right corner
- Game state debug panel shows current phase and transaction history
- Participant info shows unique session IDs for each tab

For more detailed troubleshooting, see the [Troubleshooting Guide](./documentation/running-experiments.md#troubleshooting).

## 📊 Experiment Types Supported

- **Trust Games** ✅ (Multi-tab ready with server)
  - Real-time participant synchronization
  - Automatic role assignment (Player A/B)
  - Configurable parameters (endowment, multiplier, rounds)
  - Anonymous or identified play options
- **Public Goods Games** (Single-computer demo)
- **Auction Mechanisms** (Planned)
- **Market Simulations** (Planned)
- **Behavioral Studies** (Planned)

## 🔒 Security & Privacy

- **Wallet Security**: Never share seed phrases; transactions require explicit approval
- **Data Privacy**: Participant data stored temporarily; no personal information required
- **Network Security**: All communications encrypted via HTTPS/WSS in production
- **Session Isolation**: Each tab gets unique session ID even with same wallet
- **Anonymous Play**: Participant identities can be hidden during experiments
- **Payment Security**: All transactions verified on Algorand blockchain

## 🚀 Production Deployment

For production use:
1. Deploy backend to cloud service (AWS, Heroku, DigitalOcean)
2. Update frontend configuration with production server URL
3. Enable HTTPS/WSS for secure connections
4. Set up proper database (PostgreSQL, MongoDB) instead of in-memory storage
5. Configure environment variables for different networks
6. Set up SSL certificates for secure wallet connections

## 📝 Development

### Tech Stack:
- **Frontend**: React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express.js, Socket.IO
- **Blockchain**: Algorand SDK, Pera Wallet Connect
- **Real-time**: WebSocket communication
- **Icons**: Lucide React
- **Build Tool**: Vite

### Adding New Experiment Types:
1. Create experiment configuration in `ExperimentCreator.tsx`
2. Implement real-time logic in backend `server.js`
3. Add participant interface components
4. Update WebSocket event handlers
5. Add payment processing logic

### Backend API Endpoints:
- `POST /api/experiments` - Create new experiment
- `GET /api/experiments/:id` - Get experiment details
- `POST /api/experiments/:id/join` - Join experiment as participant
- `POST /api/games/:id/create` - Create game session
- `POST /api/games/:id/update` - Update game state

### WebSocket Events:
- `joinExperiment` - Join experiment room
- `participantReady` - Mark participant as ready
- `submitDecision` - Submit game decision
- `gameStateUpdate` - Broadcast game state changes
- `participantUpdate` - Broadcast participant list changes
- `experimentResultsUpdate` - Broadcast final results

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For questions or support, please open an issue on GitHub or contact the development team.

## 🎉 Features Highlights

### Real-time Synchronization
- **WebSocket-based communication** ensures all participants stay synchronized
- **Automatic reconnection** handling for network interruptions
- **Cross-tab support** allows same wallet to participate as different players

### Advanced Payment System
- **Bulk payment processing** with individual transaction tracking
- **Automatic retry** for failed payments
- **Real-time status updates** during payment processing
- **CSV export** for record keeping

### Researcher Dashboard
- **Live experiment monitoring** with real-time participant tracking
- **Payment management** with one-click bulk payments
- **Analytics and reporting** for experiment results
- **Experiment configuration** with extensive customization options

### Participant Experience
- **Wallet-first design** with seamless Algorand integration
- **Clear instructions** with markdown support
- **Real-time feedback** during experiments
- **Automatic earnings** distributed to wallets

---

**🌳 bTree - Growing the future of experimental economics research!** 

The platform now supports real-time communication between participants using the same wallet across different browser tabs with robust error handling, automatic payment processing, and comprehensive experiment management tools.