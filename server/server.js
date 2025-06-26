const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// In-memory storage (in production, use a proper database)
const experiments = new Map();
const participants = new Map();
const gameSessions = new Map();

// Enhanced logging utility
const log = {
  info: (message, data = {}) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] INFO: ${message}`, data);
  },
  warn: (message, data = {}) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] WARN: ${message}`, data);
  },
  error: (message, data = {}) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ERROR: ${message}`, data);
  },
  participant: (action, participantInfo, additionalData = {}) => {
    const timestamp = new Date().toISOString();
    const walletShort = participantInfo.walletAddress ? 
      `${participantInfo.walletAddress.slice(0, 6)}...${participantInfo.walletAddress.slice(-6)}` : 
      'unknown';
    const sessionShort = participantInfo.sessionId ? 
      participantInfo.sessionId.slice(-8) : 
      'unknown';
    
    console.log(`[${timestamp}] PARTICIPANT: ${action}`, {
      participantId: participantInfo.id,
      participantNumber: participantInfo.participantNumber,
      wallet: walletShort,
      session: sessionShort,
      ...additionalData
    });
  },
  game: (action, gameId, gameState, additionalData = {}) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] GAME: ${action} [${gameId}]`, {
      phase: gameState.phase,
      round: gameState.currentRound,
      playerA_sent: gameState.playerA_sent,
      playerB_received: gameState.playerB_received,
      playerB_returned: gameState.playerB_returned,
      ...additionalData
    });
  },
  experiment: (action, experimentId, data = {}) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] EXPERIMENT: ${action} [${experimentId}]`, data);
  }
};

// Utility function to format wallet address for display
const formatWalletAddress = (address) => {
  if (!address) return 'unknown';
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
};

// Utility function to generate participant display name
const generateParticipantDisplayName = (participant) => {
  const walletShort = formatWalletAddress(participant.walletAddress);
  const sessionShort = participant.sessionId.slice(-8);
  return `P${participant.participantNumber.toString().padStart(2, '0')}_${walletShort}_${sessionShort}`;
};

// Check if all participants are ready to start
const checkAllParticipantsReady = (experiment) => {
  const hasRequiredParticipants = experiment.participants.length === experiment.maxParticipants;
  const allHaveReadInstructions = experiment.participants.every(p => p.isReady);
  
  return hasRequiredParticipants && allHaveReadInstructions;
};

// CRITICAL: Create game session when all participants are ready
const createGameSession = (experimentId, experiment) => {
  try {
    // Get experiment parameters from the experiment data
    const gameParameters = experiment.gameParameters || {
      initialEndowment: 1,
      multiplier: 2,
      rounds: 1,
      incrementSize: 0.1,
      timePerDecision: 300,
      roleAssignment: 'random',
      showHistory: false,
      anonymity: true
    };

    // Create initial game state
    const gameState = {
      gameId: experimentId,
      currentRound: 1,
      totalRounds: gameParameters.rounds || 1,
      phase: 'playerA_decision',
      initialEndowment: gameParameters.initialEndowment || 1,
      multiplier: gameParameters.multiplier || 2,
      incrementSize: Math.floor((gameParameters.incrementSize || 0.1) * 1000000), // Convert to microAlgos
      playerA_sent: 0,
      playerB_received: 0,
      playerB_returned: 0,
      playerA_balance: Math.floor((gameParameters.initialEndowment || 1) * 1000000), // Convert to microAlgos
      playerB_balance: Math.floor((gameParameters.initialEndowment || 1) * 1000000), // Convert to microAlgos
      timeRemaining: gameParameters.timePerDecision || 300,
      isAnonymous: gameParameters.anonymity !== false,
      lastUpdated: Date.now()
    };

    // Create participant mapping
    const participantMapping = {};
    experiment.participants.forEach((participant, index) => {
      const role = participant.participantNumber % 2 === 1 ? 'playerA' : 'playerB';
      participantMapping[role] = {
        sessionId: participant.sessionId,
        walletAddress: participant.walletAddress,
        playerId: participant.id,
        displayName: participant.displayName
      };
    });

    // Create game session
    const gameSession = {
      gameId: experimentId,
      participants: participantMapping,
      gameParameters,
      gameState,
      createdAt: Date.now(),
      lastUpdated: Date.now()
    };

    // Store the game session
    gameSessions.set(experimentId, gameSession);

    log.game('SESSION_CREATED', experimentId, gameState, {
      participants: Object.keys(participantMapping),
      gameParameters: {
        initialEndowment: gameParameters.initialEndowment,
        multiplier: gameParameters.multiplier,
        rounds: gameParameters.rounds
      }
    });

    return gameSession;
  } catch (error) {
    log.error('Failed to create game session', { experimentId, error: error.message });
    throw error;
  }
};

// CRITICAL: Update experiment participants with final earnings
const updateExperimentWithGameResults = (experimentId, gameSession) => {
  try {
    const experiment = experiments.get(experimentId);
    if (!experiment) {
      log.error('Experiment not found for results update', { experimentId });
      return;
    }

    const { gameState, participants: gameParticipants } = gameSession;
    
    // Update each participant with their final earnings
    experiment.participants.forEach(participant => {
      if (gameParticipants.playerA && gameParticipants.playerA.sessionId === participant.sessionId) {
        // This is Player A
        participant.earnings = gameState.playerA_balance / 1000000; // Convert to ALGO
        participant.experimentRole = 'Player A (Trustor)';
        participant.gameResults = {
          role: 'A',
          initialBalance: gameState.initialEndowment,
          amountSent: gameState.playerA_sent / 1000000,
          amountReceived: gameState.playerB_returned / 1000000,
          finalBalance: gameState.playerA_balance / 1000000
        };
        
        log.participant('EARNINGS_UPDATED', participant, {
          role: 'A',
          earnings: participant.earnings,
          experimentId
        });
        
      } else if (gameParticipants.playerB && gameParticipants.playerB.sessionId === participant.sessionId) {
        // This is Player B
        participant.earnings = gameState.playerB_balance / 1000000; // Convert to ALGO
        participant.experimentRole = 'Player B (Trustee)';
        participant.gameResults = {
          role: 'B',
          initialBalance: gameState.initialEndowment,
          amountReceived: gameState.playerB_received / 1000000,
          amountReturned: gameState.playerB_returned / 1000000,
          finalBalance: gameState.playerB_balance / 1000000
        };
        
        log.participant('EARNINGS_UPDATED', participant, {
          role: 'B',
          earnings: participant.earnings,
          experimentId
        });
      }
    });

    // Mark experiment as completed
    experiment.status = 'completed';
    experiment.completedAt = Date.now();
    experiment.gameResults = {
      playerA_sent: gameState.playerA_sent / 1000000,
      playerB_received: gameState.playerB_received / 1000000,
      playerB_returned: gameState.playerB_returned / 1000000,
      playerA_finalBalance: gameState.playerA_balance / 1000000,
      playerB_finalBalance: gameState.playerB_balance / 1000000,
      totalValue: (gameState.playerA_balance + gameState.playerB_balance) / 1000000,
      efficiency: ((gameState.playerA_balance + gameState.playerB_balance) / (2 * gameState.initialEndowment * 1000000)) * 100
    };

    // Save updated experiment
    experiments.set(experimentId, experiment);

    log.experiment('RESULTS_UPDATED', experimentId, {
      participantCount: experiment.participants.length,
      totalEarnings: experiment.participants.reduce((sum, p) => sum + (p.earnings || 0), 0),
      efficiency: experiment.gameResults.efficiency
    });

    // CRITICAL: Broadcast updated participant data to experimenter dashboard
    io.to(`experiment_${experimentId}`).emit('experimentResultsUpdate', {
      experiment,
      participants: experiment.participants,
      gameResults: experiment.gameResults,
      status: 'completed'
    });

    log.experiment('RESULTS_BROADCASTED_TO_EXPERIMENTER', experimentId, {
      participantCount: experiment.participants.length,
      broadcastTo: `experiment_${experimentId}`
    });

    return experiment;
  } catch (error) {
    log.error('Failed to update experiment with game results', { experimentId, error: error.message });
    throw error;
  }
};

// Experiment management
app.post('/api/experiments', (req, res) => {
  const experimentId = uuidv4();
  const experiment = {
    id: experimentId,
    ...req.body,
    createdAt: Date.now(),
    status: 'active',
    participants: [],
    gameStarted: false // Track if game has started
  };
  
  experiments.set(experimentId, experiment);
  log.experiment('CREATED', experimentId, { 
    type: experiment.type, 
    maxParticipants: experiment.maxParticipants 
  });
  res.json({ experimentId, experiment });
});

app.get('/api/experiments/:id', (req, res) => {
  const experiment = experiments.get(req.params.id);
  if (!experiment) {
    log.warn('Experiment not found', { experimentId: req.params.id });
    return res.status(404).json({ error: 'Experiment not found' });
  }
  res.json(experiment);
});

// Enhanced participant management with strict synchronization
app.post('/api/experiments/:id/join', (req, res) => {
  const { walletAddress, sessionId } = req.body;
  const experimentId = req.params.id;
  
  log.info('Participant join attempt', { 
    experimentId, 
    wallet: formatWalletAddress(walletAddress), 
    session: sessionId.slice(-8) 
  });
  
  const experiment = experiments.get(experimentId);
  if (!experiment) {
    log.error('Experiment not found for join', { experimentId });
    return res.status(404).json({ error: 'Experiment not found' });
  }
  
  // Check if game has already started
  if (experiment.gameStarted) {
    log.warn('Attempt to join after game started', { 
      experimentId, 
      wallet: formatWalletAddress(walletAddress) 
    });
    return res.status(400).json({ error: 'Game has already started. No new participants can join.' });
  }
  
  // Check if participant already exists by sessionId (unique per tab)
  let participant = experiment.participants.find(p => p.sessionId === sessionId);
  
  if (!participant) {
    // Check if experiment is full
    if (experiment.participants.length >= experiment.maxParticipants) {
      log.warn('Experiment full', { 
        experimentId, 
        current: experiment.participants.length, 
        max: experiment.maxParticipants 
      });
      return res.status(400).json({ error: 'Experiment is full' });
    }
    
    // Create new participant
    const participantNumber = experiment.participants.length + 1;
    participant = {
      id: `P${participantNumber.toString().padStart(3, '0')}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      sessionId,
      walletAddress,
      participantNumber,
      joinedAt: Date.now(),
      isReady: false, // CRITICAL: Always start as not ready
      lastSeen: Date.now(),
      displayName: null, // Will be set after creation
      earnings: 0 // Initialize earnings
    };
    
    // Generate display name
    participant.displayName = generateParticipantDisplayName(participant);
    
    experiment.participants.push(participant);
    participants.set(sessionId, participant);
    
    log.participant('JOINED', participant, { 
      experimentId, 
      totalParticipants: experiment.participants.length,
      maxParticipants: experiment.maxParticipants,
      gameStarted: experiment.gameStarted
    });
  } else {
    // Update existing participant
    participant.lastSeen = Date.now();
    participant.walletAddress = walletAddress; // Update in case wallet changed
    
    log.participant('RECONNECTED', participant, { 
      experimentId,
      gameStarted: experiment.gameStarted
    });
  }
  
  // Check if all participants are ready (but don't auto-start yet)
  const allReady = checkAllParticipantsReady(experiment);
  
  // Broadcast participant update with enhanced info
  const updateData = {
    participants: experiment.participants.map(p => ({
      ...p,
      displayName: p.displayName,
      walletShort: formatWalletAddress(p.walletAddress),
      sessionShort: p.sessionId.slice(-8)
    })),
    allReady,
    gameStarted: experiment.gameStarted,
    experimentStatus: {
      current: experiment.participants.length,
      max: experiment.maxParticipants,
      readyCount: experiment.participants.filter(p => p.isReady).length
    }
  };
  
  io.to(`experiment_${experimentId}`).emit('participantUpdate', updateData);
  
  log.experiment('PARTICIPANT_UPDATE_BROADCASTED', experimentId, {
    participantCount: experiment.participants.length,
    readyCount: experiment.participants.filter(p => p.isReady).length,
    allReady,
    gameStarted: experiment.gameStarted
  });
  
  res.json({ participant, experiment });
});

// Enhanced game session management
app.post('/api/games/:id/create', (req, res) => {
  const gameId = req.params.id;
  const { participants: gameParticipants, gameParameters } = req.body;
  
  log.info('Creating game session', { gameId, participantCount: gameParticipants.length });
  
  const gameSession = {
    gameId,
    participants: gameParticipants,
    gameParameters,
    gameState: {
      gameId,
      currentRound: 1,
      totalRounds: gameParameters.rounds || 1,
      phase: 'playerA_decision',
      initialEndowment: gameParameters.initialEndowment || 1,
      multiplier: gameParameters.multiplier || 2,
      incrementSize: Math.floor((gameParameters.incrementSize || 0.1) * 1000000),
      playerA_sent: 0,
      playerB_received: 0,
      playerB_returned: 0,
      playerA_balance: Math.floor((gameParameters.initialEndowment || 1) * 1000000),
      playerB_balance: Math.floor((gameParameters.initialEndowment || 1) * 1000000),
      timeRemaining: gameParameters.timePerDecision || 300,
      isAnonymous: gameParameters.anonymity !== false,
      lastUpdated: Date.now()
    },
    createdAt: Date.now(),
    lastUpdated: Date.now()
  };
  
  gameSessions.set(gameId, gameSession);
  
  log.game('CREATED', gameId, gameSession.gameState, { 
    participants: gameParticipants.map(p => ({
      id: p.id,
      wallet: formatWalletAddress(p.walletAddress),
      session: p.sessionId.slice(-8)
    }))
  });
  
  // Notify all participants
  io.to(`game_${gameId}`).emit('gameStateUpdate', gameSession.gameState);
  
  res.json(gameSession);
});

app.get('/api/games/:id', (req, res) => {
  const gameSession = gameSessions.get(req.params.id);
  if (!gameSession) {
    log.warn('Game session not found', { gameId: req.params.id });
    return res.status(404).json({ error: 'Game session not found' });
  }
  res.json(gameSession);
});

app.post('/api/games/:id/update', (req, res) => {
  const gameId = req.params.id;
  const updates = req.body;
  
  const gameSession = gameSessions.get(gameId);
  if (!gameSession) {
    log.error('Game session not found for update', { gameId });
    return res.status(404).json({ error: 'Game session not found' });
  }
  
  const previousPhase = gameSession.gameState.phase;
  
  // Update game state
  gameSession.gameState = {
    ...gameSession.gameState,
    ...updates,
    lastUpdated: Date.now()
  };
  gameSession.lastUpdated = Date.now();
  
  log.game('UPDATED', gameId, gameSession.gameState, { 
    previousPhase,
    updatedFields: Object.keys(updates)
  });
  
  // CRITICAL: If game is complete, update experiment with results
  if (gameSession.gameState.phase === 'round_complete' || gameSession.gameState.phase === 'game_complete') {
    try {
      updateExperimentWithGameResults(gameId, gameSession);
    } catch (error) {
      log.error('Failed to update experiment with game results', { gameId, error: error.message });
    }
  }
  
  // Broadcast update to all participants
  io.to(`game_${gameId}`).emit('gameStateUpdate', gameSession.gameState);
  
  res.json(gameSession.gameState);
});

