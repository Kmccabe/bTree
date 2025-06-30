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
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true
}));
app.use(express.json());

// In-memory storage
const experiments = new Map();
const games = new Map();
const participants = new Map();

// REST API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.post('/api/experiments', (req, res) => {
  const experimentId = uuidv4();
  const experiment = {
    id: experimentId,
    ...req.body,
    createdAt: new Date().toISOString(),
    status: 'created'
  };
  
  experiments.set(experimentId, experiment);
  res.json(experiment);
});

app.get('/api/experiments/:id', (req, res) => {
  const experiment = experiments.get(req.params.id);
  if (!experiment) {
    return res.status(404).json({ error: 'Experiment not found' });
  }
  res.json(experiment);
});

app.post('/api/experiments/:id/join', (req, res) => {
  const experiment = experiments.get(req.params.id);
  if (!experiment) {
    return res.status(404).json({ error: 'Experiment not found' });
  }
  
  const participantId = uuidv4();
  const participant = {
    id: participantId,
    experimentId: req.params.id,
    walletAddress: req.body.walletAddress,
    joinedAt: new Date().toISOString(),
    status: 'joined'
  };
  
  participants.set(participantId, participant);
  res.json(participant);
});

app.post('/api/games/:id/create', (req, res) => {
  const gameId = req.params.id;
  const game = {
    id: gameId,
    ...req.body,
    createdAt: new Date().toISOString(),
    status: 'waiting',
    participants: [],
    gameState: {}
  };
  
  games.set(gameId, game);
  res.json(game);
});

app.get('/api/games/:id', (req, res) => {
  const game = games.get(req.params.id);
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  res.json(game);
});

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('joinExperiment', (data) => {
    const { experimentId, participantId, walletAddress } = data;
    
    socket.join(experimentId);
    socket.participantId = participantId;
    socket.experimentId = experimentId;
    
    // Update participant info
    if (participants.has(participantId)) {
      const participant = participants.get(participantId);
      participant.socketId = socket.id;
      participant.status = 'connected';
      participants.set(participantId, participant);
    }
    
    // Broadcast updated participant list
    const experimentParticipants = Array.from(participants.values())
      .filter(p => p.experimentId === experimentId);
    
    io.to(experimentId).emit('participantUpdate', {
      participants: experimentParticipants,
      totalConnected: experimentParticipants.filter(p => p.status === 'connected').length
    });
    
    socket.emit('joinedExperiment', { 
      success: true, 
      participantId,
      experimentId 
    });
  });

  socket.on('participantReady', (data) => {
    const { participantId, experimentId } = data;
    
    if (participants.has(participantId)) {
      const participant = participants.get(participantId);
      participant.status = 'ready';
      participants.set(participantId, participant);
      
      // Check if all participants are ready
      const experimentParticipants = Array.from(participants.values())
        .filter(p => p.experimentId === experimentId);
      
      const readyCount = experimentParticipants.filter(p => p.status === 'ready').length;
      
      io.to(experimentId).emit('participantUpdate', {
        participants: experimentParticipants,
        readyCount,
        totalParticipants: experimentParticipants.length
      });
      
      // Start game if all participants are ready
      const experiment = experiments.get(experimentId);
      if (experiment && readyCount >= experiment.minParticipants) {
        startGame(experimentId, experimentParticipants);
      }
    }
  });

  socket.on('submitDecision', (data) => {
    const { gameId, participantId, decision, round } = data;
    
    if (games.has(gameId)) {
      const game = games.get(gameId);
      
      // Update game state with decision
      if (!game.gameState.decisions) {
        game.gameState.decisions = {};
      }
      if (!game.gameState.decisions[round]) {
        game.gameState.decisions[round] = {};
      }
      
      game.gameState.decisions[round][participantId] = decision;
      games.set(gameId, game);
      
      // Broadcast game state update
      io.to(game.experimentId).emit('gameStateUpdate', {
        gameId,
        gameState: game.gameState,
        round,
        decision: { participantId, ...decision }
      });
      
      // Check if round is complete
      checkRoundComplete(gameId, round);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    if (socket.participantId && participants.has(socket.participantId)) {
      const participant = participants.get(socket.participantId);
      participant.status = 'disconnected';
      participants.set(socket.participantId, participant);
      
      // Broadcast updated participant list
      if (socket.experimentId) {
        const experimentParticipants = Array.from(participants.values())
          .filter(p => p.experimentId === socket.experimentId);
        
        io.to(socket.experimentId).emit('participantUpdate', {
          participants: experimentParticipants,
          totalConnected: experimentParticipants.filter(p => p.status === 'connected').length
        });
      }
    }
  });
});

function startGame(experimentId, participants) {
  const experiment = experiments.get(experimentId);
  if (!experiment) return;
  
  const gameId = uuidv4();
  const game = {
    id: gameId,
    experimentId,
    type: experiment.type,
    participants: participants.map(p => p.id),
    gameState: {
      phase: 'started',
      round: 1,
      maxRounds: experiment.rounds || 1,
      roles: assignRoles(participants, experiment.type)
    },
    createdAt: new Date().toISOString(),
    status: 'active'
  };
  
  games.set(gameId, game);
  
  io.to(experimentId).emit('gameStarted', {
    gameId,
    gameState: game.gameState,
    participants: game.participants
  });
}

function assignRoles(participants, gameType) {
  const roles = {};
  
  if (gameType === 'trust-game') {
    // Assign Player A and Player B roles
    participants.forEach((participant, index) => {
      roles[participant.id] = index % 2 === 0 ? 'playerA' : 'playerB';
    });
  }
  
  return roles;
}

function checkRoundComplete(gameId, round) {
  const game = games.get(gameId);
  if (!game) return;
  
  const decisions = game.gameState.decisions[round] || {};
  const expectedDecisions = game.participants.length;
  
  if (Object.keys(decisions).length >= expectedDecisions) {
    // Round is complete, process results
    processRoundResults(gameId, round);
  }
}

function processRoundResults(gameId, round) {
  const game = games.get(gameId);
  if (!game) return;
  
  // Calculate results based on game type
  let results = {};
  
  if (game.type === 'trust-game') {
    results = processTrustGameRound(game, round);
  }
  
  // Update game state with results
  if (!game.gameState.results) {
    game.gameState.results = {};
  }
  game.gameState.results[round] = results;
  
  // Check if game is complete
  if (round >= game.gameState.maxRounds) {
    game.gameState.phase = 'completed';
    game.status = 'completed';
  } else {
    game.gameState.round = round + 1;
    game.gameState.phase = 'round-transition';
  }
  
  games.set(gameId, game);
  
  // Broadcast results
  io.to(game.experimentId).emit('roundComplete', {
    gameId,
    round,
    results,
    gameState: game.gameState
  });
  
  if (game.status === 'completed') {
    io.to(game.experimentId).emit('gameComplete', {
      gameId,
      finalResults: game.gameState.results,
      gameState: game.gameState
    });
  }
}

function processTrustGameRound(game, round) {
  const decisions = game.gameState.decisions[round];
  const roles = game.gameState.roles;
  const results = {};
  
  // Find Player A and Player B decisions
  let playerADecision = null;
  let playerBDecision = null;
  let playerAId = null;
  let playerBId = null;
  
  for (const [participantId, decision] of Object.entries(decisions)) {
    if (roles[participantId] === 'playerA') {
      playerADecision = decision;
      playerAId = participantId;
    } else if (roles[participantId] === 'playerB') {
      playerBDecision = decision;
      playerBId = participantId;
    }
  }
  
  if (playerADecision && playerBDecision) {
    const sentAmount = playerADecision.amount || 0;
    const multiplier = 3; // Standard trust game multiplier
    const receivedAmount = sentAmount * multiplier;
    const returnAmount = playerBDecision.amount || 0;
    
    results[playerAId] = {
      role: 'playerA',
      sent: sentAmount,
      received: returnAmount,
      finalAmount: (100 - sentAmount) + returnAmount // Starting endowment minus sent plus returned
    };
    
    results[playerBId] = {
      role: 'playerB',
      received: receivedAmount,
      returned: returnAmount,
      finalAmount: receivedAmount - returnAmount // Received minus returned
    };
  }
  
  return results;
}

// Start server
server.listen(PORT, () => {
  console.log(`Trust Game Server running on port ${PORT}`);
  console.log(`WebSocket server ready for connections`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});