import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Clock, 
  DollarSign, 
  Play, 
  Pause, 
  BarChart3,
  MessageCircle,
  Settings,
  Download,
  ArrowLeft,
  ExternalLink,
  Copy,
  CheckCircle,
  Send,
  Calculator,
  CreditCard,
  Wallet,
  Activity,
  RefreshCw,
  Wifi,
  WifiOff,
  Eye,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import PaymentTransactionForm from '../components/PaymentTransactionForm';
import { useGameSocket } from '../hooks/useGameSocket';

interface Participant {
  id: string;
  walletAddress: string;
  displayName: string;
  earnings: number;
  participantNumber: number;
  sessionId?: string;
  experimentRole?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transactionId?: string;
  error?: string;
  lastUpdated: number;
  isReady?: boolean;
  joinedAt?: number;
  lastSeen?: number;
  gameResults?: {
    role: 'A' | 'B';
    initialBalance: number;
    amountSent?: number;
    amountReceived?: number;
    amountReturned?: number;
    finalBalance: number;
  };
}

interface GameSession {
  gameId: string;
  gameState: {
    gameId: string;
    currentRound: number;
    totalRounds: number;
    phase: string;
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
  };
  participants: {
    playerA?: {
      sessionId: string;
      walletAddress: string;
      playerId: string;
      displayName?: string;
    };
    playerB?: {
      sessionId: string;
      walletAddress: string;
      playerId: string;
      displayName?: string;
    };
  };
  createdAt: number;
  lastUpdated: number;
}

