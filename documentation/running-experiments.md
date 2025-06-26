# Running Experiments in bTree

This comprehensive guide covers how to run experiments in bTree, from simple demos to full-scale research studies using the Trust Game as a primary example.

## Table of Contents

1. [Overview](#overview)
2. [Demo Mode](#demo-mode)
3. [Live Experiments](#live-experiments)
4. [Trust Game Walkthrough](#trust-game-walkthrough)
5. [Multi-Tab Testing](#multi-tab-testing)
6. [Payment Processing](#payment-processing)
7. [Troubleshooting](#troubleshooting)

## Overview

bTree supports three main modes of operation:

- **Demo Mode**: Single-user testing and demonstration
- **Live Experiments**: Real-time multi-participant research studies
- **Multi-Tab Testing**: Same wallet across multiple browser tabs for testing

## Demo Mode

Demo mode allows you to test experiment mechanics without requiring multiple participants or server connectivity.

### Quick Demo Access

1. **Direct Demo Link**: Visit the homepage and click "Try Trust Game Demo"
2. **From Dashboard**: Navigate to Dashboard → Create Experiment → Test Demo
3. **Direct URL**: `http://localhost:5173/trust-game/demo?role=A`

### Demo Features

- ✅ **Single-user experience**: Play both Player A and Player B roles
- ✅ **No server required**: Works offline with local state management
- ✅ **Role switching**: Switch between roles to understand both perspectives
- ✅ **Instant feedback**: See results immediately without waiting
- ✅ **Parameter testing**: Test different game configurations

### Running a Demo

```bash
# Start the frontend only (no server needed for demo)
npm run dev

# Navigate to demo
# Option 1: Click "Try Trust Game Demo" on homepage
# Option 2: Direct URL: http://localhost:5173/trust-game/demo?role=A
```

### Demo Parameters

You can customize demo parameters via URL:

```
http://localhost:5173/trust-game/demo?role=A&multiplier=3&initialEndowment=2&incrementSize=0.5
```

**Available Parameters:**
- `role`: A or B (starting role)
- `multiplier`: Multiplication factor (default: 2)
- `initialEndowment`: Starting amount in ALGO (default: 1)
- `incrementSize`: Decision increment size (default: 0.1)

## Live Experiments

Live experiments involve real participants, server coordination, and actual monetary transactions.

### Prerequisites for Live Experiments

1. **Backend Server Running**:
   ```bash
   cd server
   npm install
   npm start
   ```

2. **Frontend Running**:
   ```bash
   npm run dev
   ```

3. **Wallet Connected**: Pera Wallet with TestNet or MainNet ALGO
4. **Network Access**: Participants can access your server

### Creating a Live Experiment

#### Step 1: Create Experiment

1. Navigate to **Dashboard** → **Create Experiment**
2. Choose **Trust Game** experiment type
3. Configure parameters:

```javascript
// Example Trust Game Configuration
{
  title: "Trust and Reciprocity Study - Winter 2024",
  description: "Research study on trust behavior",
  maxParticipants: 4,
  gameParameters: {
    initialEndowment: 1.0,      // ALGO per participant
    multiplier: 2,              // Multiplication factor
    rounds: 1,                  // Number of rounds
    incrementSize: 0.1,         // Decision increments
    timePerDecision: 300,       // 5 minutes per decision
    roleAssignment: "random",   // or "fixed"
    showHistory: false,         // Show previous rounds
    anonymity: true            // Anonymous play
  }
}
```

#### Step 2: Launch Experiment

1. Click **"Launch Live Experiment"**
2. System creates experiment on server
3. You receive a **participant link**
4. Share this link with participants

#### Step 3: Monitor Experiment

The experiment dashboard shows:
- **Real-time participant count**
- **Connection status** (WebSocket indicators)
- **Participant readiness** status
- **Game progress** and decisions
- **Live activity feed**

### Participant Experience

#### Joining an Experiment

1. **Receive Link**: Participants get a link like:
   ```
   http://localhost:5173/trust-game-lobby/exp_123?maxParticipants=4&multiplier=2
   ```

2. **Connect Wallet**: Must connect Algorand wallet (Pera Wallet)

3. **Read Instructions**: Comprehensive markdown instructions with:
   - Game rules and mechanics
   - Payment structure
   - Example scenarios
   - Strategy tips

4. **Wait for Others**: Lobby system ensures all participants finish reading

5. **Automatic Start**: Game begins when all participants are ready

#### Game Flow

```
Wallet Connection → Instructions → Lobby → Role Assignment → Game Play → Results → Payment
```

## Trust Game Walkthrough

### Complete Trust Game Example

Let's walk through a complete Trust Game experiment:

#### Experiment Setup

```bash
# 1. Start backend server
cd server
npm start
# Output: Trust Game Server running on port 3001

# 2. Start frontend
npm run dev
# Output: Local: http://localhost:5173/
```

#### Creating the Experiment

1. **Navigate**: Go to `http://localhost:5173/dashboard`
2. **Create**: Click "New Experiment"
3. **Configure**:
   ```
   Title: "Trust Game Research Study"
   Type: Trust Game
   Max Participants: 2
   Initial Endowment: 1 ALGO
   Multiplier: 2x
   Increment Size: 0.1 ALGO
   Time Per Decision: 5 minutes
   ```
4. **Launch**: Click "Launch Live Experiment"
5. **Get Link**: Copy participant link (e.g., `http://localhost:5173/trust-game-lobby/exp_abc123`)

#### Participant Flow

**Participant 1 (Player A):**
1. Opens link, connects wallet
2. Reads instructions (sees role will be assigned)
3. Clicks "I Have Read the Instructions"
4. Waits in lobby for other participants

**Participant 2 (Player B):**
1. Opens same link, connects wallet
2. Reads instructions
3. Clicks "I Have Read the Instructions"
4. System detects all participants ready

**Automatic Game Start:**
1. Server assigns roles (P1 = Player A, P2 = Player B)
2. Both participants redirected to game interface
3. Real-time synchronization begins

#### Game Play

**Player A Decision Phase:**
- Player A sees: "You have 1 ALGO, how much to send?"
- Options: 0, 0.1, 0.2, ..., 1.0 ALGO
- Player A selects 0.6 ALGO and submits
- Player B receives: 0.6 × 2 = 1.2 ALGO

**Player B Decision Phase:**
- Player B sees: "You received 1.2 ALGO, how much to return?"
- Options: 0, 0.1, 0.2, ..., 1.2 ALGO
- Player B selects 0.8 ALGO and submits

**Results:**
- Player A final: 1.0 - 0.6 + 0.8 = 1.2 ALGO
- Player B final: 1.0 + 1.2 - 0.8 = 1.4 ALGO
- Total value created: 0.6 ALGO (efficiency gain)

#### Payment Processing

1. **Automatic Results**: Server calculates final earnings
2. **Researcher Dashboard**: Shows participant earnings
3. **Payment Form**: Researcher clicks "Send Payments"
4. **Bulk Processing**: System processes payments to all participants
5. **Confirmation**: Participants receive ALGO in their wallets

## Multi-Tab Testing

Test same-wallet scenarios across multiple browser tabs:

### Setup for Multi-Tab Testing

```bash
# 1. Start server and frontend
cd server && npm start
# New terminal:
npm run dev

# 2. Create experiment (set maxParticipants to 2)
# 3. Get participant link
```

### Multi-Tab Process

1. **Tab 1**: Open participant link, connect wallet, read instructions
2. **Tab 2**: Open same link in new tab, same wallet auto-connects
3. **Unique Sessions**: Each tab gets unique session ID
4. **Role Assignment**: Tab 1 = Player A, Tab 2 = Player B
5. **Synchronized Play**: Decisions sync in real-time between tabs

### What You'll See

```
Tab 1 (Player A):
- Session ID: ...abc123
- Role: Player A (Trustor)
- Wallet: ABCD...WXYZ (same wallet)

Tab 2 (Player B):
- Session ID: ...def456  (different session)
- Role: Player B (Trustee)
- Wallet: ABCD...WXYZ (same wallet)
```

### Benefits of Multi-Tab Testing

- ✅ **Test full game flow** with one wallet
- ✅ **Verify real-time synchronization**
- ✅ **Debug participant interactions**
- ✅ **Validate payment calculations**
- ✅ **Check UI/UX from both perspectives**

## Payment Processing

### Automatic Payment System

bTree includes sophisticated payment processing:

#### Payment Flow

1. **Experiment Completion**: Game ends, earnings calculated
2. **Results Update**: Server broadcasts final participant data
3. **Payment Form**: Researcher opens payment transaction form
4. **Validation**: System validates all wallet addresses and amounts
5. **Bulk Processing**: Payments sent individually with tracking
6. **Status Updates**: Real-time payment status for each participant
7. **Export Results**: CSV export of all payment transactions

#### Payment Form Features

```javascript
// Example participant data for payments
[
  {
    id: "P001_abc123",
    walletAddress: "ABCD1234...WXYZ5678",  // Full 58-character address
    displayName: "Player A - P001",
    earnings: 1.2,                         // ALGO amount
    experimentRole: "Player A (Trustor)",
    status: "pending"                      // pending/processing/completed/failed
  },
  {
    id: "P002_def456", 
    walletAddress: "EFGH5678...STUV9012",
    displayName: "Player B - P002",
    earnings: 1.4,
    experimentRole: "Player B (Trustee)", 
    status: "pending"
  }
]
```

#### Payment Security

- **Address Validation**: All wallet addresses verified before payment
- **Amount Validation**: Earnings amounts checked for reasonableness
- **Balance Verification**: Researcher wallet balance confirmed
- **Transaction Tracking**: Each payment gets unique transaction ID
- **Retry Mechanism**: Failed payments can be retried individually

### Manual Payment Processing

If automatic payments fail, you can process manually:

```bash
# 1. Export participant data from payment form (CSV)
# 2. Use Algorand wallet or SDK to send individual payments
# 3. Record transaction IDs for research records
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Server Connection Issues

**Problem**: "Not connected to game server"

**Solutions**:
```bash
# Check server is running
cd server
npm start

# Check port availability
netstat -an | grep 3001

# Check firewall settings
# Ensure port 3001 is open for connections
```

#### 2. WebSocket Connection Failures

**Problem**: Red "Disconnected" indicator

**Solutions**:
- Refresh browser page
- Check browser console for WebSocket errors
- Verify server is running and accessible
- Check for browser extensions blocking WebSockets

#### 3. Wallet Connection Issues

**Problem**: Wallet won't connect or shows wrong network

**Solutions**:
```javascript
// Check wallet network in browser console
console.log('Current network:', wallet.network);

// Switch networks in Pera Wallet
// Settings → Network → TestNet/MainNet

// Clear browser cache and cookies
// Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

#### 4. Payment Transaction Failures

**Problem**: Payments fail during processing

**Solutions**:
- **Insufficient Balance**: Add more ALGO to researcher wallet
- **Invalid Addresses**: Verify all participant wallet addresses
- **Network Issues**: Check Algorand network status
- **Transaction Limits**: Process payments in smaller batches

#### 5. Multi-Tab Synchronization Issues

**Problem**: Tabs not syncing properly

**Solutions**:
```bash
# Check server logs for WebSocket connections
cd server
npm start
# Look for: "Client connected" and "Socket joined experiment"

# Verify unique session IDs in browser console
console.log('Session ID:', sessionId);

# Refresh both tabs to reconnect
```

### Debug Information

#### Browser Console Logs

Enable detailed logging:
```javascript
// In browser console
localStorage.setItem('debug', 'true');
// Refresh page to see detailed logs
```

#### Server Logs

Monitor server activity:
```bash
cd server
npm start
# Watch for:
# - "Client connected"
# - "Participant joined"
# - "Game state updated"
# - "Payment processed"
```

#### Network Debugging

Check WebSocket connections:
```javascript
// Browser console
console.log('WebSocket state:', socket.readyState);
// 0 = CONNECTING, 1 = OPEN, 2 = CLOSING, 3 = CLOSED
```

### Performance Optimization

#### For Large Experiments

```javascript
// Recommended limits
maxParticipants: 20,        // Per experiment
concurrentExperiments: 5,   // Per server
paymentBatchSize: 10       // Payments per batch
```

#### Server Scaling

```bash
# For production deployment
# Use PM2 for process management
npm install -g pm2
pm2 start server.js --name "btree-server"

# Use Redis for session storage
# Use PostgreSQL for persistent data
# Use NGINX for load balancing
```

## Advanced Configuration

### Custom Experiment Parameters

```javascript
// Advanced Trust Game configuration
{
  gameParameters: {
    initialEndowment: 2.0,           // Higher stakes
    multiplier: 3,                   // Higher multiplication
    rounds: 5,                       // Multiple rounds
    incrementSize: 0.05,             // Finer increments
    timePerDecision: 180,            // 3 minutes per decision
    roleAssignment: "fixed",         // Keep same roles
    showHistory: true,               // Show previous rounds
    anonymity: false,                // Show participant IDs
    
    // Advanced options
    endowmentVariation: true,        // Random starting amounts
    dynamicMultiplier: true,         // Multiplier changes per round
    communicationAllowed: false,     // Chat between participants
    practiceRounds: 2               // Practice before real game
  }
}
```

### Environment Configuration

```bash
# .env file for production
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
ALGORAND_NETWORK=mainnet
ALGORAND_API_KEY=...
```

---

This documentation provides comprehensive coverage of running experiments in bTree. For additional support, check the main README file or open an issue on GitHub.