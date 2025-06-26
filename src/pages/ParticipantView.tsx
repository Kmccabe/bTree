import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  Clock, 
  DollarSign, 
  CheckCircle,
  AlertCircle,
  Info,
  Send,
  Eye,
  Target,
  Award,
  BarChart3,
  Home,
  ArrowLeft,
  BookOpen,
  Play,
  Wallet,
  Lock,
  Shield
} from 'lucide-react';
import { useAlgorand } from '../contexts/AlgorandContext';
import MarkdownRenderer from '../components/MarkdownRenderer';

const ParticipantView: React.FC = () => {
  const { experimentId } = useParams();
  const { isConnected, connectWallet } = useAlgorand();
  const [currentStep, setCurrentStep] = useState<'wallet' | 'instructions' | 'waiting' | 'experiment' | 'results'>('wallet');
  const [hasReadInstructions, setHasReadInstructions] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(900); // 15 minutes
  const [contribution, setContribution] = useState(0);
  const [round, setRound] = useState(1);
  const [totalRounds] = useState(10);
  const [groupContribution, setGroupContribution] = useState(0);
  const [personalEarnings, setPersonalEarnings] = useState(0);
  const [allParticipantsReady, setAllParticipantsReady] = useState(false);
  const [participantsReady, setParticipantsReady] = useState(1);
  const [totalParticipants] = useState(4);

  // Mock experiment data - in real implementation, this would come from the experiment configuration
  const experimentData = {
    title: 'Public Goods Game - Winter 2024',
    description: 'A study of contribution behavior in public goods scenarios',
    type: 'Public Goods',
    reward: '25 ALGO',
    duration: '15 minutes',
    instructions: `# Welcome to our Public Goods Game experiment!

## Objective
You are part of a 4-person group. Each round, you'll decide how much to contribute to a group fund.

## How it works
- You start with **20 tokens** each round
- You can contribute **0-20 tokens** to the group fund
- The group fund is **multiplied by 2** and divided equally among all 4 members
- You keep any tokens you don't contribute

## Example
If everyone contributes 10 tokens:
- Group fund: 40 tokens × 2 = **80 tokens**
- Each person gets: 80 ÷ 4 = **20 tokens** back
- Plus 10 tokens kept = **30 tokens total** per person

## Payment
Your final token balance will be converted to ALGO and paid to your wallet.
**Exchange rate: 1 token = 0.1 ALGO**

## Rules
- **10 rounds** total
- You have **60 seconds** per round to make your decision
- All decisions are **anonymous**
- Be strategic - your choice affects everyone's earnings!

## Important Notes
- Please read these instructions carefully
- You must wait for all participants to finish reading before the experiment begins
- Once the experiment starts, you cannot go back to these instructions
- Make sure you understand the rules before proceeding

**Good luck!**`,
  };

  // CRITICAL: Force wallet connection check on mount and when connection status changes
  useEffect(() => {
    console.log('🔒 PARTICIPANT VIEW - WALLET CONNECTION CHECK:', {
      isConnected,
      currentStep,
      experimentId
    });

    if (!isConnected) {
      console.log('🔒 FORCING WALLET CONNECTION - User not connected');
      setCurrentStep('wallet');
      setHasReadInstructions(false);
    } else if (currentStep === 'wallet') {
      console.log('🔒 WALLET CONNECTED - Proceeding to instructions');
      setCurrentStep('instructions');
    }
  }, [isConnected]);

  // Simulate other participants reading instructions
  useEffect(() => {
    if (hasReadInstructions && !allParticipantsReady) {
      const interval = setInterval(() => {
        setParticipantsReady(prev => {
          const next = Math.min(prev + 1, totalParticipants);
          if (next === totalParticipants) {
            setAllParticipantsReady(true);
            // Auto-start experiment after all participants are ready
            setTimeout(() => {
              setCurrentStep('experiment');
            }, 2000);
          }
          return next;
        });
      }, Math.random() * 3000 + 1000); // Random delay between 1-4 seconds

      return () => clearInterval(interval);
    }
  }, [hasReadInstructions, allParticipantsReady, totalParticipants]);

  useEffect(() => {
    if (currentStep === 'experiment' && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentStep, timeRemaining]);

  useEffect(() => {
    // Simulate group contributions
    const simulateGroupActivity = () => {
      setGroupContribution(prev => prev + Math.floor(Math.random() * 5));
    };

    if (currentStep === 'experiment') {
      const interval = setInterval(simulateGroupActivity, 3000);
      return () => clearInterval(interval);
    }
  }, [currentStep]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFinishReading = () => {
    // CRITICAL: Double-check wallet connection before proceeding
    if (!isConnected) {
      console.log('🔒 BLOCKING INSTRUCTION COMPLETION - Wallet not connected');
      connectWallet();
      return;
    }
    
    setHasReadInstructions(true);
    setCurrentStep('waiting');
  };

  const handleContributionSubmit = () => {
    // Simulate contribution processing
    const roundEarnings = (groupContribution + contribution) * 2 / 4 + (20 - contribution);
    setPersonalEarnings(prev => prev + roundEarnings);
    
    if (round < totalRounds) {
      setRound(prev => prev + 1);
      setContribution(0);
      setGroupContribution(0);
      setTimeRemaining(60);
    } else {
      setCurrentStep('results');
    }
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
          <Link 
            to="/dashboard" 
            className="flex items-center space-x-2 px-4 py-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Researcher Dashboard</span>
          </Link>
          
          <Link 
            to="/trust-game/demo?role=A" 
            className="flex items-center space-x-2 px-4 py-2 bg-secondary-100 text-secondary-700 hover:bg-secondary-200 rounded-lg transition-colors"
          >
            <Users className="w-4 h-4" />
            <span>Try Trust Game</span>
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
                <li>• All transactions are recorded on the Algorand blockchain for transparency</li>
                <li>• <strong>You cannot proceed without connecting your wallet</strong></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center p-4 bg-primary-50 rounded-lg">
            <DollarSign className="w-8 h-8 text-primary-600 mx-auto mb-2" />
            <p className="font-semibold text-primary-900">Potential Reward</p>
            <p className="text-primary-700">{experimentData.reward}</p>
          </div>
          <div className="text-center p-4 bg-secondary-50 rounded-lg">
            <Clock className="w-8 h-8 text-secondary-600 mx-auto mb-2" />
            <p className="font-semibold text-secondary-900">Duration</p>
            <p className="text-secondary-700">{experimentData.duration}</p>
          </div>
          <div className="text-center p-4 bg-accent-50 rounded-lg">
            <Users className="w-8 h-8 text-accent-600 mx-auto mb-2" />
            <p className="font-semibold text-accent-900">Group Size</p>
            <p className="text-accent-700">4 participants</p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-yellow-900 mb-1">Why Wallet Connection is Required</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• <strong>Automatic payments:</strong> Your earnings are sent directly to your wallet</li>
                <li>• <strong>Unique identification:</strong> Ensures authentic participation</li>
                <li>• <strong>Blockchain transparency:</strong> All transactions are publicly verifiable</li>
                <li>• <strong>No manual payment processing:</strong> Eliminates delays and errors</li>
                <li>• <strong>Research integrity:</strong> Prevents duplicate or fake participation</li>
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
            <span>Researcher Dashboard</span>
          </Link>
          
          <Link 
            to="/trust-game/demo?role=A" 
            className="flex items-center space-x-2 px-4 py-2 bg-secondary-100 text-secondary-700 hover:bg-secondary-200 rounded-lg transition-colors"
          >
            <Users className="w-4 h-4" />
            <span>Try Trust Game</span>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{experimentData.title}</h1>
          <p className="text-gray-600">{experimentData.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center p-4 bg-primary-50 rounded-lg">
            <DollarSign className="w-8 h-8 text-primary-600 mx-auto mb-2" />
            <p className="font-semibold text-primary-900">Potential Reward</p>
            <p className="text-primary-700">{experimentData.reward}</p>
          </div>
          <div className="text-center p-4 bg-secondary-50 rounded-lg">
            <Clock className="w-8 h-8 text-secondary-600 mx-auto mb-2" />
            <p className="font-semibold text-secondary-900">Duration</p>
            <p className="text-secondary-700">{experimentData.duration}</p>
          </div>
          <div className="text-center p-4 bg-accent-50 rounded-lg">
            <Users className="w-8 h-8 text-accent-600 mx-auto mb-2" />
            <p className="font-semibold text-accent-900">Group Size</p>
            <p className="text-accent-700">4 participants</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Info className="w-5 h-5 mr-2" />
            Experiment Instructions
          </h3>
          <div className="bg-white rounded-lg p-4 border border-gray-200 max-h-96 overflow-y-auto">
            <MarkdownRenderer content={experimentData.instructions} />
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
                <li>• Once the experiment starts, you cannot return to these instructions</li>
                <li>• Make sure you understand the rules and payment structure</li>
                <li>• <strong>Your wallet is connected and ready for payments</strong></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-blue-600">
            <Info className="w-5 h-5" />
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
          <h2 className="text-lg font-semibold text-gray-900">{experimentData.title}</h2>
          <p className="text-sm text-gray-500">Waiting for all participants</p>
        </div>
        
        <div className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm">Wallet Connected</span>
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
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Waiting for Other Participants</h1>
        <p className="text-gray-600 mb-8">
          Please wait while other participants finish reading the instructions. 
          The experiment will begin automatically once everyone is ready.
        </p>

        {/* Participant Status */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Participant Status</h3>
          
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">{participantsReady}</div>
              <div className="text-sm text-gray-500">Ready</div>
            </div>
            <div className="text-2xl text-gray-400">/</div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-400">{totalParticipants}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="bg-primary-600 h-3 rounded-full transition-all duration-500" 
              style={{ width: `${(participantsReady / totalParticipants) * 100}%` }}
            />
          </div>

          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: totalParticipants }, (_, i) => (
              <div
                key={i}
                className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
                  i < participantsReady
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {i < participantsReady ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <Clock className="w-6 h-6" />
                )}
              </div>
            ))}
          </div>
        </div>

        {allParticipantsReady && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4"
          >
            <div className="flex items-center justify-center space-x-2 text-green-600 mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">All participants are ready!</span>
            </div>
            <p className="text-sm text-green-700">Starting experiment in a moment...</p>
          </motion.div>
        )}

        <div className="text-sm text-gray-500 mt-6">
          You can safely wait here. The page will automatically advance when ready.
        </div>
      </motion.div>
    </div>
  );

  const renderExperiment = () => (
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
          <h2 className="text-lg font-semibold text-gray-900">Public Goods Game</h2>
          <p className="text-sm text-gray-500">Round {round} of {totalRounds}</p>
        </div>
        
        <div className="text-right">
          <p className="text-lg font-bold text-primary-600">{formatTime(timeRemaining)}</p>
          <p className="text-sm text-gray-500">Time left</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Game Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contribution Interface */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Decision</h3>
            
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-700">Your tokens this round:</span>
                <span className="text-xl font-bold text-gray-900">20</span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-700">Tokens kept:</span>
                <span className="text-lg font-semibold text-green-600">{20 - contribution}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Contribution:</span>
                <span className="text-lg font-semibold text-primary-600">{contribution}</span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How much do you want to contribute? (0-20 tokens)
              </label>
              <input
                type="range"
                min="0"
                max="20"
                value={contribution}
                onChange={(e) => setContribution(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0</span>
                <span>10</span>
                <span>20</span>
              </div>
            </div>

            <button
              onClick={handleContributionSubmit}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg hover:from-primary-700 hover:to-secondary-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Send className="w-5 h-5" />
              <span>Submit Contribution</span>
            </button>
          </div>

          {/* Group Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Group Status</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-900 font-medium">Group Fund</span>
                </div>
                <span className="text-xl font-bold text-blue-600">{groupContribution + contribution} tokens</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-green-600" />
                  <span className="text-green-900 font-medium">Your Earnings (Projected)</span>
                </div>
                <span className="text-xl font-bold text-green-600">
                  {Math.floor((groupContribution + contribution) * 2 / 4 + (20 - contribution))} tokens
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-purple-600" />
                  <span className="text-purple-900 font-medium">Total Earnings</span>
                </div>
                <span className="text-xl font-bold text-purple-600">{personalEarnings.toFixed(1)} tokens</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Eye className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Other participants are deciding...</span>
              </div>
              <div className="flex space-x-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-8 h-8 bg-yellow-200 rounded-full animate-pulse flex items-center justify-center">
                    <span className="text-xs text-yellow-800">P{i}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Round History */}
        {round > 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Previous Rounds</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: round - 1 }, (_, i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900">Round {i + 1}</p>
                  <p className="text-sm text-gray-600">Contributed: {Math.floor(Math.random() * 21)} tokens</p>
                  <p className="text-sm text-gray-600">Earned: {(15 + Math.random() * 10).toFixed(1)} tokens</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );

  const renderResults = () => (
    <div className="max-w-4xl mx-auto">
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-6">
        <Link 
          to="/" 
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>Return to Home</span>
        </Link>
        
        <div className="flex items-center space-x-4">
          <Link 
            to="/dashboard" 
            className="flex items-center space-x-2 px-4 py-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            <span>View Dashboard</span>
          </Link>
          
          <Link 
            to="/trust-game/demo?role=A" 
            className="flex items-center space-x-2 px-4 py-2 bg-secondary-100 text-secondary-700 hover:bg-secondary-200 rounded-lg transition-colors"
          >
            <Users className="w-4 h-4" />
            <span>Try Trust Game</span>
          </Link>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Experiment Complete!</h1>
        <p className="text-xl text-gray-600 mb-8">Thank you for participating in our research study.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 bg-primary-50 rounded-xl">
            <BarChart3 className="w-8 h-8 text-primary-600 mx-auto mb-3" />
            <p className="font-semibold text-primary-900">Total Tokens Earned</p>
            <p className="text-2xl font-bold text-primary-600">{personalEarnings.toFixed(1)}</p>
          </div>
          
          <div className="p-6 bg-green-50 rounded-xl">
            <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-3" />
            <p className="font-semibold text-green-900">ALGO Reward</p>
            <p className="text-2xl font-bold text-green-600">{(personalEarnings * 0.1).toFixed(2)}</p>
          </div>
          
          <div className="p-6 bg-purple-50 rounded-xl">
            <Award className="w-8 h-8 text-purple-600 mx-auto mb-3" />
            <p className="font-semibold text-purple-900">Performance Rank</p>
            <p className="text-2xl font-bold text-purple-600">Top 25%</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Payment Information</h3>
          <p className="text-blue-800 mb-4">
            Your reward of {(personalEarnings * 0.1).toFixed(2)} ALGO will be sent to your connected wallet within 24 hours.
          </p>
          <div className="flex items-center justify-center space-x-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Payment transaction initiated</span>
          </div>
        </div>

        <div className="text-left bg-gray-50 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Research Impact</h3>
          <p className="text-gray-700 mb-3">
            Your participation contributes to important research on cooperation and public goods provision. 
            Studies like this help us understand how people make decisions in group settings and can inform 
            policy decisions about public goods and collective action problems.
          </p>
          <p className="text-gray-700">
            If you're interested in the results of this study, you can follow our research publications or 
            contact the research team for updates.
          </p>
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
            to="/trust-game/demo?role=A"
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-secondary-600 to-accent-600 text-white rounded-lg hover:from-secondary-700 hover:to-accent-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Users className="w-5 h-5" />
            <span>Try Trust Game Demo</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      {currentStep === 'wallet' && renderWalletConnection()}
      {currentStep === 'instructions' && renderInstructions()}
      {currentStep === 'waiting' && renderWaiting()}
      {currentStep === 'experiment' && renderExperiment()}
      {currentStep === 'results' && renderResults()}
    </div>
  );
};

export default ParticipantView;