const ExperimentSession: React.FC = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [isRunning, setIsRunning] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(1200); // 20 minutes in seconds
  const [participantLink, setParticipantLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [participantEarnings, setParticipantEarnings] = useState<Participant[]>([]);
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [experimentCompleted, setExperimentCompleted] = useState(false);

  // CRITICAL: Use WebSocket hook for real-time participant tracking
  const {
    socket,
    connected: socketConnected,
    participants: liveParticipants,
    allParticipantsReady,
    gameStarted,
    experimentStatus,
    joinExperiment
  } = useGameSocket();

  // Get experiment type from URL parameters or default to the experiment ID pattern
  const experimentType = searchParams.get('type') || 'public-goods';
  const experimentTitle = searchParams.get('title') || 'Live Experiment Session';

  // Mock real-time data
  const [sessionData, setSessionData] = useState({
    totalContributions: 234,
    averageContribution: 13.2,
    efficiency: 78.5,
    recentActions: [
      { id: 'action_1', participant: 'P001', action: 'Contributed 15 ALGO', time: '12:34:56' },
      { id: 'action_2', participant: 'P005', action: 'Contributed 8 ALGO', time: '12:34:45' },
      { id: 'action_3', participant: 'P012', action: 'Contributed 20 ALGO', time: '12:34:32' },
      { id: 'action_4', participant: 'P008', action: 'Contributed 12 ALGO', time: '12:34:18' },
    ]
  });

  // CRITICAL: Join experiment room for real-time updates
  useEffect(() => {
    if (socketConnected && id && experimentType === 'trust') {
      console.log('🎯 EXPERIMENT MANAGER: Joining experiment room for real-time tracking:', id);
      joinExperiment(id);
    }
  }, [socketConnected, id, experimentType, joinExperiment]);

  // CRITICAL: Listen for experiment results updates
  useEffect(() => {
    if (!socket) return;

    const handleExperimentResultsUpdate = (data: any) => {
      console.log('🎯 EXPERIMENT RESULTS UPDATE RECEIVED:', data);
      
      if (data.experiment && data.participants) {
        // Update participant earnings with the final results
        setParticipantEarnings(data.participants.map((p: any) => ({
          id: p.id,
          walletAddress: p.walletAddress,
          displayName: p.displayName || `P${p.participantNumber.toString().padStart(3, '0')}`,
          earnings: p.earnings || 0,
          participantNumber: p.participantNumber,
          sessionId: p.sessionId,
          experimentRole: p.experimentRole || `Player ${p.participantNumber % 2 === 1 ? 'A (Trustor)' : 'B (Trustee)'}`,
          status: 'pending',
          lastUpdated: Date.now(),
          isReady: p.isReady,
          joinedAt: p.joinedAt,
          lastSeen: p.lastSeen,
          gameResults: p.gameResults
        })));

        // Mark experiment as completed
        setExperimentCompleted(true);

        // Update session data with game results
        if (data.gameResults) {
          setSessionData(prev => ({
            ...prev,
            totalContributions: data.gameResults.playerA_sent + data.gameResults.playerB_returned,
            averageContribution: (data.gameResults.playerA_sent + data.gameResults.playerB_returned) / 2,
            efficiency: data.gameResults.efficiency,
            recentActions: [
              { id: 'result_1', participant: 'Player A', action: `Sent ${data.gameResults.playerA_sent.toFixed(3)} ALGO`, time: new Date().toLocaleTimeString() },
              { id: 'result_2', participant: 'Player B', action: `Received ${data.gameResults.playerB_received.toFixed(3)} ALGO`, time: new Date().toLocaleTimeString() },
              { id: 'result_3', participant: 'Player B', action: `Returned ${data.gameResults.playerB_returned.toFixed(3)} ALGO`, time: new Date().toLocaleTimeString() },
              { id: 'result_4', participant: 'System', action: 'Experiment completed', time: new Date().toLocaleTimeString() },
            ]
          }));
        }

        toast.success('Experiment completed! Results are now available for payment processing.');
      }
    };

    socket.on('experimentResultsUpdate', handleExperimentResultsUpdate);

    return () => {
      socket.off('experimentResultsUpdate', handleExperimentResultsUpdate);
    };
  }, [socket]);

  // CRITICAL: Update participant list when live participants change
  useEffect(() => {
    if (experimentType === 'trust' && liveParticipants && liveParticipants.length > 0 && !experimentCompleted) {
      console.log('🎯 EXPERIMENT MANAGER: Updating participant list from live data:', liveParticipants);
      
      // Convert live participants to earnings format
      const updatedParticipants: Participant[] = liveParticipants.map((liveParticipant, index) => {
        // Try to find existing participant data to preserve earnings
        const existingParticipant = participantEarnings.find(p => 
          p.id === liveParticipant.id || 
          p.sessionId === liveParticipant.sessionId ||
          p.walletAddress === liveParticipant.walletAddress
        );

        return {
          id: liveParticipant.id,
          walletAddress: liveParticipant.walletAddress,
          displayName: liveParticipant.displayName || `P${liveParticipant.participantNumber.toString().padStart(3, '0')}`,
          earnings: existingParticipant?.earnings || 0, // Preserve existing earnings or default to 0
          participantNumber: liveParticipant.participantNumber,
          sessionId: liveParticipant.sessionId,
          experimentRole: `Player ${liveParticipant.participantNumber % 2 === 1 ? 'A (Trustor)' : 'B (Trustee)'}`,
          status: existingParticipant?.status || 'pending',
          transactionId: existingParticipant?.transactionId,
          error: existingParticipant?.error,
          lastUpdated: liveParticipant.lastSeen || Date.now(),
          isReady: liveParticipant.isReady,
          joinedAt: liveParticipant.joinedAt,
          lastSeen: liveParticipant.lastSeen
        };
      });

      setParticipantEarnings(updatedParticipants);
      
      // Update session data with live participant info - FIXED: Use unique participant IDs
      setSessionData(prev => ({
        ...prev,
        recentActions: [
          ...liveParticipants.map((p) => ({
            id: `live_${p.id}`, // Use unique participant ID with prefix
            participant: p.displayName || `P${p.participantNumber.toString().padStart(3, '0')}`,
            action: p.isReady ? 'Ready to start' : 'Reading instructions',
            time: new Date(p.lastSeen || Date.now()).toLocaleTimeString()
          })),
          ...prev.recentActions.slice(0, 2) // Keep some original actions
        ]
      }));
    }
  }, [liveParticipants, experimentType, experimentCompleted]);

  // Load actual game session data for trust games
  const loadGameSessionData = () => {
    console.log('📊 LOADING GAME SESSION DATA:', { experimentType, id });
    
    if (experimentType === 'trust' && id) {
      try {
        const gameStorageKey = `trust_game_session_${id}`;
        const data = localStorage.getItem(gameStorageKey);
        
        if (data) {
          const session: GameSession = JSON.parse(data);
          setGameSession(session);
          
          console.log('📊 Loaded game session:', session);
        } else {
          console.log('📊 No game session data found for experiment:', id);
        }
      } catch (error) {
        console.error('📊 Error loading game session data:', error);
      }
    } else if (experimentType !== 'trust') {
      // For non-trust experiments, use mock data
      console.log('📊 Using mock data for non-trust experiment');
      setParticipantEarnings([
        {
          id: 'P001',
          walletAddress: 'ABCD1234EFGH5678IJKL9012MNOP3456QRST7890UVWX1234YZAB5678CDEF',
          displayName: 'Player A - P001',
          earnings: 2.5,
          participantNumber: 1,
          sessionId: 'session_001',
          experimentRole: 'Player A',
          status: 'pending',
          lastUpdated: Date.now()
        },
        {
          id: 'P002',
          walletAddress: 'EFGH5678IJKL9012MNOP3456QRST7890UVWX1234YZAB5678CDEF9012GHIJ',
          displayName: 'Player B - P002',
          earnings: 3.2,
          participantNumber: 2,
          sessionId: 'session_002',
          experimentRole: 'Player B',
          status: 'pending',
          lastUpdated: Date.now()
        }
      ]);
    }
  };

  // Refresh game session data periodically for trust games
  const refreshGameData = () => {
    console.log('🔄 REFRESHING GAME DATA');
    if (experimentType === 'trust') {
      loadGameSessionData();
    }
  };

  useEffect(() => {
    // Load initial data
    loadGameSessionData();
    
    // Set up periodic refresh for trust games
    if (experimentType === 'trust') {
      const interval = setInterval(refreshGameData, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [experimentType, id]);

  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isRunning, timeRemaining]);

  useEffect(() => {
    // Generate participant link based on experiment type
    const baseUrl = window.location.origin;
    if (experimentType === 'trust') {
      // For trust games, use the lobby system
      const lobbyParams = new URLSearchParams(searchParams);
      setParticipantLink(`${baseUrl}/trust-game-lobby/${id}?${lobbyParams.toString()}`);
    } else {
      setParticipantLink(`${baseUrl}/participate/${id}`);
    }
  }, [id, experimentType, searchParams]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyParticipantLink = async () => {
    try {
      await navigator.clipboard.writeText(participantLink);
      setLinkCopied(true);
      toast.success('Participant link copied to clipboard!');
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const calculateTotalEarnings = () => {
    return participantEarnings.reduce((sum, p) => sum + p.earnings, 0);
  };

  // CRITICAL: Enhanced payment form handler with proper data validation
  const handleShowPaymentForm = () => {
    console.log('💳 OPENING PAYMENT FORM WITH DATA:', {
      participantEarnings,
      participantCount: participantEarnings.length,
      totalEarnings: calculateTotalEarnings(),
      experimentType,
      gameSession: gameSession ? 'present' : 'absent',
      experimentCompleted
    });
    
    // Validate that we have proper participant data
    if (!participantEarnings || participantEarnings.length === 0) {
      toast.error('No participant earnings data available for payment processing');
      return;
    }
    
    // Validate each participant has required fields
    const invalidParticipants = participantEarnings.filter(p => 
      !p.walletAddress || 
      !p.id || 
      typeof p.earnings !== 'number' || 
      p.earnings <= 0
    );
    
    if (invalidParticipants.length > 0) {
      console.error('💳 Invalid participants found:', invalidParticipants);
      toast.error(`${invalidParticipants.length} participants have invalid data and cannot be paid`);
      return;
    }
    
    setShowPaymentForm(true);
  };

  const experimentInfo = {
    title: experimentTitle,
    type: experimentType === 'trust' ? 'Trust Game' : 'Public Goods',
    maxParticipants: parseInt(searchParams.get('maxParticipants') || '20'),
    round: 3,
    totalRounds: experimentType === 'trust' ? 1 : 10
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link 
              to="/dashboard" 
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{experimentInfo.title}</h1>
              <p className="text-gray-600">
                {experimentType === 'trust' ? 
                  `Trust Game Session • ${experimentCompleted ? 'Completed' : 'Live Experiment'}` : 
                  `Round ${experimentInfo.round} of ${experimentInfo.totalRounds}`
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* CRITICAL: WebSocket Connection Status */}
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
              socketConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {socketConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span className="text-sm">
                {socketConnected ? 'Connected to Server' : 'Server Disconnected'}
              </span>
            </div>
            
            <button
              onClick={refreshGameData}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Data</span>
            </button>
            
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isRunning 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isRunning ? 'Pause' : 'Resume'}</span>
            </button>
            
            <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </div>
        </div>

        {/* CRITICAL: Experiment Completion Status */}
        {experimentCompleted && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              Experiment Completed Successfully!
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-green-700 font-medium">Status</p>
                <p className="text-green-900 text-xl font-bold">Complete</p>
              </div>
              <div>
                <p className="text-green-700 font-medium">Participants</p>
                <p className="text-green-900 text-xl font-bold">{participantEarnings.length}</p>
              </div>
              <div>
                <p className="text-green-700 font-medium">Total Earnings</p>
                <p className="text-green-900 text-xl font-bold">{calculateTotalEarnings().toFixed(3)} ALGO</p>
              </div>
              <div>
                <p className="text-green-700 font-medium">Ready for Payment</p>
                <p className="text-green-900 text-xl font-bold">✅ Yes</p>
              </div>
            </div>
          </div>
        )}

        {/* CRITICAL: Live Participant Status for Trust Games */}
        {experimentType === 'trust' && socketConnected && !experimentCompleted && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Live Participant Tracking
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-green-700 font-medium">Connected Participants</p>
                <p className="text-green-900 text-xl font-bold">{liveParticipants.length}/{experimentInfo.maxParticipants}</p>
              </div>
              <div>
                <p className="text-green-700 font-medium">Ready to Start</p>
                <p className="text-green-900 text-xl font-bold">
                  {liveParticipants.filter(p => p.isReady).length}/{liveParticipants.length}
                </p>
              </div>
              <div>
                <p className="text-green-700 font-medium">Game Status</p>
                <p className={`text-xl font-bold ${gameStarted ? 'text-blue-600' : 'text-yellow-600'}`}>
                  {gameStarted ? 'In Progress' : allParticipantsReady ? 'Starting...' : 'Waiting'}
                </p>
              </div>
              <div>
                <p className="text-green-700 font-medium">Server Status</p>
                <p className="text-green-900 text-xl font-bold">Connected</p>
              </div>
            </div>
            
            {/* Live Participant Grid */}
            {liveParticipants.length > 0 && (
              <div className="mt-4 pt-4 border-t border-green-200">
                <h4 className="font-medium text-green-900 mb-3">Live Participants</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {liveParticipants.map((participant) => (
                    <div key={participant.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                      <div>
                        <p className="font-medium text-gray-900">{participant.displayName}</p>
                        <p className="text-sm text-gray-500">
                          {participant.walletAddress.slice(0, 8)}...{participant.walletAddress.slice(-8)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          participant.participantNumber % 2 === 1 
                            ? 'bg-primary-100 text-primary-700' 
                            : 'bg-secondary-100 text-secondary-700'
                        }`}>
                          Player {participant.participantNumber % 2 === 1 ? 'A' : 'B'}
                        </span>
                        {participant.isReady ? (
                          <UserCheck className="w-5 h-5 text-green-600" />
                        ) : (
                          <Eye className="w-5 h-5 text-yellow-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Warning if server disconnected for trust games */}
        {experimentType === 'trust' && !socketConnected && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="text-lg font-semibold text-red-900">Server Connection Lost</h3>
                <p className="text-red-800">
                  Real-time participant tracking is unavailable. Please check that the server is running and refresh the page.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Participant Link Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Participant Access</h3>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-blue-700 mb-2">
                Share this link with participants:
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={participantLink}
                  readOnly
                  className="flex-1 px-4 py-2 bg-white border border-blue-300 rounded-lg text-sm font-mono"
                />
                <button
                  onClick={copyParticipantLink}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {linkCopied ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span>{linkCopied ? 'Copied!' : 'Copy'}</span>
                </button>
                <a
                  href={participantLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Preview</span>
                </a>
              </div>
            </div>
          </div>
          
          {experimentType === 'trust' && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2">Trust Game Instructions</h4>
              <p className="text-sm text-yellow-800">
                Participants will first read instructions, then wait in a lobby until all participants are ready. 
                The trust game will start automatically when everyone has finished reading the instructions.
                {experimentCompleted && (
                  <span className="block mt-2 font-medium text-green-700">
                    ✅ Game completed! Results are now available for payment processing.
                  </span>
                )}
                {socketConnected && liveParticipants.length > 0 && !experimentCompleted && (
                  <span className="block mt-2 font-medium text-blue-700">
                    🔴 Live: {liveParticipants.length} participants connected, {liveParticipants.filter(p => p.isReady).length} ready
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Time Remaining</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatTime(timeRemaining)}</p>
              </div>
              <Clock className="w-8 h-8 text-primary-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Participants</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {experimentType === 'trust' && socketConnected ? 
                    `${liveParticipants.length}/${experimentInfo.maxParticipants}` :
                    `${participantEarnings.length}/${experimentInfo.maxParticipants}`
                  }
                </p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {experimentType === 'trust' ? 'Total Earnings' : 'Total Contributions'}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{calculateTotalEarnings().toFixed(3)} ALGO</p>
              </div>
              <DollarSign className="w-8 h-8 text-secondary-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {experimentType === 'trust' ? 'Avg. Earnings' : 'Efficiency'}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {experimentType === 'trust' ? 
                    `${(calculateTotalEarnings() / Math.max(participantEarnings.length, 1)).toFixed(3)}` :
                    `${sessionData.efficiency}%`
                  }
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-accent-600" />
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Real-time Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {experimentType === 'trust' ? 'Trust & Reciprocity Results' : 'Contribution Trends'}
                </h3>
                <button className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </div>
              
              <div className="h-64 bg-gradient-to-br from-primary-50 to-secondary-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-primary-300 mx-auto mb-2" />
                  <p className="text-gray-500">
                    {experimentType === 'trust' ? 'Trust game results' : 'Contribution'} visualization
                  </p>
                  {experimentType === 'trust' && gameSession && (
                    <div className="mt-4 text-sm text-gray-600">
                      <p>Player A sent: {(gameSession.gameState.playerA_sent / 1000000).toFixed(3)} ALGO</p>
                      <p>Player B returned: {(gameSession.gameState.playerB_returned / 1000000).toFixed(3)} ALGO</p>
                      <p>Trust ratio: {gameSession.gameState.playerA_sent > 0 ? 
                        ((gameSession.gameState.playerB_returned / gameSession.gameState.playerB_received) * 100).toFixed(1) + '%' : 
                        'N/A'
                      }</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Participant Grid */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Participant Status</h3>
                
                {/* Payment Controls */}
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total Earnings</p>
                    <p className="text-lg font-bold text-green-600">{calculateTotalEarnings().toFixed(3)} ALGO</p>
                  </div>
                  
                  <button
                    onClick={handleShowPaymentForm}
                    disabled={participantEarnings.length === 0 || calculateTotalEarnings() === 0}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Payments</span>
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {Array.from({ length: experimentInfo.maxParticipants }, (_, i) => {
                  const isActive = experimentType === 'trust' && socketConnected ? 
                    i < liveParticipants.length : 
                    i < participantEarnings.length;
                  
                  return (
                    <div
                      key={i}
                      className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium ${
                        isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      P{(i + 1).toString().padStart(3, '0')}
                    </div>
                  );
                })}
              </div>

              {/* Participant Earnings Summary */}
              <div className="mt-6 border-t border-gray-200 pt-6">
                <h4 className="font-medium text-gray-900 mb-4">Participant Earnings Summary</h4>
                {participantEarnings.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {participantEarnings.map((participant) => (
                      <div key={participant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{participant.displayName}</p>
                          <p className="text-sm text-gray-500">{participant.experimentRole}</p>
                          {participant.isReady !== undefined && (
                            <p className="text-xs text-gray-400">
                              {participant.isReady ? '✅ Ready' : '👁️ Reading'}
                            </p>
                          )}
                          {participant.gameResults && (
                            <p className="text-xs text-blue-600">
                              Role {participant.gameResults.role}: {participant.gameResults.finalBalance.toFixed(3)} ALGO
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{participant.earnings.toFixed(3)} ALGO</p>
                          <p className="text-xs text-gray-500">
                            {participant.walletAddress.slice(0, 6)}...{participant.walletAddress.slice(-6)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No participant earnings data available</p>
                    <p className="text-sm">
                      {experimentType === 'trust' ? 
                        'Complete the trust game to see participant earnings' :
                        'Complete the experiment to see participant earnings'
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <MessageCircle className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              </div>
              
              <div className="space-y-3">
                {sessionData.recentActions.map((action) => (
                  <div key={action.id} className="flex items-start space-x-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-primary-600 mt-2 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-gray-900">{action.action}</p>
                      <p className="text-gray-500 text-xs">{action.participant} • {action.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {experimentType === 'trust' ? 'Game Statistics' : 'Round Statistics'}
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">
                    {experimentType === 'trust' ? 'Average Earnings' : 'Average Contribution'}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {experimentType === 'trust' ? 
                      `${(calculateTotalEarnings() / Math.max(participantEarnings.length, 1)).toFixed(3)} ALGO` :
                      `${sessionData.averageContribution} ALGO`
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Participation Rate</span>
                  <span className="font-semibold text-gray-900">
                    {experimentType === 'trust' && socketConnected ? 
                      `${((liveParticipants.length / experimentInfo.maxParticipants) * 100).toFixed(0)}%` :
                      `${((participantEarnings.length / experimentInfo.maxParticipants) * 100).toFixed(0)}%`
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Earnings</span>
                  <span className="font-semibold text-green-600">{calculateTotalEarnings().toFixed(3)} ALGO</span>
                </div>
                {experimentType === 'trust' && socketConnected && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Ready to Start</span>
                    <span className="font-semibold text-blue-600">
                      {liveParticipants.filter(p => p.isReady).length}/{liveParticipants.length}
                    </span>
                  </div>
                )}
                {experimentCompleted && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status</span>
                    <span className="font-semibold text-green-600">✅ Complete</span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Wallet className="w-5 h-5 mr-2" />
                Payment Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-green-100">Participants</span>
                  <span className="font-bold">{participantEarnings.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-green-100">Total Earnings</span>
                  <span className="font-bold">{calculateTotalEarnings().toFixed(3)} ALGO</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-green-100">Avg. per Participant</span>
                  <span className="font-bold">{(calculateTotalEarnings() / Math.max(participantEarnings.length, 1)).toFixed(3)} ALGO</span>
                </div>
                {experimentCompleted && (
                  <div className="flex justify-between items-center">
                    <span className="text-green-100">Ready for Payment</span>
                    <span className="font-bold">✅ Yes</span>
                  </div>
                )}
              </div>
              <button
                onClick={handleShowPaymentForm}
                disabled={participantEarnings.length === 0 || calculateTotalEarnings() === 0}
                className="w-full mt-4 bg-white text-green-600 rounded-lg py-3 font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CreditCard className="w-5 h-5" />
                <span>Process Payments</span>
              </button>
            </div>

            {/* Round Control */}
            <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-4">
                {experimentType === 'trust' ? 'Game Control' : 'Round Control'}
              </h3>
              <p className="text-primary-100 text-sm mb-4">
                {experimentType === 'trust' ? 
                  experimentCompleted ? 
                    'Trust game completed successfully. Results are ready for payment processing.' :
                    'Monitor trust game sessions and manage participant flow.' :
                  'Current round will end automatically or you can proceed manually.'
                }
              </p>
              <button className="w-full bg-white text-primary-600 rounded-lg py-3 font-semibold hover:bg-gray-50 transition-colors">
                {experimentType === 'trust' ? 
                  experimentCompleted ? 'View Final Results' : 'Manage Sessions' : 
                  'End Round & Continue'
                }
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Transaction Form Modal */}
      <AnimatePresence>
        {showPaymentForm && (
          <PaymentTransactionForm
            experimentId={id || 'unknown'}
            experimentTitle={experimentTitle}
            initialParticipants={participantEarnings}
            onClose={() => setShowPaymentForm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExperimentSession;