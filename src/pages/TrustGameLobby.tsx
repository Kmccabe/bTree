import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  Clock, 
  DollarSign, 
  CheckCircle,
  Eye,
  ArrowLeft,
  Home,
  BarChart3,
  BookOpen,
  Play,
  Loader2,
  AlertCircle,
  RefreshCw,
  UserPlus,
  Wallet,
  Wifi,
  WifiOff,
  Shield,
  Lock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAlgorand } from '../contexts/AlgorandContext';
import { useGameSocket } from '../hooks/useGameSocket';
import { gameAPI } from '../services/gameApi';
import MarkdownRenderer from '../components/MarkdownRenderer';
import toast from 'react-hot-toast';

interface TrustGameLobbyState {
  experimentId: string;
  totalParticipants: number;
  hasReadInstructions: boolean;
  gameStarted: boolean;
  currentParticipant?: any;
  gameParameters: {
    initialEndowment: number;
    multiplier: number;
    rounds: number;
    incrementSize: number;
    timePerDecision: number;
    roleAssignment: 'random' | 'fixed';
    showHistory: boolean;
    anonymity: boolean;
  };
}

const TrustGameLobby: React.FC = () => {
  const { experimentId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isConnected, connectWallet, accountAddress } = useAlgorand();
  
  // Generate unique session ID for this browser tab - this is crucial for same-wallet multi-tab support
  const [sessionId] = useState(() => {
    const tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('Generated unique session ID for this tab:', tabId);
    return tabId;
  });
  
  // Use WebSocket hook
  const {
    connected: socketConnected,
    participants,
    allParticipantsReady,
    joinExperiment,
    setParticipantReady,
    sendHeartbeat
  } = useGameSocket();
  
  const [lobbyState, setLobbyState] = useState<TrustGameLobbyState>({
    experimentId: experimentId || 'trust-game-lobby',
    totalParticipants: parseInt(searchParams.get('maxParticipants') || '2'),
    hasReadInstructions: false,
    gameStarted: false,
    gameParameters: {
      initialEndowment: parseFloat(searchParams.get('initialEndowment') || '1'),
      multiplier: parseFloat(searchParams.get('multiplier') || '2'),
      rounds: parseInt(searchParams.get('rounds') || '1'),
      incrementSize: parseFloat(searchParams.get('incrementSize') || '0.1'),
      timePerDecision: parseInt(searchParams.get('timePerDecision') || '300'),
      roleAssignment: (searchParams.get('roleAssignment') as 'random' | 'fixed') || 'random',
      showHistory: searchParams.get('showHistory') === 'true',
      anonymity: searchParams.get('anonymity') !== 'false'
    }
  });

  const [currentStep, setCurrentStep] = useState<'wallet' | 'instructions' | 'waiting' | 'starting'>('wallet');
  const [isDemo, setIsDemo] = useState(false);

  // CRITICAL: Force wallet connection check on mount and when connection status changes
  useEffect(() => {
    console.log('🔒 WALLET CONNECTION CHECK:', {
      isConnected,
      accountAddress,
      currentStep,
      experimentId
    });

    if (!isConnected || !accountAddress) {
      console.log('🔒 FORCING WALLET CONNECTION - User not connected');
      setCurrentStep('wallet');
      setLobbyState(prev => ({
        ...prev,
        hasReadInstructions: false,
        gameStarted: false
      }));
    } else if (currentStep === 'wallet') {
      console.log('🔒 WALLET CONNECTED - Proceeding to instructions');
      setCurrentStep('instructions');
    }
  }, [isConnected, accountAddress]);

  // Check if this is a demo or if server is available
  useEffect(() => {
    const checkIfDemo = experimentId === 'demo' || !socketConnected;
    setIsDemo(checkIfDemo);
  }, [experimentId, socketConnected]);

  // Join experiment room when socket connects (only for non-demo)
  useEffect(() => {
    if (socketConnected && experimentId && !isDemo && isConnected && accountAddress) {
      console.log('Joining experiment room:', experimentId);
      joinExperiment(experimentId);
    }
  }, [socketConnected, experimentId, joinExperiment, isDemo, isConnected, accountAddress]);

  // Send periodic heartbeat (only for non-demo)
  useEffect(() => {
    if (socketConnected && lobbyState.hasReadInstructions && experimentId && !isDemo && isConnected && accountAddress) {
      const interval = setInterval(() => {
        sendHeartbeat(experimentId, sessionId);
      }, 30000); // Every 30 seconds

      return () => clearInterval(interval);
    }
  }, [socketConnected, lobbyState.hasReadInstructions, experimentId, sessionId, sendHeartbeat, isDemo, isConnected, accountAddress]);

  // Auto-start game when all participants are ready (only for non-demo)
  useEffect(() => {
    if (!isDemo && allParticipantsReady && !lobbyState.gameStarted && currentStep === 'waiting') {
      console.log('All participants ready, starting game...');
      setCurrentStep('starting');
      
      setTimeout(() => {
        startTrustGame();
      }, 3000);
    }
  }, [allParticipantsReady, lobbyState.gameStarted, currentStep, isDemo]);

  // Demo mode: simulate other participants joining
  useEffect(() => {
    if (isDemo && lobbyState.hasReadInstructions && currentStep === 'waiting') {
      // Simulate waiting for other participants in demo mode
      const timer = setTimeout(() => {
        setCurrentStep('starting');
        setTimeout(() => {
          startTrustGame();
        }, 2000);
      }, 3000); // Wait 3 seconds in demo mode

      return () => clearTimeout(timer);
    }
  }, [isDemo, lobbyState.hasReadInstructions, currentStep]);

  const startTrustGame = () => {
    // For same-wallet multi-tab support, we need to ensure each tab gets a unique role
    // The role should be determined by the participant's position in the experiment
    let assignedRole: 'A' | 'B';
    
    if (isDemo) {
      // In demo mode, assign role randomly
      assignedRole = Math.random() < 0.5 ? 'A' : 'B';
    } else {
      // In real mode, assign role based on participant number
      const currentParticipant = lobbyState.currentParticipant;
      if (currentParticipant) {
        // Assign roles based on participant number: odd = A, even = B
        assignedRole = currentParticipant.participantNumber % 2 === 1 ? 'A' : 'B';
        console.log(`Assigning role ${assignedRole} to participant ${currentParticipant.participantNumber} (${currentParticipant.id})`);
      } else {
        // Fallback to random assignment
        assignedRole = Math.random() < 0.5 ? 'A' : 'B';
      }
    }
    
    // Create game session parameters with unique participant identification
    const gameParams = new URLSearchParams({
      role: assignedRole,
      multiplier: lobbyState.gameParameters.multiplier.toString(),
      incrementSize: lobbyState.gameParameters.incrementSize.toString(),
      initialEndowment: lobbyState.gameParameters.initialEndowment.toString(),
      rounds: lobbyState.gameParameters.rounds.toString(),
      timePerDecision: lobbyState.gameParameters.timePerDecision.toString(),
      roleAssignment: lobbyState.gameParameters.roleAssignment,
      showHistory: lobbyState.gameParameters.showHistory.toString(),
      anonymity: lobbyState.gameParameters.anonymity.toString(),
      participantId: lobbyState.currentParticipant?.id || `demo_${sessionId.slice(-8)}`,
      sessionId: sessionId, // Include session ID for unique identification
      walletAddress: accountAddress || 'demo'
    });
    
    toast.success(`Game starting! You are Player ${assignedRole}`);
    navigate(`/trust-game/${experimentId}?${gameParams.toString()}`);
  };

  const handleFinishReading = async () => {
    // CRITICAL: Double-check wallet connection before proceeding
    if (!isConnected || !accountAddress) {
      console.log('🔒 BLOCKING INSTRUCTION COMPLETION - Wallet not connected');
      toast.error('Please connect your wallet first');
      setCurrentStep('wallet');
      return;
    }
    
    try {
      if (isDemo) {
        // Demo mode: skip API calls
        const mockParticipant = {
          id: `demo_${sessionId.slice(-8)}`,
          sessionId,
          walletAddress: accountAddress,
          participantNumber: 1,
          joinedAt: Date.now(),
          isReady: true,
          lastSeen: Date.now()
        };
        
        setLobbyState(prev => ({
          ...prev,
          hasReadInstructions: true,
          currentParticipant: mockParticipant
        }));
        
        setCurrentStep('waiting');
        toast.success('Instructions read! Starting demo...');
        
      } else {
        // Real experiment mode: try API calls
        if (!socketConnected) {
          toast.error('Not connected to game server. Please refresh the page.');
          return;
        }
        
        console.log('Joining experiment with session ID:', sessionId);
        
        // Join experiment via API - the server should handle same wallet, different sessions
        const { participant } = await gameAPI.joinExperiment(
          experimentId!,
          accountAddress,
          sessionId // This is the key - unique session ID per tab
        );
        
        console.log('Joined as participant:', participant);
        
        setLobbyState(prev => ({
          ...prev,
          hasReadInstructions: true,
          currentParticipant: participant
        }));
        
        // Set participant as ready via WebSocket
        setParticipantReady(experimentId!, sessionId);
        
        setCurrentStep('waiting');
        toast.success(`Instructions read! You are participant ${participant.participantNumber}`);
      }
      
    } catch (error) {
      console.error('Error finishing reading:', error);
      
      // Fallback to demo mode if API fails
      console.log('API failed, falling back to demo mode');
      setIsDemo(true);
      
      const mockParticipant = {
        id: `demo_${sessionId.slice(-8)}`,
        sessionId,
        walletAddress: accountAddress,
        participantNumber: 1,
        joinedAt: Date.now(),
        isReady: true,
        lastSeen: Date.now()
      };
      
      setLobbyState(prev => ({
        ...prev,
        hasReadInstructions: true,
        currentParticipant: mockParticipant
      }));
      
      setCurrentStep('waiting');
      toast.success('Instructions read! Starting demo mode...');
    }
  };

  const generateInstructions = () => {
    const params = lobbyState.gameParameters;
    const isOneRound = params.rounds === 1;
    
    return `# Welcome to the Trust Game Experiment!

## Overview
This experiment studies trust and reciprocity between participants. You will be ${isOneRound ? 'paired with another participant for a single round' : `randomly paired with another participant for ${params.rounds} rounds`}.

## Roles
- **Player A (Trustor)**: Decides how much to send to Player B
- **Player B (Trustee)**: Receives the multiplied amount and decides how much to return

## How ${isOneRound ? 'the Round Works' : 'Each Round Works'}

### 1. Initial Endowment
Both players start with **${params.initialEndowment} ALGO** ${isOneRound ? '' : 'each round'}

### 2. Player A's Decision
- Player A can send any amount (0 to ${params.initialEndowment} ALGO) to Player B in increments of **${params.incrementSize} ALGO**
- The amount sent is multiplied by **${params.multiplier}**
- Player A keeps: ${params.initialEndowment} ALGO - amount sent
- Time limit: **${Math.floor(params.timePerDecision / 60)} minutes**

### 3. Player B's Decision
- Player B receives: (amount sent by A) × **${params.multiplier}**
- Player B decides how much to return to Player A (0 to full received amount) in increments of **${params.incrementSize} ALGO**
- Player B keeps: received amount - amount returned
- Time limit: **${Math.floor(params.timePerDecision / 60)} minutes**

## Example ${isOneRound ? 'Round' : 'Round'}

- Both players start with **${params.initialEndowment} ALGO**
- Player A sends **${params.incrementSize * 5} ALGO** to Player B
- Player B receives: ${params.incrementSize * 5} × ${params.multiplier} = **${params.incrementSize * 5 * params.multiplier} ALGO**
- Player B returns **${params.incrementSize * 6} ALGO** to Player A

### Final Payoffs
- **Player A**: ${params.initialEndowment - (params.incrementSize * 5) + (params.incrementSize * 6)} = **${params.initialEndowment + params.incrementSize} ALGO**
- **Player B**: ${params.initialEndowment + (params.incrementSize * 5 * params.multiplier) - (params.incrementSize * 6)} = **${params.initialEndowment + (params.incrementSize * 5 * params.multiplier) - (params.incrementSize * 6)} ALGO**

## Important Notes

${isOneRound ? 
  '- This is a **single-round** interaction' : 
  `- You will play **${params.rounds} rounds** with the same partner`
}
- ${params.roleAssignment === 'random' ? 'Roles may **switch randomly** each round' : 'Your role **remains the same** throughout'}
- ${params.anonymity ? 'All interactions are **anonymous**' : 'You will know your partner\'s identity'}
- ${params.showHistory ? 'You **can see** the history of previous rounds' : '**No history** is shown between rounds'}
- Decision increments: **${params.incrementSize} ALGO**
- Time per decision: **${Math.floor(params.timePerDecision / 60)} minutes**
- Your ${isOneRound ? 'earnings from this round' : 'total earnings across all rounds'} will be **paid to your wallet**

## Multi-Tab Support

- **Same wallet, different participants**: You can open multiple tabs with the same wallet
- **Each tab gets a unique participant ID** and role assignment
- **Real-time synchronization**: All tabs stay synchronized during the game
- **Independent decisions**: Each tab makes decisions independently

## Strategy Tips

${isOneRound ? 
  `- Consider the **one-shot nature** of this interaction
- Think about what you would expect from your partner
- Remember that **cooperation can benefit both players**` :
  `- Consider both **immediate gains** and **long-term cooperation**
- Think about how your actions might influence your partner's future decisions
- Remember that **mutual cooperation** often leads to higher total payoffs`
}

## Waiting Process

- You must **read these instructions carefully**
- Click **"I Have Read the Instructions"** when ready
- Wait for **all participants** to finish reading
- The game will **start automatically** when everyone is ready

**Good luck!**`;
  };

  // CRITICAL: Wallet connection step - must be completed first
  const renderWalletConnection = () => (
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
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
            socketConnected ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {socketConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            <span className="text-sm">
              {socketConnected ? 'Connected' : isDemo ? 'Demo Mode' : 'Disconnected'}
            </span>
          </div>
          
          <Link 
            to="/dashboard" 
            className="flex items-center space-x-2 px-4 py-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Wallet Required</h1>
          <p className="text-gray-600 mb-4">You must connect your Algorand wallet to participate in this experiment</p>
          {isDemo && (
            <div className="mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm inline-block">
              Demo Mode Available
            </div>
          )}
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
          <div className="flex items-start space-x-3">
            <Shield className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-red-900 mb-2">🔒 Security & Participation Requirements</h4>
              <ul className="text-sm text-red-800 space-y-2">
                <li>• <strong>Wallet connection is mandatory</strong> for all experiment participation</li>
                <li>• Your wallet will be used to receive experiment earnings</li>
                <li>• <strong>No personal information</strong> is collected - only your wallet address</li>
                <li>• You can use the <strong>same wallet across multiple browser tabs</strong> for different participant roles</li>
                <li>• All transactions are recorded on the Algorand blockchain for transparency</li>
                <li>• <strong>You cannot proceed without connecting your wallet</strong></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center p-4 bg-primary-50 rounded-lg">
            <DollarSign className="w-8 h-8 text-primary-600 mx-auto mb-2" />
            <p className="font-semibold text-primary-900">Potential Earnings</p>
            <p className="text-primary-700">Up to {lobbyState.gameParameters.initialEndowment * lobbyState.gameParameters.multiplier} ALGO</p>
          </div>
          <div className="text-center p-4 bg-secondary-50 rounded-lg">
            <Clock className="w-8 h-8 text-secondary-600 mx-auto mb-2" />
            <p className="font-semibold text-secondary-900">Time Commitment</p>
            <p className="text-secondary-700">~{Math.floor(lobbyState.gameParameters.timePerDecision / 60)} minutes</p>
          </div>
          <div className="text-center p-4 bg-accent-50 rounded-lg">
            <Users className="w-8 h-8 text-accent-600 mx-auto mb-2" />
            <p className="font-semibold text-accent-900">Participants</p>
            <p className="text-accent-700">{lobbyState.totalParticipants} players</p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-yellow-900 mb-1">Why Wallet Connection is Required</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• <strong>Automatic payments:</strong> Your earnings are sent directly to your wallet</li>
                <li>• <strong>Unique identification:</strong> Each browser tab gets a unique participant ID</li>
                <li>• <strong>Blockchain transparency:</strong> All transactions are publicly verifiable</li>
                <li>• <strong>No manual payment processing:</strong> Eliminates delays and errors</li>
                <li>• <strong>Research integrity:</strong> Ensures authentic participation</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={connectWallet}
            className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl hover:from-primary-700 hover:to-secondary-700 transition-all duration-200 shadow-lg hover:shadow-xl mx-auto text-lg font-semibold"
          >
            <Wallet className="w-6 h-6" />
            <span>Connect Algorand Wallet</span>
          </button>
          
          <p className="text-sm text-gray-500 mt-4">
            Supports Pera Wallet and other Algorand-compatible wallets
          </p>
          
          <div className="mt-6 text-xs text-gray-400">
            Session ID: {sessionId.slice(-8)} • Unique tab identifier
          </div>
        </div>
      </motion.div>
    </div>
  );

  const renderInstructions = () => (
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
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
            socketConnected ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {socketConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            <span className="text-sm">
              {socketConnected ? 'Connected' : isDemo ? 'Demo Mode' : 'Disconnected'}
            </span>
          </div>
          
          {/* Wallet Status Indicator */}
          <div className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Wallet Connected</span>
          </div>
          
          <Link 
            to="/dashboard" 
            className="flex items-center space-x-2 px-4 py-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Trust Game Experiment</h1>
          <p className="text-gray-600">Please read the instructions carefully before participating</p>
          {isDemo && (
            <div className="mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm inline-block">
              Demo Mode
            </div>
          )}
          <div className="mt-2 text-sm text-gray-500">
            Session ID: {sessionId.slice(-8)} • Tab-specific participant • Wallet: {accountAddress?.slice(-8)}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center p-4 bg-primary-50 rounded-lg">
            <DollarSign className="w-8 h-8 text-primary-600 mx-auto mb-2" />
            <p className="font-semibold text-primary-900">Initial Endowment</p>
            <p className="text-primary-700">{lobbyState.gameParameters.initialEndowment} ALGO</p>
          </div>
          <div className="text-center p-4 bg-secondary-50 rounded-lg">
            <Clock className="w-8 h-8 text-secondary-600 mx-auto mb-2" />
            <p className="font-semibold text-secondary-900">Time Per Decision</p>
            <p className="text-secondary-700">{Math.floor(lobbyState.gameParameters.timePerDecision / 60)} minutes</p>
          </div>
          <div className="text-center p-4 bg-accent-50 rounded-lg">
            <Users className="w-8 h-8 text-accent-600 mx-auto mb-2" />
            <p className="font-semibold text-accent-900">Participants</p>
            <p className="text-accent-700">{lobbyState.totalParticipants} players</p>
          </div>
        </div>

        {isDemo && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <Play className="w-5 h-5 text-blue-600" />
              <div>
                <h4 className="font-medium text-blue-900">Demo Mode Active</h4>
                <p className="text-sm text-blue-800">
                  This is a demonstration version. You can play both roles to understand the game mechanics.
                  {!socketConnected && ' (Server not available - running in offline demo mode)'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-50 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BookOpen className="w-5 h-5 mr-2" />
            Experiment Instructions
          </h3>
          <div className="bg-white rounded-lg p-4 border border-gray-200 max-h-96 overflow-y-auto">
            <MarkdownRenderer content={generateInstructions()} />
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-yellow-900 mb-1">Important Reminders</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Please read all instructions carefully before proceeding</li>
                <li>• You must wait for all participants to finish reading</li>
                <li>• Once the game starts, you cannot return to these instructions</li>
                <li>• Make sure you understand the rules and payment structure</li>
                <li>• Your role (A or B) will be assigned when the game starts</li>
                <li>• Each browser tab gets a unique participant ID (same wallet OK)</li>
                {!isDemo && <li>• This experiment works across different computers and browsers</li>}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-blue-600">
            <BookOpen className="w-5 h-5" />
            <span className="text-sm">Take your time to read and understand the instructions</span>
          </div>
          
          <button
            onClick={handleFinishReading}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg hover:from-primary-700 hover:to-secondary-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <CheckCircle className="w-5 h-5" />
            <span>I Have Read the Instructions</span>
          </button>
        </div>
      </motion.div>
    </div>
  );

  const renderWaiting = () => (
    <div className="max-w-4xl mx-auto">
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-6">
        <Link 
          to="/" 
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>Exit to Home</span>
        </Link>
        
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900">Trust Game Experiment</h2>
          <p className="text-sm text-gray-500">
            {isDemo ? 'Demo mode - starting soon' : 'Waiting for all participants'}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
            socketConnected ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {socketConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            <span className="text-sm">
              {socketConnected ? 'Connected' : isDemo ? 'Demo' : 'Disconnected'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Wallet OK</span>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center"
      >
        <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <Eye className="w-8 h-8 text-yellow-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {isDemo ? 'Preparing Demo' : 'Waiting for Other Participants'}
        </h1>
        <p className="text-gray-600 mb-8">
          {isDemo ? 
            'Setting up the trust game demonstration. You will be able to play both roles to understand the mechanics.' :
            'Please wait while other participants finish reading the instructions. The trust game will begin automatically once everyone is ready.'
          }
        </p>

        {/* Current Participant Info */}
        {lobbyState.currentParticipant && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-900 mb-2">Your Participant Info</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>ID: {lobbyState.currentParticipant.id}</p>
              <p>Number: P{lobbyState.currentParticipant.participantNumber.toString().padStart(3, '0')}</p>
              <p>Session: {sessionId.slice(-8)}</p>
              <p>Wallet: {lobbyState.currentParticipant.walletAddress.slice(-8)}</p>
              <p className="font-medium text-blue-900">
                Assigned Role: Player {lobbyState.currentParticipant.participantNumber % 2 === 1 ? 'A' : 'B'}
              </p>
            </div>
          </div>
        )}

        {/* Participant Status */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {isDemo ? 'Demo Status' : 'Participant Status'}
          </h3>
          
          {isDemo ? (
            <div className="flex items-center justify-center space-x-2 text-blue-600 mb-4">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-lg font-medium">Preparing demo session...</span>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600">{participants.length}</div>
                  <div className="text-sm text-gray-500">Joined</div>
                </div>
                <div className="text-2xl text-gray-400">/</div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-400">{lobbyState.totalParticipants}</div>
                  <div className="text-sm text-gray-500">Total</div>
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div 
                  className="bg-primary-600 h-3 rounded-full transition-all duration-500" 
                  style={{ width: `${(participants.length / lobbyState.totalParticipants) * 100}%` }}
                />
              </div>

              {/* Participant Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {Array.from({ length: lobbyState.totalParticipants }, (_, i) => {
                  const participant = participants[i];
                  return (
                    <div
                      key={i}
                      className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm font-medium transition-all ${
                        participant
                          ? participant.isReady
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {participant ? (
                        <>
                          {participant.isReady ? (
                            <CheckCircle className="w-6 h-6 mb-1" />
                          ) : (
                            <Clock className="w-6 h-6 mb-1" />
                          )}
                          <span className="text-xs">P{participant.participantNumber.toString().padStart(3, '0')}</span>
                          <span className="text-xs text-gray-500">
                            {participant.participantNumber % 2 === 1 ? 'A' : 'B'}
                          </span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-6 h-6 mb-1" />
                          <span className="text-xs">Waiting</span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Detailed Participant List */}
              {participants.length > 0 && (
                <div className="text-left">
                  <h4 className="font-medium text-gray-900 mb-2">Participants:</h4>
                  <div className="space-y-2">
                    {participants.map((participant) => (
                      <div key={participant.id} className="flex items-center justify-between text-sm bg-white p-2 rounded">
                        <span className="font-mono">
                          P{participant.participantNumber.toString().padStart(3, '0')}_...{participant.id.slice(-8)}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {participant.walletAddress.slice(-6)}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            participant.participantNumber % 2 === 1 
                              ? 'bg-primary-100 text-primary-700' 
                              : 'bg-secondary-100 text-secondary-700'
                          }`}>
                            {participant.participantNumber % 2 === 1 ? 'Player A' : 'Player B'}
                          </span>
                          {participant.isReady ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Clock className="w-4 h-4 text-yellow-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {!isDemo && allParticipantsReady && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4"
          >
            <div className="flex items-center justify-center space-x-2 text-green-600 mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">All participants are ready!</span>
            </div>
            <p className="text-sm text-green-700">Assigning roles and starting the trust game...</p>
          </motion.div>
        )}

        <div className="text-sm text-gray-500 mt-6">
          {isDemo ? 
            'Demo will start automatically in a moment.' :
            'You can safely wait here. The page will automatically advance when ready.'
          }
        </div>
      </motion.div>
    </div>
  );

  const renderStarting = () => (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center"
      >
        <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <Play className="w-8 h-8 text-green-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Starting Trust Game</h1>
        <p className="text-gray-600 mb-8">
          {isDemo ? 
            'Preparing your demo session. You will be able to experience both player roles.' :
            'All participants are ready! Assigning roles and preparing the game session...'
          }
        </p>

        <div className="flex items-center justify-center space-x-2 text-green-600 mb-6">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-lg font-medium">Initializing game...</span>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Game Configuration</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• Initial endowment: {lobbyState.gameParameters.initialEndowment} ALGO per player</p>
            <p>• Multiplier: {lobbyState.gameParameters.multiplier}x</p>
            <p>• Rounds: {lobbyState.gameParameters.rounds}</p>
            <p>• Decision increments: {lobbyState.gameParameters.incrementSize} ALGO</p>
            <p>• Time per decision: {Math.floor(lobbyState.gameParameters.timePerDecision / 60)} minutes</p>
            <p>• Session ID: {sessionId.slice(-8)}</p>
            <p>• Wallet: {accountAddress?.slice(-8)}</p>
            {isDemo && <p>• Mode: Interactive demonstration</p>}
          </div>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      {currentStep === 'wallet' && renderWalletConnection()}
      {currentStep === 'instructions' && renderInstructions()}
      {currentStep === 'waiting' && renderWaiting()}
      {currentStep === 'starting' && renderStarting()}
    </div>
  );
};

export default TrustGameLobby;