// Enhanced Socket.IO connection handling
io.on('connection', (socket) => {
  const clientInfo = {
    socketId: socket.id,
    connectedAt: new Date().toISOString(),
    ip: socket.handshake.address
  };
  
  log.info('Client connected', clientInfo);
  
  // Join experiment room
  socket.on('joinExperiment', (experimentId) => {
    socket.join(`experiment_${experimentId}`);
    log.info('Socket joined experiment', { 
      socketId: socket.id, 
      experimentId,
      room: `experiment_${experimentId}`
    });
  });
  
  // Join game room
  socket.on('joinGame', (gameId) => {
    socket.join(`game_${gameId}`);
    log.info('Socket joined game', { 
      socketId: socket.id, 
      gameId,
      room: `game_${gameId}`
    });
  });
  
  // CRITICAL: Enhanced participant ready status with game session creation
  socket.on('participantReady', ({ experimentId, sessionId }) => {
    const experiment = experiments.get(experimentId);
    if (!experiment) {
      log.error('Experiment not found for ready status', { experimentId, sessionId: sessionId.slice(-8) });
      return;
    }
    
    // Check if game has already started
    if (experiment.gameStarted) {
      log.warn('Participant tried to mark ready after game started', { 
        experimentId, 
        sessionId: sessionId.slice(-8) 
      });
      return;
    }
    
    const participant = experiment.participants.find(p => p.sessionId === sessionId);
    if (!participant) {
      log.error('Participant not found for ready status', { experimentId, sessionId: sessionId.slice(-8) });
      return;
    }
    
    // Mark participant as ready
    participant.isReady = true;
    participant.lastSeen = Date.now();
    
    log.participant('MARKED_READY', participant, { experimentId });
    
    // Check if ALL participants are ready
    const allReady = checkAllParticipantsReady(experiment);
    
    const updateData = {
      participants: experiment.participants.map(p => ({
        ...p,
        displayName: p.displayName,
        walletShort: formatWalletAddress(p.walletAddress),
        sessionShort: p.sessionId.slice(-8)
      })),
      allReady,
      gameStarted: experiment.gameStarted,
      experimentStatus: {
        current: experiment.participants.length,
        max: experiment.maxParticipants,
        readyCount: experiment.participants.filter(p => p.isReady).length
      }
    };
    
    io.to(`experiment_${experimentId}`).emit('participantUpdate', updateData);
    
    log.experiment('READY_STATUS_UPDATE', experimentId, {
      participantId: participant.id,
      participantNumber: participant.participantNumber,
      readyCount: experiment.participants.filter(p => p.isReady).length,
      totalCount: experiment.participants.length,
      allReady,
      gameStarted: experiment.gameStarted
    });
    
    // CRITICAL: Only start game if ALL participants are ready AND game hasn't started yet
    if (allReady && !experiment.gameStarted) {
      // Mark game as started to prevent new participants
      experiment.gameStarted = true;
      
      log.experiment('ALL_PARTICIPANTS_READY_STARTING_GAME', experimentId, { 
        participantCount: experiment.participants.length,
        readyParticipants: experiment.participants.map(p => ({
          id: p.id,
          displayName: p.displayName,
          participantNumber: p.participantNumber,
          role: p.participantNumber % 2 === 1 ? 'A' : 'B'
        }))
      });
      
      // CRITICAL: Create the game session immediately
      try {
        const gameSession = createGameSession(experimentId, experiment);
        log.game('SESSION_CREATED_ON_START', experimentId, gameSession.gameState);
      } catch (error) {
        log.error('Failed to create game session on start', { experimentId, error: error.message });
      }
      
      // Broadcast that game is starting with role assignments
      const gameStartData = {
        message: 'All participants ready! Starting game...',
        gameStarted: true,
        participants: experiment.participants.map(p => ({
          id: p.id,
          displayName: p.displayName,
          participantNumber: p.participantNumber,
          role: p.participantNumber % 2 === 1 ? 'A' : 'B'
        }))
      };
      
      // Start game after delay to allow UI updates
      setTimeout(() => {
        io.to(`experiment_${experimentId}`).emit('gameStarting', gameStartData);
        
        // Also update participant status to reflect game started
        io.to(`experiment_${experimentId}`).emit('participantUpdate', {
          ...updateData,
          gameStarted: true
        });
        
        log.experiment('GAME_START_SIGNAL_SENT', experimentId, gameStartData);
      }, 2000);
    }
  });
  
  // Enhanced game decision submission
  socket.on('submitDecision', ({ gameId, playerId, decision }) => {
    const gameSession = gameSessions.get(gameId);
    if (!gameSession) {
      log.error('Game session not found for decision', { gameId, playerId });
      return;
    }
    
    const { gameState } = gameSession;
    const previousState = { ...gameState };
    const updates = { ...decision, lastUpdated: Date.now() };
    
    // Update game state
    gameSession.gameState = { ...gameState, ...updates };
    gameSession.lastUpdated = Date.now();
    
    log.game('DECISION_SUBMITTED', gameId, gameSession.gameState, {
      playerId,
      previousPhase: previousState.phase,
      newPhase: gameSession.gameState.phase,
      decision: Object.keys(decision)
    });
    
    // CRITICAL: If game is complete, update experiment with results
    if (gameSession.gameState.phase === 'round_complete' || gameSession.gameState.phase === 'game_complete') {
      try {
        updateExperimentWithGameResults(gameId, gameSession);
      } catch (error) {
        log.error('Failed to update experiment with game results', { gameId, error: error.message });
      }
    }
    
    // Broadcast to all participants
    io.to(`game_${gameId}`).emit('gameStateUpdate', gameSession.gameState);
  });
  
  // Enhanced heartbeat for participant presence
  socket.on('heartbeat', ({ experimentId, sessionId }) => {
    const experiment = experiments.get(experimentId);
    if (experiment) {
      const participant = experiment.participants.find(p => p.sessionId === sessionId);
      if (participant) {
        participant.lastSeen = Date.now();
        // Only log heartbeat every 10th time to reduce noise
        if (Date.now() % 10 === 0) {
          log.participant('HEARTBEAT', participant, { experimentId });
        }
      }
    }
  });
  
  socket.on('disconnect', () => {
    log.info('Client disconnected', { 
      socketId: socket.id,
      disconnectedAt: new Date().toISOString()
    });
  });
});

// Enhanced cleanup with better logging
setInterval(() => {
  const now = Date.now();
  const timeout = 5 * 60 * 1000; // 5 minutes
  let totalCleaned = 0;
  
  experiments.forEach((experiment, experimentId) => {
    const initialCount = experiment.participants.length;
    const activeParticipants = experiment.participants.filter(p => 
      (now - p.lastSeen) < timeout
    );
    
    if (activeParticipants.length !== experiment.participants.length) {
      const cleanedCount = experiment.participants.length - activeParticipants.length;
      totalCleaned += cleanedCount;
      
      log.experiment('CLEANING_INACTIVE_PARTICIPANTS', experimentId, {
        cleaned: cleanedCount,
        remaining: activeParticipants.length,
        timeout: `${timeout / 1000}s`,
        gameStarted: experiment.gameStarted
      });
      
      experiment.participants = activeParticipants;
      
      // If game hasn't started yet, reset gameStarted flag if we lost participants
      if (!experiment.gameStarted && activeParticipants.length < experiment.maxParticipants) {
        experiment.gameStarted = false;
      }
      
      const allReady = checkAllParticipantsReady(experiment);
      
      const updateData = {
        participants: experiment.participants.map(p => ({
          ...p,
          displayName: p.displayName,
          walletShort: formatWalletAddress(p.walletAddress),
          sessionShort: p.sessionId.slice(-8)
        })),
        allReady,
        gameStarted: experiment.gameStarted,
        experimentStatus: {
          current: experiment.participants.length,
          max: experiment.maxParticipants,
          readyCount: experiment.participants.filter(p => p.isReady).length
        }
      };
      
      io.to(`experiment_${experimentId}`).emit('participantUpdate', updateData);
    }
  });
  
  if (totalCleaned > 0) {
    log.info('Cleanup completed', { totalParticipantsCleaned: totalCleaned });
  }
}, 30000);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  log.info('Trust Game Server started', { 
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
  log.info('WebSocket server ready for connections');
  log.info('Enhanced synchronization and participant management enabled');
  log.info('CRITICAL: All participants must finish instructions before game starts');
});