const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage
const experiments = new Map();
const games = new Map();
const participants = new Map();

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'bTree server is running' });
});

app.post('/api/experiments', (req, res) => {
  const experimentId = uuidv4();
  const experiment = {
    id: experimentId,
    ...req.body,
    createdAt: new Date(),
    status: 'created'
  };
  
  experiments.set(experimentId, experiment);
  res.json({ experimentId, experiment });
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
    joinedAt: new Date(),
    status: 'joined'
  };
  
  participants.set(participantId, participant);
  res.json({ participantId, participant });
});

app.post('/api/games/:id/create', (req, res) => {
  const gameId = req.params.id;
  const game = {
    id: gameId,
    ...req.body,
    createdAt: new Date(),
    status: 'waiting',
    participants: [],
    gameState: {}
  };
  
  games.set(gameId, game);
  res.json({ gameId, game });
});

app.post('/api/games/:id/update', (req, res) => {
  const game = games.get(req.params.id);
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  Object.assign(game, req.body);
  games.set(req.params.id, game);
  
  // Broadcast update to all participants in the game
  io.to(`game-${req.params.id}`).emit('gameStateUpdate', game);
  
  res.json(game);
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('joinExperiment', (data) => {
    const { experimentId, participantId } = data;
    socket.join(`experiment-${experimentId}`);
    socket.join(`participant-${participantId}`);
    
    console.log(`Participant ${participantId} joined experiment ${experimentId}`);
    
    // Notify other participants
    socket.to(`experiment-${experimentId}`).emit('participantJoined', {
      participantId,
      socketId: socket.id
    });
  });

  socket.on('joinGame', (data) => {
    const { gameId, participantId } = data;
    socket.join(`game-${gameId}`);
    
    const game = games.get(gameId);
    if (game) {
      // Add participant to game if not already present
      if (!game.participants.find(p => p.id === participantId)) {
        game.participants.push({
          id: participantId,
          socketId: socket.id,
          ready: false
        });
        games.set(gameId, game);
      }
      
      // Send current game state to the joining participant
      socket.emit('gameStateUpdate', game);
      
      // Notify other participants
      socket.to(`game-${gameId}`).emit('participantUpdate', game.participants);
    }
  });

  socket.on('participantReady', (data) => {
    const { gameId, participantId } = data;
    const game = games.get(gameId);
    
    if (game) {
      const participant = game.participants.find(p => p.id === participantId);
      if (participant) {
        participant.ready = true;
        games.set(gameId, game);
        
        // Check if all participants are ready
        const allReady = game.participants.every(p => p.ready);
        if (allReady && game.participants.length >= (game.minParticipants || 2)) {
          game.status = 'active';
          game.startedAt = new Date();
          games.set(gameId, game);
          
          io.to(`game-${gameId}`).emit('gameStarted', game);
        }
        
        io.to(`game-${gameId}`).emit('participantUpdate', game.participants);
      }
    }
  });

  socket.on('submitDecision', (data) => {
    const { gameId, participantId, decision } = data;
    const game = games.get(gameId);
    
    if (game) {
      if (!game.decisions) {
        game.decisions = {};
      }
      
      game.decisions[participantId] = {
        ...decision,
        timestamp: new Date()
      };
      
      games.set(gameId, game);
      
      // Broadcast decision update (without revealing private information)
      io.to(`game-${gameId}`).emit('decisionSubmitted', {
        participantId,
        hasDecision: true
      });
      
      // Check if all participants have submitted decisions
      const allDecisionsSubmitted = game.participants.every(p => 
        game.decisions[p.id]
      );
      
      if (allDecisionsSubmitted) {
        // Process game logic here
        game.status = 'completed';
        game.completedAt = new Date();
        games.set(gameId, game);
        
        io.to(`game-${gameId}`).emit('gameCompleted', game);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Trust Game Server running on port ${PORT}`);
});