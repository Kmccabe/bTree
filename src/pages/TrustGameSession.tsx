import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Clock, 
  DollarSign, 
  Send,
  Eye,
  ArrowRight,
  CheckCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
  Home,
  BarChart3,
  ArrowLeft,
  User,
  Hash,
  Wallet,
  Activity,
  Shield,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useAlgorand } from '../contexts/AlgorandContext';
import { useGameSocket } from '../hooks/useGameSocket';
import { gameAPI } from '../services/gameApi';
import toast from 'react-hot-toast';

type PlayerRole = 'A' | 'B';
type GamePhase = 'waiting' | 'playerA_decision' | 'playerB_decision' | 'round_complete' | 'game_complete';

interface TrustGameState {
  gameId: string;
  playerId: string;
  playerRole: PlayerRole;
  partnerId: string;
  sessionId: string;
  walletAddress: string;
  currentRound: number;
  totalRounds: number;
  phase: GamePhase;
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

const TrustGameSession: React.FC = () => {
  const { experimentId } = useParams();
  const [searchParams] = useSearchParams();
  const { isConnected, accountAddress } = useAlgorand();
  
  // Get parameters from URL
  const urlMultiplier = parseFloat(searchParams.get('multiplier') || '2');
  const urlIncrementSize = parseFloat(searchParams.get('incrementSize') || '0.1');
  const urlInitialEndowment = parseFloat(searchParams.get('initialEndowment') || '1');
  const participantId = searchParams.get('participantId') || 'unknown';
  const sessionId = searchParams.get('sessionId') || `session_${Date.now()}`;
  const walletAddress = searchParams.get('walletAddress') || accountAddress || 'unknown';
  const assignedRole = (searchParams.get('role') as PlayerRole) || 'A';
  
  // Use WebSocket hook for real-time communication
  const {
    socket,
    connected: socketConnected,
    gameState: liveGameState,
    joinGame,
    submitDecision
  } = useGameSocket();
  
  // Determine if this is a live experiment
  const isLiveExperiment = experimentId !== 'demo' && experimentId && !experimentId.startsWith('demo');
  
  console.log('TrustGameSession initialized:', {
    participantId,
    sessionId: sessionId.slice(-8),
    walletAddress: walletAddress.slice(-8),
    assignedRole,
    experimentId,
    isLiveExperiment,
    socketConnected
  });
  
  // Game state - use live state if available, otherwise fallback to local state
  const [localGameState, setLocalGameState] = useState<TrustGameState>({
    gameId: experimentId || 'trust-game-1',
    playerId: participantId,
    playerRole: assignedRole,
    partnerId: 'other-player',
    sessionId: sessionId,
    walletAddress: walletAddress,
    currentRound: 1,
    totalRounds: 1,
    phase: 'playerA_decision',
    initialEndowment: urlInitialEndowment,
    multiplier: urlMultiplier,
    incrementSize: Math.floor(urlIncrementSize * 1000000),
    playerA_sent: 0,
    playerB_received: 0,
    playerB_returned: 0,
    playerA_balance: Math.floor(urlInitialEndowment * 1000000),
    playerB_balance: Math.floor(urlInitialEndowment * 1000000),
    timeRemaining: 300,
    isAnonymous: true,
    lastUpdated: Date.now()
  });

  // Use live game state if available and connected, otherwise use local state
  const gameState = (isLiveExperiment && socketConnected && liveGameState) ? {
    ...liveGameState,
    playerId: participantId,
    playerRole: assignedRole,
    sessionId: sessionId,
    walletAddress: walletAddress
  } : localGameState;

  const [selectedAmount, setSelectedAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Join game room when socket connects (for live experiments)
  useEffect(() => {
    if (isLiveExperiment && socketConnected && experimentId) {
      console.log('Joining game room:', experimentId);
      joinGame(experimentId);
    }
  }, [isLiveExperiment, socketConnected, experimentId, joinGame]);

  // Update local game state when live state changes
  useEffect(() => {
    if (isLiveExperiment && liveGameState && liveGameState.lastUpdated > localGameState.lastUpdated) {
      console.log('Updating local state from live state:', liveGameState.phase);
      setLocalGameState(prev => ({
        ...liveGameState,
        playerId: prev.playerId,
        playerRole: prev.playerRole,
        sessionId: prev.sessionId,
        walletAddress: prev.walletAddress
      }));
    }
  }, [liveGameState, isLiveExperiment, localGameState.lastUpdated]);

  // Timer effect
  useEffect(() => {
    if (gameState.timeRemaining > 0 && gameState.phase !== 'round_complete' && gameState.phase !== 'game_complete') {
      const timer = setInterval(() => {
        if (isLiveExperiment && socketConnected) {
          // For live experiments, timer is managed by server
          return;
        }
        
        // For demo mode, manage timer locally
        setLocalGameState(prev => ({
          ...prev,
          timeRemaining: Math.max(0, prev.timeRemaining - 1)
        }));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState.timeRemaining, gameState.phase, isLiveExperiment, socketConnected]);

  // Convert microAlgos to ALGO for display
  const microAlgosToAlgo = (microAlgos: number): number => {
    return microAlgos / 1000000;
  };

  // Convert ALGO to microAlgos
  const algoToMicroAlgos = (algo: number): number => {
    return Math.floor(algo * 1000000);
  };

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate maximum sendable amount based on role
  const getMaxAmount = (): number => {
    if (gameState.playerRole === 'A') {
      return gameState.playerA_balance;
    } else {
      return gameState.playerB_received;
    }
  };

  // Generate increment options
  const generateIncrementOptions = (): number[] => {
    const maxAmount = getMaxAmount();
    const options: number[] = [];
    
    for (let amount = 0; amount <= maxAmount; amount += gameState.incrementSize) {
      options.push(amount);
    }
    
    return options;
  };

  // Handle amount selection
  const handleAmountChange = (amount: number) => {
    setSelectedAmount(amount);
    console.log('Amount selected:', {
      amount,
      amountInAlgo: microAlgosToAlgo(amount),
      maxAmount: getMaxAmount(),
      role: gameState.playerRole
    });
  };

  // Submit player decision
  const handleSubmitDecision = async () => {
    if (!isConnected || !accountAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isLiveExperiment && socketConnected) {
        // For live experiments, submit via WebSocket
        console.log('Submitting decision via WebSocket:', {
          gameId: gameState.gameId,
          playerId: gameState.playerId,
          role: gameState.playerRole,
          amount: selectedAmount
        });

        if (gameState.playerRole === 'A') {
          const multipliedAmount = selectedAmount * gameState.multiplier;
          const decision = {
            playerA_sent: selectedAmount,
            playerB_received: multipliedAmount,
            playerA_balance: gameState.playerA_balance - selectedAmount,
            playerB_balance: gameState.playerB_balance + multipliedAmount,
            phase: 'playerB_decision',
            timeRemaining: 300
          };
          
          submitDecision(gameState.gameId, gameState.playerId, decision);
          toast.success(`Sent ${microAlgosToAlgo(selectedAmount)} ALGO to Player B`);
          
        } else {
          const decision = {
            playerB_returned: selectedAmount,
            playerA_balance: gameState.playerA_balance + selectedAmount,
            playerB_balance: gameState.playerB_balance - selectedAmount,
            phase: 'round_complete',
            timeRemaining: 0
          };
          
          submitDecision(gameState.gameId, gameState.playerId, decision);
          toast.success(`Returned ${microAlgosToAlgo(selectedAmount)} ALGO to Player A`);
        }
        
      } else {
        // For demo mode, update local state
        console.log('Submitting decision locally (demo mode)');
        
        if (gameState.playerRole === 'A') {
          const multipliedAmount = selectedAmount * gameState.multiplier;
          
          setLocalGameState(prev => ({
            ...prev,
            playerA_sent: selectedAmount,
            playerB_received: multipliedAmount,
            playerA_balance: prev.playerA_balance - selectedAmount,
            playerB_balance: prev.playerB_balance + multipliedAmount,
            phase: 'playerB_decision',
            timeRemaining: 300,
            lastUpdated: Date.now()
          }));
          
          toast.success(`Sent ${microAlgosToAlgo(selectedAmount)} ALGO to Player B`);
          
        } else {
          setLocalGameState(prev => ({
            ...prev,
            playerB_returned: selectedAmount,
            playerA_balance: prev.playerA_balance + selectedAmount,
            playerB_balance: prev.playerB_balance - selectedAmount,
            phase: 'round_complete',
            timeRemaining: 0,
            lastUpdated: Date.now()
          }));
          
          toast.success(`Returned ${microAlgosToAlgo(selectedAmount)} ALGO to Player A`);
        }
      }
      
    } catch (error) {
      console.error('Error submitting decision:', error);
      toast.error('Failed to submit decision');
    } finally {
      setIsSubmitting(false);
      setSelectedAmount(0);
    }
  };

  // Handle manual role switching for demo
  const handleSwitchRole = () => {
    if (!isLiveExperiment) {
      const newRole = gameState.playerRole === 'A' ? 'B' : 'A';
      setLocalGameState(prev => ({
        ...prev,
        playerRole: newRole
      }));
      toast.info(`Switched to Player ${newRole} view`);
    }
  };

  // Check if it's this player's turn
  const isMyTurn = (): boolean => {
    return (gameState.phase === 'playerA_decision' && gameState.playerRole === 'A') ||
           (gameState.phase === 'playerB_decision' && gameState.playerRole === 'B');
  };

  // Enhanced participant identity display
  const renderParticipantIdentity = () => (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <h4 className="font-medium text-blue-900 mb-3 flex items-center">
        <User className="w-5 h-5 mr-2" />
        Your Participant Identity
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Hash className="w-4 h-4 text-blue-600" />
            <span className="text-blue-700">Player ID:</span>
            <code className="bg-blue-100 px-2 py-1 rounded text-blue-800">{gameState.playerId}</code>
          </div>
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <span className="text-blue-700">Session:</span>
            <code className="bg-blue-100 px-2 py-1 rounded text-blue-800">{gameState.sessionId.slice(-8)}</code>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Wallet className="w-4 h-4 text-blue-600" />
            <span className="text-blue-700">Wallet:</span>
            <code className="bg-blue-100 px-2 py-1 rounded text-blue-800">{gameState.walletAddress.slice(-8)}</code>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-blue-600" />
            <span className="text-blue-700">Role:</span>
            <span className={`px-2 py-1 rounded font-bold ${
              gameState.playerRole === 'A' 
                ? 'bg-primary-100 text-primary-700' 
                : 'bg-secondary-100 text-secondary-700'
            }`}>
              Player {gameState.playerRole} ({gameState.playerRole === 'A' ? 'Trustor' : 'Trustee'})
            </span>
          </div>
        </div>
      </div>
      
      {/* Connection Status */}
      <div className="mt-3 pt-3 border-t border-blue-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-blue-700">Connection:</span>
          <div className="flex items-center space-x-2">
            {isLiveExperiment ? (
              socketConnected ? (
                <span className="flex items-center space-x-1 text-green-600">
                  <Wifi className="w-4 h-4" />
                  <span>Live Connected</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 text-red-600">
                  <WifiOff className="w-4 h-4" />
                  <span>Disconnected</span>
                </span>
              )
            ) : (
              <span className="flex items-center space-x-1 text-blue-600">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Demo Mode</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Render Player A interface
  const renderPlayerAInterface = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Your Decision (Player A - Trustor)</h3>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary-600">{formatTime(gameState.timeRemaining)}</p>
            <p className="text-sm text-gray-500">Time remaining</p>
          </div>
        </div>

        {renderParticipantIdentity()}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Your Current Balance</h4>
            <p className="text-2xl font-bold text-blue-600">
              {microAlgosToAlgo(gameState.playerA_balance).toFixed(1)} ALGO
            </p>
            <p className="text-sm text-blue-700">
              ({gameState.playerA_balance.toLocaleString()} microAlgos)
            </p>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">Amount to Send</h4>
            <p className="text-2xl font-bold text-green-600">
              {microAlgosToAlgo(selectedAmount).toFixed(1)} ALGO
            </p>
            <p className="text-sm text-green-700">
              ({selectedAmount.toLocaleString()} microAlgos)
            </p>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select amount to send to Player B (increments of {microAlgosToAlgo(gameState.incrementSize).toFixed(1)} ALGO):
          </label>
          
          <div className="grid grid-cols-5 md:grid-cols-6 gap-2 max-h-64 overflow-y-auto">
            {generateIncrementOptions().map((amount) => (
              <button
                key={amount}
                onClick={() => handleAmountChange(amount)}
                className={`p-3 text-sm rounded-lg border-2 transition-all ${
                  selectedAmount === amount
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="font-medium">{microAlgosToAlgo(amount).toFixed(1)}</div>
                <div className="text-xs text-gray-500">ALGO</div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-yellow-900 mb-2">What happens next:</h4>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Your sent amount will be multiplied by {gameState.multiplier}x</li>
            <li>• Player B will receive {microAlgosToAlgo(selectedAmount * gameState.multiplier).toFixed(1)} ALGO</li>
            <li>• Player B will then decide how much to return to you</li>
            <li>• You will keep {microAlgosToAlgo(gameState.playerA_balance - selectedAmount).toFixed(1)} ALGO + whatever Player B returns</li>
          </ul>
        </div>

        <button
          onClick={handleSubmitDecision}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg hover:from-primary-700 hover:to-secondary-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
          <span>{isSubmitting ? 'Submitting...' : 'Send Amount'}</span>
        </button>
      </div>
    </div>
  );

  // Render Player B interface
  const renderPlayerBInterface = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Your Decision (Player B - Trustee)</h3>
          <div className="text-right">
            <p className="text-2xl font-bold text-secondary-600">{formatTime(gameState.timeRemaining)}</p>
            <p className="text-sm text-gray-500">Time remaining</p>
          </div>
        </div>

        {renderParticipantIdentity()}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">You Received</h4>
            <p className="text-xl font-bold text-blue-600">
              {microAlgosToAlgo(gameState.playerB_received).toFixed(1)} ALGO
            </p>
            <p className="text-xs text-blue-700">
              (Player A sent {microAlgosToAlgo(gameState.playerA_sent).toFixed(1)} × {gameState.multiplier})
            </p>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">Amount to Return</h4>
            <p className="text-xl font-bold text-green-600">
              {microAlgosToAlgo(selectedAmount).toFixed(1)} ALGO
            </p>
            <p className="text-xs text-green-700">
              ({selectedAmount.toLocaleString()} microAlgos)
            </p>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="font-medium text-purple-900 mb-2">You Keep</h4>
            <p className="text-xl font-bold text-purple-600">
              {microAlgosToAlgo(gameState.playerB_received - selectedAmount).toFixed(1)} ALGO
            </p>
            <p className="text-xs text-purple-700">
              (Received - Returned)
            </p>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select amount to return to Player A (increments of {microAlgosToAlgo(gameState.incrementSize).toFixed(1)} ALGO):
          </label>
          
          <div className="grid grid-cols-5 md:grid-cols-6 gap-2 max-h-64 overflow-y-auto">
            {generateIncrementOptions().map((amount) => (
              <button
                key={amount}
                onClick={() => handleAmountChange(amount)}
                className={`p-3 text-sm rounded-lg border-2 transition-all ${
                  selectedAmount === amount
                    ? 'border-secondary-500 bg-secondary-50 text-secondary-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="font-medium">{microAlgosToAlgo(amount).toFixed(1)}</div>
                <div className="text-xs text-gray-500">ALGO</div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-blue-900 mb-2">Summary:</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• Player A originally sent: {microAlgosToAlgo(gameState.playerA_sent).toFixed(1)} ALGO</p>
            <p>• You received (after {gameState.multiplier}x multiplier): {microAlgosToAlgo(gameState.playerB_received).toFixed(1)} ALGO</p>
            <p>• You will return: {microAlgosToAlgo(selectedAmount).toFixed(1)} ALGO</p>
            <p>• You will keep: {microAlgosToAlgo(gameState.playerB_received - selectedAmount).toFixed(1)} ALGO</p>
          </div>
        </div>

        <button
          onClick={handleSubmitDecision}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-secondary-600 to-accent-600 text-white rounded-lg hover:from-secondary-700 hover:to-accent-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
          <span>{isSubmitting ? 'Submitting...' : 'Return Amount'}</span>
        </button>
      </div>
    </div>
  );

  // Render waiting screen
  const renderWaitingScreen = (waitingFor: string) => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <Eye className="w-8 h-8 text-yellow-600" />
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Waiting for {waitingFor}</h3>
        <p className="text-gray-600 mb-6">
          Please wait while the other player makes their decision.
        </p>
        
        <div className="flex items-center justify-center space-x-2 text-yellow-600 mb-6">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Waiting...</span>
        </div>

        {renderParticipantIdentity()}

        {/* Enhanced Game State Debug Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center justify-center">
            <Activity className="w-5 h-5 mr-2" />
            Game State
          </h4>
          <div className="text-sm text-gray-700 space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p><span className="font-medium">Phase:</span> <code className="bg-gray-200 px-2 py-1 rounded">{gameState.phase}</code></p>
                <p><span className="font-medium">Player A sent:</span> {microAlgosToAlgo(gameState.playerA_sent).toFixed(1)} ALGO</p>
                <p><span className="font-medium">Player B received:</span> {microAlgosToAlgo(gameState.playerB_received).toFixed(1)} ALGO</p>
              </div>
              <div>
                <p><span className="font-medium">Player B returned:</span> {microAlgosToAlgo(gameState.playerB_returned).toFixed(1)} ALGO</p>
                <p><span className="font-medium">Last updated:</span> {new Date(gameState.lastUpdated).toLocaleTimeString()}</p>
                <p><span className="font-medium">Game ID:</span> <code className="bg-gray-200 px-1 py-0.5 rounded text-xs">{gameState.gameId}</code></p>
              </div>
            </div>
            
            {/* Connection Status */}
            <div className="pt-2 border-t border-gray-300">
              <p><span className="font-medium">Connection:</span> 
                {isLiveExperiment ? (
                  socketConnected ? (
                    <span className="text-green-600 ml-1">🟢 Live WebSocket</span>
                  ) : (
                    <span className="text-red-600 ml-1">🔴 Disconnected</span>
                  )
                ) : (
                  <span className="text-blue-600 ml-1">🔵 Demo Mode</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Demo mode: Allow manual role switching */}
        {!isLiveExperiment && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Demo Mode</h4>
            <p className="text-sm text-blue-800 mb-3">
              In a real experiment, you would wait for the other player. 
              For this demo, you can switch roles to see both perspectives.
            </p>
            <button
              onClick={handleSwitchRole}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Switch to Player {gameState.playerRole === 'A' ? 'B' : 'A'} View
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Render round complete screen
  const renderRoundComplete = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">
            {isLiveExperiment ? 'Experiment Complete!' : 'Round Complete!'}
          </h3>
          <p className="text-gray-600">
            {isLiveExperiment ? 
              'Thank you for participating in this research study.' :
              'Here are the results from this round:'
            }
          </p>
        </div>

        {renderParticipantIdentity()}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-primary-50 rounded-lg p-6">
            <h4 className="font-semibold text-primary-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Player A (Trustor) Results
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-primary-700">Started with:</span>
                <span className="font-medium">{microAlgosToAlgo(gameState.initialEndowment * 1000000).toFixed(1)} ALGO</span>
              </div>
              <div className="flex justify-between">
                <span className="text-primary-700">Sent to B:</span>
                <span className="font-medium">-{microAlgosToAlgo(gameState.playerA_sent).toFixed(1)} ALGO</span>
              </div>
              <div className="flex justify-between">
                <span className="text-primary-700">Received back:</span>
                <span className="font-medium">+{microAlgosToAlgo(gameState.playerB_returned).toFixed(1)} ALGO</span>
              </div>
              <div className="border-t border-primary-200 pt-2 flex justify-between">
                <span className="text-primary-900 font-semibold">Final balance:</span>
                <span className="font-bold text-primary-600">{microAlgosToAlgo(gameState.playerA_balance).toFixed(1)} ALGO</span>
              </div>
            </div>
          </div>

          <div className="bg-secondary-50 rounded-lg p-6">
            <h4 className="font-semibold text-secondary-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Player B (Trustee) Results
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-secondary-700">Started with:</span>
                <span className="font-medium">{microAlgosToAlgo(gameState.initialEndowment * 1000000).toFixed(1)} ALGO</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-700">Received from A:</span>
                <span className="font-medium">+{microAlgosToAlgo(gameState.playerB_received).toFixed(1)} ALGO</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-700">Returned to A:</span>
                <span className="font-medium">-{microAlgosToAlgo(gameState.playerB_returned).toFixed(1)} ALGO</span>
              </div>
              <div className="border-t border-secondary-200 pt-2 flex justify-between">
                <span className="text-secondary-900 font-semibold">Final balance:</span>
                <span className="font-bold text-secondary-600">{microAlgosToAlgo(gameState.playerB_balance).toFixed(1)} ALGO</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 text-center mb-6">
          <h5 className="font-medium text-gray-900 mb-2">Transaction Summary</h5>
          <div className="text-sm text-gray-700 space-y-1">
            <p>Player A sent {microAlgosToAlgo(gameState.playerA_sent).toFixed(1)} ALGO → multiplied to {microAlgosToAlgo(gameState.playerB_received).toFixed(1)} ALGO</p>
            <p>Player B returned {microAlgosToAlgo(gameState.playerB_returned).toFixed(1)} ALGO to Player A</p>
            <p className="font-medium">
              Total value created: {microAlgosToAlgo(gameState.playerA_balance + gameState.playerB_balance - (2 * gameState.initialEndowment * 1000000)).toFixed(1)} ALGO
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Home className="w-5 h-5" />
            <span>Return to Home</span>
          </Link>
          
          <Link
            to="/dashboard"
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors"
          >
            <BarChart3 className="w-5 h-5" />
            <span>View Dashboard</span>
          </Link>
          
          {!isLiveExperiment && (
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-secondary-600 to-accent-600 text-white rounded-lg hover:from-secondary-700 hover:to-accent-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Play Again</span>
            </button>
          )}
        </div>

        {isLiveExperiment && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">Experiment Complete</h4>
            <p className="text-sm text-green-800">
              Thank you for participating in this research study. Your responses have been recorded and will contribute to important research on trust and cooperation.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // Main render logic
  const renderGameContent = () => {
    if (!isConnected) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Wallet Required</h3>
          <p className="text-gray-600">Please connect your wallet to participate in the Trust Game.</p>
        </div>
      );
    }

    switch (gameState.phase) {
      case 'waiting':
        return renderWaitingScreen('game to start');
      
      case 'playerA_decision':
        if (gameState.playerRole === 'A') {
          return renderPlayerAInterface();
        } else {
          return renderWaitingScreen('Player A');
        }
      
      case 'playerB_decision':
        if (gameState.playerRole === 'B') {
          return renderPlayerBInterface();
        } else {
          return renderWaitingScreen('Player B');
        }
      
      case 'round_complete':
      case 'game_complete':
        return renderRoundComplete();
      
      default:
        return renderWaitingScreen('game state update');
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-6">
          <Link 
            to="/" 
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            {isLiveExperiment && (
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                socketConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {socketConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                <span className="text-sm">
                  {socketConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            )}
            
            <Link 
              to="/dashboard" 
              className="flex items-center space-x-2 px-4 py-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Trust Game</h1>
          <p className="text-gray-600">
            Round {gameState.currentRound} of {gameState.totalRounds} • 
            You are Player {gameState.playerRole} • 
            {gameState.isAnonymous ? 'Anonymous' : 'Identified'} Play
            {!isLiveExperiment && <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">Demo Mode</span>}
            {isLiveExperiment && <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded text-sm">Live Experiment</span>}
          </p>
          <div className="text-sm text-gray-500 mt-2">
            Multiplier: {gameState.multiplier}x • Increment: {microAlgosToAlgo(gameState.incrementSize).toFixed(1)} ALGO • 
            Session: {gameState.sessionId.slice(-8)} • {isLiveExperiment ? 'WebSocket Sync' : 'Local Demo'}
          </div>
        </div>

        {/* Game Status Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  gameState.phase === 'playerA_decision' ? 'bg-primary-500' : 
                  gameState.playerA_sent >= 0 && gameState.phase !== 'playerA_decision' ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                <span className="text-sm font-medium">Player A Decision</span>
              </div>
              
              <ArrowRight className="w-4 h-4 text-gray-400" />
              
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  gameState.phase === 'playerB_decision' ? 'bg-secondary-500' : 
                  gameState.playerB_returned >= 0 && gameState.phase === 'round_complete' ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                <span className="text-sm font-medium">Player B Decision</span>
              </div>
              
              <ArrowRight className="w-4 h-4 text-gray-400" />
              
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  gameState.phase === 'round_complete' ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                <span className="text-sm font-medium">Results</span>
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              {isMyTurn() ? '🟢 Your Turn' : '⏳ Waiting'}
            </div>
          </div>
        </div>

        {/* Connection Warning for Live Experiments */}
        {isLiveExperiment && !socketConnected && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="text-lg font-semibold text-red-900">Connection Lost</h3>
                <p className="text-red-800">
                  You've been disconnected from the game server. Game state updates may not sync properly. Please refresh the page to reconnect.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Game Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${gameState.phase}-${gameState.playerRole}-${gameState.sessionId}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderGameContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TrustGameSession;