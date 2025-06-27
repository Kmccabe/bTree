import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface GameState {
  gameId: string;
  currentRound: number;
  totalRounds: number;
  phase: 'waiting' | 'playerA_decision' | 'playerB_decision' | 'round_complete' | 'game_complete';
  initialEndowment: number;
  multiplier: number;
  incrementSize: number;
  playerA_sent: number;
  playerB_received: number;
  playerB_returned: number;
  playerA_balance: number;
  playerB_balance: number;
  timeRemaining: number;
  isAnonymous: boolean;
  lastUpdated: number;
}

interface Participant {
  id: string;
  sessionId: string;
  walletAddress: string;
  participantNumber: number;
  joinedAt: number;
  isReady: boolean;
  lastSeen: number;
  displayName?: string;
  walletShort?: string;
  sessionShort?: string;
}

interface ExperimentStatus {
  current: number;
  max: number;
  readyCount: number;
}

interface UseGameSocketReturn {
  socket: Socket | null;
  connected: boolean;
  gameState: GameState | null;
  participants: Participant[];
  allParticipantsReady: boolean;
  gameStarted: boolean;
  experimentStatus: ExperimentStatus;
  joinExperiment: (experimentId: string) => void;
  joinGame: (gameId: string) => void;
  submitDecision: (gameId: string, playerId: string, decision: Partial<GameState>) => void;
  setParticipantReady: (experimentId: string, sessionId: string) => void;
  sendHeartbeat: (experimentId: string, sessionId: string) => void;
}

// Dynamic socket URL based on environment
const getSocketUrl = () => {
  // In production (Netlify), use the Railway backend URL
  if (import.meta.env.PROD) {
    return 'https://bTree-production.up.railway.app';
  }
  // In development, use localhost
  return 'http://localhost:3001';
};

const SOCKET_URL = getSocketUrl();

export const useGameSocket = (): UseGameSocketReturn => {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [allParticipantsReady, setAllParticipantsReady] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [experimentStatus, setExperimentStatus] = useState<ExperimentStatus>({
    current: 0,
    max: 0,
    readyCount: 0
  });

  // Track which experiments and games we've already joined to prevent duplicate joins
  const joinedExperimentsRef = useRef<Set<string>>(new Set());
  const joinedGamesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    console.log('🔌 Connecting to socket server:', SOCKET_URL);
    
    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('✅ Connected to game server at:', SOCKET_URL);
      setConnected(true);
      // Clear joined tracking on reconnect so we can rejoin rooms
      joinedExperimentsRef.current.clear();
      joinedGamesRef.current.clear();
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from game server');
      setConnected(false);
      // Clear joined tracking on disconnect
      joinedExperimentsRef.current.clear();
      joinedGamesRef.current.clear();
    });

    socket.on('gameStateUpdate', (newGameState: GameState) => {
      console.log('🎮 Game state updated:', newGameState);
      setGameState(newGameState);
    });

    // Enhanced participant update handler
    socket.on('participantUpdate', ({ participants: newParticipants, allReady, gameStarted: gameHasStarted, experimentStatus: expStatus }) => {
      console.log('👥 Participants updated:', {
        participants: newParticipants.length,
        allReady,
        gameStarted: gameHasStarted,
        experimentStatus: expStatus
      });
      
      setParticipants(newParticipants);
      setAllParticipantsReady(allReady);
      setGameStarted(gameHasStarted || false);
      
      if (expStatus) {
        setExperimentStatus(expStatus);
      }
    });

    // Enhanced game starting handler
    socket.on('gameStarting', (data) => {
      console.log('🚀 Game is starting!', data);
      setGameStarted(true);
      
      // Emit custom event for components to listen to
      window.dispatchEvent(new CustomEvent('gameStarting', { detail: data }));
    });

    socket.on('connect_error', (error) => {
      console.error('🔌 Socket connection error:', error);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Reconnected to server after', attemptNumber, 'attempts');
    });

    socket.on('reconnect_error', (error) => {
      console.error('🔄 Reconnection failed:', error);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinExperiment = (experimentId: string) => {
    if (socketRef.current && connected && !joinedExperimentsRef.current.has(experimentId)) {
      socketRef.current.emit('joinExperiment', experimentId);
      joinedExperimentsRef.current.add(experimentId);
      console.log('🏠 Joined experiment room:', experimentId);
    }
  };

  const joinGame = (gameId: string) => {
    if (socketRef.current && connected && !joinedGamesRef.current.has(gameId)) {
      socketRef.current.emit('joinGame', gameId);
      joinedGamesRef.current.add(gameId);
      console.log('🎮 Joined game room:', gameId);
    }
  };

  const submitDecision = (gameId: string, playerId: string, decision: Partial<GameState>) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('submitDecision', { gameId, playerId, decision });
      console.log('📤 Submitted decision:', { gameId, playerId, decision });
    } else {
      console.warn('⚠️ Cannot submit decision: socket not connected');
    }
  };

  const setParticipantReady = (experimentId: string, sessionId: string) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('participantReady', { experimentId, sessionId });
      console.log('✅ Marked participant ready:', { experimentId, sessionId: sessionId.slice(-8) });
    }
  };

  const sendHeartbeat = (experimentId: string, sessionId: string) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('heartbeat', { experimentId, sessionId });
    }
  };

  return {
    socket: socketRef.current,
    connected,
    gameState,
    participants,
    allParticipantsReady,
    gameStarted,
    experimentStatus,
    joinExperiment,
    joinGame,
    submitDecision,
    setParticipantReady,
    sendHeartbeat,
  };
};