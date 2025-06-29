import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  ArrowRight, 
  Users,
  Clock,
  DollarSign,
  Settings,
  Play,
  Save,
  UserCheck,
  UserX,
  Repeat,
  TrendingUp,
  Zap,
  Hash,
  Upload,
  Download,
  FolderOpen,
  ExternalLink,
  AlertTriangle,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { gameAPI } from '../services/gameApi';

interface TrustGameParameters {
  initialEndowment: number;
  multiplier: number;
  rounds: number;
  roleAssignment: 'random' | 'fixed';
  showHistory: boolean;
  anonymity: boolean;
  incrementSize: number; // in ALGO (e.g., 0.1)
  timePerDecision: number; // in seconds
}

interface ExperimentConfig {
  title: string;
  description: string;
  type: string;
  maxParticipants: number;
  duration: number;
  rewardPool: number;
  instructions: string;
  parameters: Record<string, any>;
  trustGameParams?: TrustGameParameters;
}

const ExperimentCreator: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [config, setConfig] = useState<ExperimentConfig>({
    title: '',
    description: '',
    type: '',
    maxParticipants: 20,
    duration: 60,
    rewardPool: 100,
    instructions: '',
    parameters: {},
    trustGameParams: {
      initialEndowment: 1,
      multiplier: 2,
      rounds: 1,
      roleAssignment: 'random',
      showHistory: false,
      anonymity: true,
      incrementSize: 0.1, // 0.1 ALGO increments
      timePerDecision: 300 // 5 minutes per decision
    }
  });

  // Check server status on component mount
  useEffect(() => {
    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    setServerStatus('checking');
    try {
      const apiUrl = import.meta.env.PROD 
        ? 'https://btree-production.up.railway.app' 
        : 'http://localhost:3001';
      
      console.log('🔍 Checking server status at:', apiUrl);
      
      const response = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Server is online:', data);
        setServerStatus('online');
        toast.success('Server connection verified');
      } else {
        console.warn('⚠️ Server responded with error:', response.status);
        setServerStatus('offline');
        toast.error('Server is not responding correctly');
      }
    } catch (error) {
      console.error('❌ Server check failed:', error);
      setServerStatus('offline');
      toast.error('Cannot connect to server');
    }
  };

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  // Auto-generate instructions when trust game parameters change
  useEffect(() => {
    if (config.type === 'trust') {
      setConfig(prev => ({
        ...prev,
        instructions: generateTrustGameInstructions()
      }));
    }
  }, [config.trustGameParams, config.type]);

  const experimentTypes = [
    {
      id: 'public-goods',
      name: 'Public Goods Game',
      description: 'Study contribution behavior in public goods scenarios',
      icon: '🤝',
      parameters: ['groupSize', 'rounds', 'multiplier']
    },
    {
      id: 'auction',
      name: 'Auction Mechanism',
      description: 'Test different auction formats and bidding strategies',
      icon: '🏆',
      parameters: ['auctionType', 'startingBid', 'bidIncrement']
    },
    {
      id: 'market',
      name: 'Market Simulation',
      description: 'Simulate trading in various market structures',
      icon: '📈',
      parameters: ['marketType', 'tradingRounds', 'initialEndowment']
    },
    {
      id: 'trust',
      name: 'Trust Game',
      description: 'Investigate trust and reciprocity between participants',
      icon: '🤲',
      parameters: ['initialEndowment', 'multiplier', 'rounds', 'roleAssignment', 'incrementSize']
    },
  ];

  const steps = [
    { number: 1, title: 'Basic Setup', description: 'Choose experiment type and basic settings' },
    { number: 2, title: 'Configuration', description: 'Set parameters and rewards' },
    { number: 3, title: 'Instructions', description: 'Provide participant instructions' },
    { number: 4, title: 'Review & Launch', description: 'Review and launch your experiment' },
  ];

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateTrustGameParams = (key: keyof TrustGameParameters, value: any) => {
    setConfig(prev => ({
      ...prev,
      trustGameParams: {
        ...prev.trustGameParams!,
        [key]: value
      }
    }));
  };

  const validateExperiment = (): boolean => {
    if (!config.title.trim()) {
      toast.error('Please enter an experiment title');
      setCurrentStep(1);
      return false;
    }
    
    if (!config.type) {
      toast.error('Please select an experiment type');
      setCurrentStep(1);
      return false;
    }
    
    if (config.type === 'trust' && config.maxParticipants % 2 !== 0) {
      toast.error('Trust games require an even number of participants');
      setCurrentStep(2);
      return false;
    }
    
    if (config.rewardPool <= 0) {
      toast.error('Reward pool must be greater than 0');
      setCurrentStep(2);
      return false;
    }
    
    if (!config.instructions.trim()) {
      toast.error('Please provide participant instructions');
      setCurrentStep(3);
      return false;
    }
    
    return true;
  };

  const handleLaunchTestDemo = async () => {
    if (!validateExperiment()) {
      return;
    }

    try {
      toast.loading('Starting test demo...', { id: 'demo' });
      
      // Simulate brief loading
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Test demo started!', { id: 'demo' });
      
      // Navigate to demo with parameters
      if (config.type === 'trust') {
        const params = new URLSearchParams({
          role: 'A',
          multiplier: config.trustGameParams?.multiplier.toString() || '2',
          incrementSize: (config.trustGameParams?.incrementSize || 0.1).toString(),
          initialEndowment: config.trustGameParams?.initialEndowment.toString() || '1'
        });
        navigate(`/trust-game-lobby/demo?${params.toString()}`);
      } else {
        navigate(`/participate/demo`);
      }
      
    } catch (error) {
      console.error('Error starting demo:', error);
      toast.error('Failed to start demo. Please try again.', { id: 'demo' });
    }
  };

  const handleLaunchLiveExperiment = async () => {
    if (!validateExperiment()) {
      return;
    }

    if (serverStatus !== 'online') {
      toast.error('Server is not available. Please check server status or try demo mode.');
      return;
    }

    try {
      toast.loading('Creating live experiment...', { id: 'launch' });
      
      // Create experiment via API to ensure it's properly stored on the server
      const experimentData = {
        title: config.title,
        description: config.description,
        type: config.type,
        maxParticipants: config.maxParticipants,
        duration: config.duration,
        rewardPool: config.rewardPool,
        instructions: config.instructions,
        gameParameters: config.type === 'trust' ? config.trustGameParams : config.parameters,
        status: 'active',
        createdAt: Date.now()
      };

      console.log('Creating experiment with data:', experimentData);
      
      // Create experiment on server
      const { experimentId, experiment } = await gameAPI.createExperiment(experimentData);
      
      console.log('Experiment created successfully:', { experimentId, experiment });
      
      toast.success('Live experiment created successfully!', { id: 'launch' });
      
      // Navigate to the experiment management page with proper parameters
      const params = new URLSearchParams({
        type: config.type,
        title: config.title,
        maxParticipants: config.maxParticipants.toString()
      });
      
      // Add trust game specific parameters
      if (config.type === 'trust' && config.trustGameParams) {
        params.set('multiplier', config.trustGameParams.multiplier.toString());
        params.set('incrementSize', config.trustGameParams.incrementSize.toString());
        params.set('initialEndowment', config.trustGameParams.initialEndowment.toString());
        params.set('rounds', config.trustGameParams.rounds.toString());
        params.set('roleAssignment', config.trustGameParams.roleAssignment);
        params.set('timePerDecision', config.trustGameParams.timePerDecision.toString());
        params.set('anonymity', config.trustGameParams.anonymity.toString());
        params.set('showHistory', config.trustGameParams.showHistory.toString());
      }
      
      navigate(`/experiment/${experimentId}?${params.toString()}`);
      
    } catch (error) {
      console.error('Error launching experiment:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to launch experiment. ';
      if (error.message.includes('Network error') || error.message.includes('fetch')) {
        errorMessage += 'Cannot connect to server. Please check your internet connection or try demo mode.';
      } else if (error.message.includes('HTTP')) {
        errorMessage += `Server error: ${error.message}`;
      } else {
        errorMessage += 'Please try again or use demo mode.';
      }
      
      toast.error(errorMessage, { id: 'launch' });
    }
  };

  const handleSaveAsDraft = async () => {
    try {
      toast.loading('Saving draft...', { id: 'save' });
      
      // Simulate save delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Save to localStorage for demo purposes
      const draftId = `draft_${Date.now()}`;
      const drafts = JSON.parse(localStorage.getItem('experiment_drafts') || '[]');
      drafts.push({
        id: draftId,
        title: config.title || 'Untitled Experiment',
        config,
        savedAt: new Date().toISOString()
      });
      localStorage.setItem('experiment_drafts', JSON.stringify(drafts));
      
      toast.success(`Draft saved as "${config.title || 'Untitled Experiment'}"!`, { id: 'save' });
      
      // Stay on the current page instead of navigating away
      
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft. Please try again.', { id: 'save' });
    }
  };

  const handleLoadDraft = () => {
    const drafts = JSON.parse(localStorage.getItem('experiment_drafts') || '[]');
    
    if (drafts.length === 0) {
      toast.info('No saved drafts found');
      return;
    }

    // For demo, load the most recent draft
    const mostRecent = drafts[drafts.length - 1];
    setConfig(mostRecent.config);
    toast.success(`Loaded draft: "${mostRecent.title}"`);
  };

  const handleExportConfig = () => {
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${config.title || 'experiment'}_config.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Configuration exported!');
  };

  const handleImportConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedConfig = JSON.parse(e.target?.result as string);
        setConfig(importedConfig);
        toast.success('Configuration imported successfully!');
      } catch (error) {
        toast.error('Invalid configuration file');
      }
    };
    reader.readAsText(file);
  };

  const generateTrustGameInstructions = () => {
    const params = config.trustGameParams!;
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

## CRITICAL: Synchronization Rules

- **ALL participants must finish reading instructions before ANYONE can start**
- You must click **"I Have Read the Instructions"** when ready
- Wait for **ALL participants** to finish reading
- The game will **start automatically** when everyone is ready
- **No one can start early** - this ensures fair experimental conditions

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

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Server Status */}
            <div className={`border rounded-xl p-4 ${
              serverStatus === 'online' ? 'bg-green-50 border-green-200' :
              serverStatus === 'offline' ? 'bg-red-50 border-red-200' :
              'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {serverStatus === 'online' ? <Wifi className="w-5 h-5 text-green-600" /> :
                   serverStatus === 'offline' ? <WifiOff className="w-5 h-5 text-red-600" /> :
                   <div className="w-5 h-5 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />}
                  <div>
                    <h4 className={`font-medium ${
                      serverStatus === 'online' ? 'text-green-900' :
                      serverStatus === 'offline' ? 'text-red-900' :
                      'text-yellow-900'
                    }`}>
                      Server Status: {serverStatus === 'online' ? 'Online' : serverStatus === 'offline' ? 'Offline' : 'Checking...'}
                    </h4>
                    <p className={`text-sm ${
                      serverStatus === 'online' ? 'text-green-700' :
                      serverStatus === 'offline' ? 'text-red-700' :
                      'text-yellow-700'
                    }`}>
                      {serverStatus === 'online' ? 'Live experiments are available' :
                       serverStatus === 'offline' ? 'Only demo mode available' :
                       'Checking server connection...'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={checkServerStatus}
                  className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Refresh
                </button>
              </div>
              
              {serverStatus === 'offline' && (
                <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-red-800">
                      <p className="font-medium">Server Connection Failed</p>
                      <p>Live experiments require server connection. You can still:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Create and test experiments in demo mode</li>
                        <li>Save drafts locally</li>
                        <li>Export/import configurations</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Load/Save Options */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="font-medium text-blue-900 mb-3">Configuration Management</h4>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleLoadDraft}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>Load Draft</span>
                </button>
                
                <label className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>Import Config</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportConfig}
                    className="hidden"
                  />
                </label>
                
                <button
                  onClick={handleExportConfig}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Config</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Experiment Title
              </label>
              <input
                type="text"
                value={config.title}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter experiment title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={config.description}
                onChange={(e) => setConfig({ ...config, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Describe your experiment"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Experiment Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {experimentTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setConfig({ ...config, type: type.id })}
                    className={`p-6 border-2 rounded-xl text-left transition-all ${
                      config.type === type.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-3xl mb-3">{type.icon}</div>
                    <h3 className="font-semibold text-gray-900 mb-2">{type.name}</h3>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-2" />
                  Max Participants
                </label>
                <input
                  type="number"
                  value={config.maxParticipants}
                  onChange={(e) => setConfig({ ...config, maxParticipants: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min="2"
                  max="100"
                />
                {config.type === 'trust' && config.maxParticipants % 2 !== 0 && (
                  <p className="text-sm text-amber-600 mt-1">Trust games require an even number of participants</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={config.duration}
                  onChange={(e) => setConfig({ ...config, duration: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min="5"
                  max="180"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-2" />
                  Reward Pool (ALGO)
                </label>
                <input
                  type="number"
                  value={config.rewardPool}
                  onChange={(e) => setConfig({ ...config, rewardPool: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min="1"
                />
              </div>
            </div>

            {config.type && (
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  <Settings className="w-5 h-5 inline mr-2" />
                  Experiment Parameters
                </h3>
                
                {config.type === 'trust' && (
                  <div className="space-y-6">
                    {/* Core Trust Game Parameters */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <DollarSign className="w-4 h-4 inline mr-1" />
                          Initial Endowment (ALGO)
                        </label>
                        <input
                          type="number"
                          value={config.trustGameParams?.initialEndowment || 1}
                          onChange={(e) => updateTrustGameParams('initialEndowment', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          min="0.1"
                          max="10"
                          step="0.1"
                        />
                        <p className="text-xs text-gray-500 mt-1">Amount each player starts with per round</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <TrendingUp className="w-4 h-4 inline mr-1" />
                          Multiplier
                        </label>
                        <input
                          type="number"
                          value={config.trustGameParams?.multiplier || 2}
                          onChange={(e) => updateTrustGameParams('multiplier', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          min="1"
                          max="5"
                          step="0.1"
                        />
                        <p className="text-xs text-gray-500 mt-1">Amount sent is multiplied by this factor</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Repeat className="w-4 h-4 inline mr-1" />
                          Number of Rounds
                        </label>
                        <input
                          type="number"
                          value={config.trustGameParams?.rounds || 1}
                          onChange={(e) => updateTrustGameParams('rounds', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          min="1"
                          max="50"
                        />
                        <p className="text-xs text-gray-500 mt-1">Total rounds per pair</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Hash className="w-4 h-4 inline mr-1" />
                          Increment Size (ALGO)
                        </label>
                        <select
                          value={config.trustGameParams?.incrementSize || 0.1}
                          onChange={(e) => updateTrustGameParams('incrementSize', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value={0.001}>0.001 ALGO</option>
                          <option value={0.01}>0.01 ALGO</option>
                          <option value={0.1}>0.1 ALGO</option>
                          <option value={0.5}>0.5 ALGO</option>
                          <option value={1}>1 ALGO</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Minimum decision increment</p>
                      </div>
                    </div>

                    {/* Time and Role Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Clock className="w-4 h-4 inline mr-1" />
                          Time Per Decision (seconds)
                        </label>
                        <select
                          value={config.trustGameParams?.timePerDecision || 300}
                          onChange={(e) => updateTrustGameParams('timePerDecision', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value={60}>1 minute</option>
                          <option value={120}>2 minutes</option>
                          <option value={300}>5 minutes</option>
                          <option value={600}>10 minutes</option>
                          <option value={900}>15 minutes</option>
                          <option value={1800}>30 minutes</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Time limit for each player's decision</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          <Users className="w-4 h-4 inline mr-1" />
                          Role Assignment
                        </label>
                        <div className="grid grid-cols-1 gap-3">
                          <button
                            type="button"
                            onClick={() => updateTrustGameParams('roleAssignment', 'random')}
                            className={`p-3 border-2 rounded-lg text-left transition-all ${
                              config.trustGameParams?.roleAssignment === 'random'
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center space-x-2 mb-1">
                              <UserCheck className="w-4 h-4 text-primary-600" />
                              <span className="font-medium text-sm">Random Roles</span>
                            </div>
                            <p className="text-xs text-gray-600">Roles (A/B) switch randomly each round</p>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => updateTrustGameParams('roleAssignment', 'fixed')}
                            className={`p-3 border-2 rounded-lg text-left transition-all ${
                              config.trustGameParams?.roleAssignment === 'fixed'
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center space-x-2 mb-1">
                              <UserX className="w-4 h-4 text-secondary-600" />
                              <span className="font-medium text-sm">Fixed Roles</span>
                            </div>
                            <p className="text-xs text-gray-600">Each player keeps the same role throughout</p>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Additional Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                        <div>
                          <label className="font-medium text-gray-900">Show Round History</label>
                          <p className="text-sm text-gray-600">Allow players to see previous rounds</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config.trustGameParams?.showHistory || false}
                            onChange={(e) => updateTrustGameParams('showHistory', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                        <div>
                          <label className="font-medium text-gray-900">Anonymous Play</label>
                          <p className="text-sm text-gray-600">Hide participant identities</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config.trustGameParams?.anonymity || false}
                            onChange={(e) => updateTrustGameParams('anonymity', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                    </div>

                    {/* Trust Game Preview */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">Trust Game Preview</h4>
                      <div className="text-sm text-blue-800 space-y-1">
                        <p>• Each player starts with <strong>{config.trustGameParams?.initialEndowment} ALGO</strong> per round</p>
                        <p>• Amount sent is multiplied by <strong>{config.trustGameParams?.multiplier}x</strong></p>
                        <p>• <strong>{config.trustGameParams?.rounds} round{config.trustGameParams?.rounds === 1 ? '' : 's'}</strong> with the same partner</p>
                        <p>• Decision increments: <strong>{config.trustGameParams?.incrementSize} ALGO</strong></p>
                        <p>• Time per decision: <strong>{Math.floor((config.trustGameParams?.timePerDecision || 300) / 60)} minutes</strong></p>
                        <p>• Roles: <strong>{config.trustGameParams?.roleAssignment === 'random' ? 'Switch randomly' : 'Stay fixed'}</strong></p>
                        <p>• Maximum possible earnings per player: <strong>{((config.trustGameParams?.initialEndowment || 1) * (config.trustGameParams?.multiplier || 2) * (config.trustGameParams?.rounds || 1)).toFixed(1)} ALGO</strong></p>
                      </div>
                    </div>
                  </div>
                )}

                {config.type === 'public-goods' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Group Size
                      </label>
                      <input
                        type="number"
                        defaultValue={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        min="2"
                        max="10"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number of Rounds
                      </label>
                      <input
                        type="number"
                        defaultValue={10}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        min="1"
                        max="50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Multiplier
                      </label>
                      <input
                        type="number"
                        defaultValue={2}
                        step="0.1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        min="1"
                        max="5"
                      />
                    </div>
                  </div>
                )}

                {config.type === 'auction' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Auction Type
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                        <option>English Auction</option>
                        <option>Dutch Auction</option>
                        <option>Second Price</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Starting Bid
                      </label>
                      <input
                        type="number"
                        defaultValue={1}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bid Increment
                      </label>
                      <input
                        type="number"
                        defaultValue={0.1}
                        step="0.1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        min="0.1"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Participant Instructions (Markdown)
              </label>
              <textarea
                value={config.instructions}
                onChange={(e) => setConfig({ ...config, instructions: e.target.value })}
                rows={20}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
                placeholder="Write instructions in markdown format..."
              />
            </div>

            {config.type === 'trust' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">✨ Auto-Generated Trust Game Instructions</h4>
                <p className="text-sm text-green-800">
                  Instructions have been automatically generated in markdown format based on your trust game parameters. 
                  You can edit them above if needed.
                </p>
              </div>
            )}

            {/* Preview Section */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Instructions Preview</h3>
              <div className="bg-white rounded-lg p-4 border border-gray-200 max-h-96 overflow-y-auto">
                <MarkdownRenderer content={config.instructions} />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Instructions Tips:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Use markdown syntax for formatting (# for headers, ** for bold, etc.)</li>
                <li>• Clearly explain the rules and objectives</li>
                <li>• Include payment structure and how rewards are calculated</li>
                <li>• Provide examples of typical scenarios</li>
                <li>• Mention any time constraints or deadlines</li>
                {config.type === 'trust' && (
                  <>
                    <li>• Explain both Player A (Trustor) and Player B (Trustee) roles</li>
                    <li>• Include numerical examples to clarify the multiplier effect</li>
                    <li>• Emphasize the strategic nature of repeated interactions</li>
                    <li>• Specify the increment size for decision making</li>
                    <li>• <strong>CRITICAL: Emphasize that ALL participants must finish reading before anyone can start</strong></li>
                  </>
                )}
              </ul>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Experiment Summary</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Basic Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-600">Title:</span> {config.title}</div>
                    <div><span className="text-gray-600">Type:</span> {experimentTypes.find(t => t.id === config.type)?.name}</div>
                    <div><span className="text-gray-600">Duration:</span> {config.duration} minutes</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Participation & Rewards</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-600">Max Participants:</span> {config.maxParticipants}</div>
                    <div><span className="text-gray-600">Reward Pool:</span> {config.rewardPool} ALGO</div>
                    <div><span className="text-gray-600">Avg. Reward:</span> {(config.rewardPool / config.maxParticipants).toFixed(2)} ALGO</div>
                  </div>
                </div>
              </div>

              {config.type === 'trust' && config.trustGameParams && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3">Trust Game Configuration</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="bg-primary-50 p-3 rounded-lg">
                      <span className="text-gray-600">Initial Endowment:</span>
                      <p className="font-semibold text-primary-700">{config.trustGameParams.initialEndowment} ALGO</p>
                    </div>
                    <div className="bg-secondary-50 p-3 rounded-lg">
                      <span className="text-gray-600">Multiplier:</span>
                      <p className="font-semibold text-secondary-700">{config.trustGameParams.multiplier}x</p>
                    </div>
                    <div className="bg-accent-50 p-3 rounded-lg">
                      <span className="text-gray-600">Rounds:</span>
                      <p className="font-semibold text-accent-700">{config.trustGameParams.rounds}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-gray-600">Increment Size:</span>
                      <p className="font-semibold text-gray-700">{config.trustGameParams.incrementSize} ALGO</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <span className="text-gray-600">Time Per Decision:</span>
                      <p className="font-semibold text-blue-700">{Math.floor(config.trustGameParams.timePerDecision / 60)} min</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <span className="text-gray-600">Role Assignment:</span>
                      <p className="font-semibold text-green-700 capitalize">{config.trustGameParams.roleAssignment}</p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <span className="text-gray-600">Show History:</span>
                      <p className="font-semibold text-yellow-700">{config.trustGameParams.showHistory ? 'Yes' : 'No'}</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <span className="text-gray-600">Anonymous:</span>
                      <p className="font-semibold text-purple-700">{config.trustGameParams.anonymity ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Server Status Warning */}
            {serverStatus !== 'online' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">⚠️ Server Status Warning</h4>
                <div className="text-sm text-yellow-800 space-y-1">
                  <p>• <strong>Server is currently offline:</strong> Live experiments are not available</p>
                  <p>• <strong>Demo mode only:</strong> You can test the experiment locally</p>
                  <p>• <strong>Save your work:</strong> Use "Save as Draft" to preserve your configuration</p>
                  <p>• <strong>Try again later:</strong> Check server status and launch live when available</p>
                </div>
              </div>
            )}

            {/* CRITICAL SYNCHRONIZATION WARNING */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">🔒 Synchronization Guarantee</h4>
              <div className="text-sm text-red-800 space-y-1">
                <p>• <strong>Server-enforced synchronization:</strong> No participant can start before all others finish reading</p>
                <p>• <strong>Experiment creation:</strong> Will be properly stored on the server</p>
                <p>• <strong>Participant management:</strong> Each participant gets unique identification</p>
                <p>• <strong>Real-time coordination:</strong> WebSocket-based communication ensures perfect timing</p>
                <p>• <strong>Fair experimental conditions:</strong> All participants start simultaneously</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={handleSaveAsDraft}
                className="flex items-center justify-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Save className="w-5 h-5" />
                <span>Save as Draft</span>
              </button>
              
              <button 
                onClick={handleLaunchTestDemo}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Play className="w-5 h-5" />
                <span>Test Demo</span>
              </button>
              
              <button 
                onClick={handleLaunchLiveExperiment}
                disabled={serverStatus !== 'online'}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg hover:from-primary-700 hover:to-secondary-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ExternalLink className="w-5 h-5" />
                <span>{serverStatus === 'online' ? 'Launch Live' : 'Server Offline'}</span>
              </button>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Link to="/dashboard" className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New Experiment</h1>
            <p className="text-gray-600">Set up your economic experiment with blockchain incentives</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  step.number <= currentStep 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step.number}
                </div>
                <div className="ml-3 hidden sm:block">
                  <p className={`text-sm font-medium ${
                    step.number <= currentStep ? 'text-primary-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-px mx-4 ${
                  step.number < currentStep ? 'bg-primary-600' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {renderStepContent()}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors ${
                currentStep === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>

            {currentStep < 4 && (
              <button
                onClick={handleNext}
                className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <span>Next</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExperimentCreator;