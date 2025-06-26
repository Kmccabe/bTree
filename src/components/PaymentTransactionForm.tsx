import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Send, 
  Wallet, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Calculator,
  CreditCard,
  Users,
  DollarSign,
  Activity,
  RefreshCw,
  Download,
  Upload
} from 'lucide-react';
import { useAlgorand } from '../contexts/AlgorandContext';
import toast from 'react-hot-toast';

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
}

interface PaymentTransactionFormProps {
  experimentId: string;
  experimentTitle: string;
  initialParticipants?: any;
  onClose?: () => void;
}

// Enhanced logging utility for payment form
const paymentFormLog = {
  info: (action: string, data: any = {}) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 💳 PAYMENT_FORM: ${action}`, data);
  },
  error: (action: string, error: any, data: any = {}) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] 💳 PAYMENT_FORM_ERROR: ${action}`, { 
      error: error?.message || error, 
      stack: error?.stack,
      ...data 
    });
  },
  participant: (action: string, participant: any, data: any = {}) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 💳 PAYMENT_PARTICIPANT: ${action}`, {
      participantId: participant?.id,
      displayName: participant?.displayName,
      earnings: participant?.earnings,
      walletAddress: participant?.walletAddress?.slice(-8),
      fullWalletAddress: participant?.walletAddress, // CRITICAL: Log full address
      walletAddressLength: participant?.walletAddress?.length,
      walletAddressType: typeof participant?.walletAddress,
      ...data
    });
  },
  extraction: (action: string, data: any = {}) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 💳 EXTRACTION: ${action}`, data);
  },
  // CRITICAL: New address tracing function
  addressTrace: (action: string, address: any, context: string = '') => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🔍 ADDRESS_TRACE [${context}]: ${action}`, {
      address: address,
      addressType: typeof address,
      addressLength: address?.length,
      isString: typeof address === 'string',
      isValidLength: address?.length === 58,
      first8: address?.slice(0, 8),
      last8: address?.slice(-8),
      context: context
    });
  }
};

// BULLETPROOF DATA EXTRACTION - handles ANY possible data structure
const extractParticipantsFromAnyData = (data: any): Participant[] => {
  paymentFormLog.extraction('STARTING_EXTRACTION', {
    dataType: typeof data,
    isArray: Array.isArray(data),
    isNull: data === null,
    isUndefined: data === undefined,
    constructor: data?.constructor?.name,
    hasOwnProperty: data?.hasOwnProperty ? 'yes' : 'no',
    keys: data && typeof data === 'object' ? Object.keys(data).slice(0, 10) : [],
    stringPreview: typeof data === 'string' ? data.substring(0, 100) : 
                   data ? JSON.stringify(data).substring(0, 300) : 'null/undefined'
  });

  // CRITICAL: Wrap everything in try-catch to prevent any errors
  try {
    // Step 1: Handle null/undefined/primitive types
    if (data === null || data === undefined) {
      paymentFormLog.extraction('DATA_IS_NULL_OR_UNDEFINED');
      return [];
    }

    if (typeof data !== 'object') {
      paymentFormLog.extraction('DATA_IS_PRIMITIVE', { type: typeof data, value: data });
      return [];
    }

    // Step 2: If it's already an array, process it
    if (Array.isArray(data)) {
      paymentFormLog.extraction('DATA_IS_ARRAY', { length: data.length });
      return processArrayItems(data);
    }

    // Step 3: Try multiple extraction strategies
    const strategies = [
      () => findArrayInProperties(data),
      () => extractFromNumericKeys(data),
      () => extractFromObjectValues(data),
      () => extractSingleParticipant(data),
      () => deepSearchForArrays(data),
      () => extractFromTrustGameSession(data),
      () => extractFromExperimentData(data)
    ];

    for (let i = 0; i < strategies.length; i++) {
      try {
        const result = strategies[i]();
        if (result && Array.isArray(result) && result.length > 0) {
          paymentFormLog.extraction('STRATEGY_SUCCESS', { 
            strategyIndex: i + 1, 
            participantCount: result.length 
          });
          return result;
        }
      } catch (error) {
        paymentFormLog.error('STRATEGY_FAILED', error, { strategyIndex: i + 1 });
      }
    }

    paymentFormLog.extraction('ALL_STRATEGIES_FAILED');
    return [];

  } catch (error) {
    paymentFormLog.error('EXTRACTION_CRITICAL_ERROR', error);
    return [];
  }
};

// Strategy 1: Find arrays in common property names
const findArrayInProperties = (obj: any): Participant[] => {
  const propertyNames = ['participants', 'data', 'items', 'list', 'results', 'players', 'users', 'members'];
  
  for (const prop of propertyNames) {
    try {
      if (obj[prop] && Array.isArray(obj[prop])) {
        paymentFormLog.extraction('FOUND_ARRAY_IN_PROPERTY', { 
          property: prop, 
          length: obj[prop].length 
        });
        return processArrayItems(obj[prop]);
      }
    } catch (error) {
      paymentFormLog.error('PROPERTY_ACCESS_ERROR', error, { property: prop });
    }
  }
  return [];
};

// Strategy 2: Extract from numeric keys (array-like object)
const extractFromNumericKeys = (obj: any): Participant[] => {
  try {
    const keys = Object.keys(obj);
    const numericKeys = keys.filter(key => !isNaN(Number(key))).sort((a, b) => Number(a) - Number(b));
    
    if (numericKeys.length > 0 && numericKeys.length === keys.length) {
      paymentFormLog.extraction('FOUND_ARRAY_LIKE_OBJECT', { numericKeyCount: numericKeys.length });
      const items = numericKeys.map(key => obj[key]);
      return processArrayItems(items);
    }
  } catch (error) {
    paymentFormLog.error('NUMERIC_KEYS_ERROR', error);
  }
  return [];
};

// Strategy 3: Extract from object values
const extractFromObjectValues = (obj: any): Participant[] => {
  try {
    const values = Object.values(obj);
    if (values.length > 0 && values.every(v => v && typeof v === 'object' && hasParticipantLikeProperties(v))) {
      paymentFormLog.extraction('OBJECT_VALUES_LOOK_LIKE_PARTICIPANTS', { valueCount: values.length });
      return processArrayItems(values);
    }
  } catch (error) {
    paymentFormLog.error('OBJECT_VALUES_ERROR', error);
  }
  return [];
};

// Strategy 4: Extract single participant
const extractSingleParticipant = (obj: any): Participant[] => {
  try {
    if (hasParticipantLikeProperties(obj)) {
      paymentFormLog.extraction('SINGLE_PARTICIPANT_DETECTED');
      return processArrayItems([obj]);
    }
  } catch (error) {
    paymentFormLog.error('SINGLE_PARTICIPANT_ERROR', error);
  }
  return [];
};

// Strategy 5: Deep nested search
const deepSearchForArrays = (obj: any, currentDepth: number = 0, maxDepth: number = 3): Participant[] => {
  if (currentDepth >= maxDepth) return [];
  
  try {
    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value) && value.length > 0) {
        paymentFormLog.extraction('FOUND_NESTED_ARRAY', { 
          depth: currentDepth, 
          key, 
          length: value.length 
        });
        const result = processArrayItems(value);
        if (result.length > 0) return result;
      }
      
      if (value && typeof value === 'object') {
        const nested = deepSearchForArrays(value, currentDepth + 1, maxDepth);
        if (nested.length > 0) return nested;
      }
    }
  } catch (error) {
    paymentFormLog.error('DEEP_SEARCH_ERROR', error, { currentDepth });
  }
  return [];
};

// Strategy 6: Trust game specific extraction
const extractFromTrustGameSession = (data: any): Participant[] => {
  try {
    if (data.gameState && data.participants) {
      const participants: Participant[] = [];
      
      // Extract Player A
      if (data.participants.playerA) {
        const playerA = data.participants.playerA;
        const earnings = (data.gameState.playerA_balance || 0) / 1000000;
        
        // CRITICAL: Trace wallet address extraction for Player A
        paymentFormLog.addressTrace('EXTRACTING_PLAYER_A_WALLET', playerA.walletAddress, 'TrustGameSession-PlayerA');
        
        const participantA = createSafeParticipant({
          id: playerA.playerId || 'playerA',
          walletAddress: playerA.walletAddress,
          displayName: playerA.displayName || `Player A - ${playerA.playerId || 'Unknown'}`,
          earnings: earnings,
          participantNumber: 1,
          sessionId: playerA.sessionId,
          experimentRole: 'Player A (Trustor)'
        });
        
        if (participantA) {
          paymentFormLog.addressTrace('PLAYER_A_PARTICIPANT_CREATED', participantA.walletAddress, 'TrustGameSession-PlayerA-Created');
          participants.push(participantA);
        }
      }
      
      // Extract Player B
      if (data.participants.playerB) {
        const playerB = data.participants.playerB;
        const earnings = (data.gameState.playerB_balance || 0) / 1000000;
        
        // CRITICAL: Trace wallet address extraction for Player B
        paymentFormLog.addressTrace('EXTRACTING_PLAYER_B_WALLET', playerB.walletAddress, 'TrustGameSession-PlayerB');
        
        const participantB = createSafeParticipant({
          id: playerB.playerId || 'playerB',
          walletAddress: playerB.walletAddress,
          displayName: playerB.displayName || `Player B - ${playerB.playerId || 'Unknown'}`,
          earnings: earnings,
          participantNumber: 2,
          sessionId: playerB.sessionId,
          experimentRole: 'Player B (Trustee)'
        });
        
        if (participantB) {
          paymentFormLog.addressTrace('PLAYER_B_PARTICIPANT_CREATED', participantB.walletAddress, 'TrustGameSession-PlayerB-Created');
          participants.push(participantB);
        }
      }
      
      if (participants.length > 0) {
        paymentFormLog.extraction('TRUST_GAME_EXTRACTION_SUCCESS', { 
          participantCount: participants.length 
        });
        return participants;
      }
    }
  } catch (error) {
    paymentFormLog.error('TRUST_GAME_EXTRACTION_ERROR', error);
  }
  return [];
};

// Strategy 7: Extract from experiment data structure
const extractFromExperimentData = (data: any): Participant[] => {
  try {
    // Check for experiment structure with participants array
    if (data.experiment && data.experiment.participants) {
      return processArrayItems(data.experiment.participants);
    }
    
    // Check for direct experiment participants
    if (data.participants && Array.isArray(data.participants)) {
      return processArrayItems(data.participants);
    }
    
    // Check for nested participant data
    if (data.data && data.data.participants) {
      return processArrayItems(data.data.participants);
    }
  } catch (error) {
    paymentFormLog.error('EXPERIMENT_DATA_EXTRACTION_ERROR', error);
  }
  return [];
};

// Helper function to check if object has participant-like properties
const hasParticipantLikeProperties = (obj: any): boolean => {
  if (!obj || typeof obj !== 'object') return false;
  
  try {
    const hasWallet = obj.walletAddress || obj.wallet || obj.address || obj.publicKey;
    const hasEarnings = typeof obj.earnings === 'number' || typeof obj.amount === 'number' || typeof obj.balance === 'number';
    const hasId = obj.id || obj.participantId || obj.playerId;
    
    return !!(hasWallet && (hasEarnings || hasId));
  } catch (error) {
    return false;
  }
};

// BULLETPROOF array processing
const processArrayItems = (items: any): Participant[] => {
  // CRITICAL: Ensure items is actually an array
  if (!Array.isArray(items)) {
    paymentFormLog.error('PROCESS_ARRAY_ITEMS_NOT_ARRAY', new Error('Not an array'), { 
      type: typeof items,
      value: items
    });
    return [];
  }
  
  paymentFormLog.extraction('PROCESSING_ARRAY_ITEMS', { itemCount: items.length });
  
  const participants: Participant[] = [];
  
  for (let i = 0; i < items.length; i++) {
    try {
      const participant = createSafeParticipant(items[i], i);
      if (participant) {
        participants.push(participant);
        paymentFormLog.participant('PARTICIPANT_PROCESSED', participant, { index: i });
      }
    } catch (error) {
      paymentFormLog.error('FAILED_TO_PROCESS_ITEM', error, { index: i });
    }
  }
  
  paymentFormLog.extraction('ARRAY_PROCESSING_COMPLETE', { 
    inputCount: items.length, 
    outputCount: participants.length 
  });
  
  return participants;
};

// BULLETPROOF participant creation
const createSafeParticipant = (item: any, index: number = 0): Participant | null => {
  try {
    if (!item || typeof item !== 'object') {
      paymentFormLog.error('ITEM_NOT_OBJECT', new Error('Item is not an object'), { 
        index, 
        itemType: typeof item,
        item: item
      });
      return null;
    }

    // CRITICAL: Safe property access with multiple fallbacks
    const walletAddress = safeStringExtract(item, ['walletAddress', 'wallet', 'address', 'publicKey']);
    
    // CRITICAL: Trace wallet address extraction
    paymentFormLog.addressTrace('WALLET_ADDRESS_EXTRACTED', walletAddress, `CreateSafeParticipant-Index${index}`);
    
    if (!walletAddress || walletAddress.length !== 58) { // STRICTER: Must be exactly 58 characters
      paymentFormLog.error('INVALID_WALLET_ADDRESS', new Error('Invalid wallet address'), { 
        index, 
        walletAddress,
        walletLength: walletAddress?.length,
        expectedLength: 58,
        item: item
      });
      return null;
    }

    // CRITICAL: Safe earnings extraction
    const earnings = safeNumberExtract(item, ['earnings', 'amount', 'balance', 'reward', 'payout']);
    if (isNaN(earnings) || earnings < 0) {
      paymentFormLog.error('INVALID_EARNINGS', new Error('Invalid earnings'), { 
        index, 
        earnings,
        item: item
      });
      // Don't return null, set to 0 instead
    }

    // Generate safe ID
    const id = safeStringExtract(item, ['id', 'participantId', 'playerId']) || `participant_${index}_${Date.now()}`;

    // Generate display name
    const displayName = safeStringExtract(item, ['displayName', 'name', 'participantName']) || 
                       `${safeStringExtract(item, ['experimentRole']) || 'Participant'} - ${id}`;

    const participant: Participant = {
      id,
      walletAddress, // CRITICAL: Use the full wallet address here
      displayName,
      earnings: Math.max(0, earnings), // Ensure non-negative
      participantNumber: safeNumberExtract(item, ['participantNumber']) || (index + 1),
      sessionId: safeStringExtract(item, ['sessionId']),
      experimentRole: safeStringExtract(item, ['experimentRole']),
      status: (item.status as any) || 'pending',
      transactionId: safeStringExtract(item, ['transactionId']),
      error: safeStringExtract(item, ['error']),
      lastUpdated: safeNumberExtract(item, ['lastUpdated']) || Date.now()
    };

    // CRITICAL: Trace the final participant wallet address
    paymentFormLog.addressTrace('PARTICIPANT_FINAL_WALLET', participant.walletAddress, `CreateSafeParticipant-Final-Index${index}`);
    paymentFormLog.participant('PARTICIPANT_CREATED', participant, { index });
    
    return participant;

  } catch (error) {
    paymentFormLog.error('PARTICIPANT_CREATION_FAILED', error, { index });
    return null;
  }
};

// Safe string extraction with fallbacks
const safeStringExtract = (obj: any, keys: string[]): string | undefined => {
  for (const key of keys) {
    try {
      if (obj[key] !== undefined && obj[key] !== null) {
        const value = String(obj[key]).trim();
        // CRITICAL: Trace string extraction for wallet addresses
        if (key.toLowerCase().includes('wallet') || key.toLowerCase().includes('address')) {
          paymentFormLog.addressTrace('STRING_EXTRACTED', value, `SafeStringExtract-${key}`);
        }
        return value;
      }
    } catch (error) {
      // Continue to next key
    }
  }
  return undefined;
};

// Safe number extraction with fallbacks
const safeNumberExtract = (obj: any, keys: string[]): number => {
  for (const key of keys) {
    try {
      if (obj[key] !== undefined && obj[key] !== null) {
        const num = Number(obj[key]);
        if (!isNaN(num)) {
          return num;
        }
      }
    } catch (error) {
      // Continue to next key
    }
  }
  return 0;
};

const PaymentTransactionForm: React.FC<PaymentTransactionFormProps> = ({
  experimentId,
  experimentTitle,
  initialParticipants,
  onClose
}) => {
  const { isConnected, connectWallet, accountAddress, sendPayment, balance, network } = useAlgorand();
  
  // BULLETPROOF STATE INITIALIZATION
  const [participants, setParticipants] = useState<Participant[]>(() => {
    paymentFormLog.info('FORM_INITIALIZATION', {
      experimentId,
      experimentTitle,
      hasInitialParticipants: !!initialParticipants,
      initialParticipantsType: typeof initialParticipants,
      initialParticipantsConstructor: initialParticipants?.constructor?.name,
      initialParticipantsPreview: initialParticipants ? 
        JSON.stringify(initialParticipants).substring(0, 200) : 'null'
    });
    
    // CRITICAL: Trace the initial participants data
    paymentFormLog.addressTrace('INITIAL_PARTICIPANTS_RAW', initialParticipants, 'FormInitialization');
    
    try {
      const extracted = extractParticipantsFromAnyData(initialParticipants);
      
      // CRITICAL: Trace each extracted participant's wallet address
      extracted.forEach((participant, index) => {
        paymentFormLog.addressTrace('EXTRACTED_PARTICIPANT_WALLET', participant.walletAddress, `FormInit-Participant${index}`);
      });
      
      paymentFormLog.info('INITIALIZATION_COMPLETE', { 
        extractedCount: extracted.length,
        participants: extracted.map(p => ({
          id: p.id,
          displayName: p.displayName,
          earnings: p.earnings,
          walletAddress: p.walletAddress.slice(-8),
          fullWalletAddress: p.walletAddress, // CRITICAL: Log full address
          walletAddressLength: p.walletAddress.length
        }))
      });
      return extracted;
    } catch (error) {
      paymentFormLog.error('INITIALIZATION_FAILED', error);
      return [];
    }
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'review' | 'confirm' | 'processing' | 'complete'>('review');
  const [processedCount, setProcessedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  // BULLETPROOF TOTAL CALCULATION
  useEffect(() => {
    paymentFormLog.info('CALCULATING_TOTAL');
    
    try {
      if (!participants || !Array.isArray(participants) || participants.length === 0) {
        paymentFormLog.info('NO_VALID_PARTICIPANTS_FOR_TOTAL');
        setTotalAmount(0);
        return;
      }

      let total = 0;
      let validCount = 0;

      for (const participant of participants) {
        if (!participant || typeof participant !== 'object') {
          paymentFormLog.error('INVALID_PARTICIPANT_IN_TOTAL', new Error('Invalid participant'), { 
            participant 
          });
          continue;
        }

        const earnings = Number(participant.earnings);
        if (isNaN(earnings) || earnings < 0) {
          paymentFormLog.error('INVALID_EARNINGS_IN_TOTAL', new Error('Invalid earnings'), { 
            participantId: participant.id, 
            earnings: participant.earnings 
          });
          continue;
        }

        total += earnings;
        validCount++;
      }

      paymentFormLog.info('TOTAL_CALCULATED', { 
        total, 
        validCount, 
        totalParticipants: participants.length 
      });
      
      setTotalAmount(total);

    } catch (error) {
      paymentFormLog.error('TOTAL_CALCULATION_ERROR', error);
      setTotalAmount(0);
    }
  }, [participants]);

  const formatAddress = (address: string) => {
    if (!address || typeof address !== 'string') {
      return 'Invalid Address';
    }
    // CRITICAL: This is for DISPLAY ONLY - never use this for transactions
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const updateParticipantStatus = (id: string, updates: Partial<Participant>) => {
    paymentFormLog.info('UPDATING_PARTICIPANT_STATUS', { id, updates });
    
    setParticipants(prev => {
      if (!Array.isArray(prev)) {
        paymentFormLog.error('PREVIOUS_PARTICIPANTS_NOT_ARRAY', new Error('Not an array'));
        return [];
      }
      
      return prev.map(p => {
        if (!p || typeof p !== 'object' || !p.id) {
          paymentFormLog.error('INVALID_PARTICIPANT_IN_UPDATE', new Error('Invalid participant'), { 
            participant: p 
          });
          return p;
        }
        
        return p.id === id ? { ...p, ...updates, lastUpdated: Date.now() } : p;
      });
    });
  };

  const validateParticipant = (participant: Participant): string | null => {
    if (!participant) {
      return 'Participant is null or undefined';
    }
    
    if (!participant.walletAddress || typeof participant.walletAddress !== 'string') {
      return 'Invalid wallet address';
    }
    
    if (participant.walletAddress.length !== 58) {
      return 'Wallet address must be 58 characters long';
    }
    
    if (typeof participant.earnings !== 'number' || participant.earnings < 0 || isNaN(participant.earnings)) {
      return 'Invalid earnings amount';
    }
    
    if (participant.earnings > 1000) {
      return 'Earnings amount seems too high (>1000 ALGO)';
    }
    
    return null;
  };

  const processPayments = async () => {
    if (!isConnected || !accountAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (balance < totalAmount) {
      toast.error(`Insufficient balance. You have ${balance.toFixed(3)} ALGO but need ${totalAmount.toFixed(3)} ALGO`);
      return;
    }

    paymentFormLog.info('PAYMENT_PROCESSING_STARTED', {
      participantCount: participants.length,
      totalAmount,
      balance,
      network
    });
    
    // BULLETPROOF VALIDATION
    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      paymentFormLog.error('NO_VALID_PARTICIPANTS_FOR_PAYMENT', new Error('No participants'));
      toast.error('No participants found for payment');
      return;
    }

    // Filter valid pending participants
    const validPendingParticipants: Participant[] = [];
    
    for (const participant of participants) {
      if (!participant || typeof participant !== 'object') {
        paymentFormLog.error('SKIPPING_INVALID_PARTICIPANT', new Error('Invalid participant'), { 
          participant 
        });
        continue;
      }
      
      if (participant.status !== 'pending') {
        paymentFormLog.info('SKIPPING_NON_PENDING_PARTICIPANT', { 
          participantId: participant.id, 
          status: participant.status 
        });
        continue;
      }
      
      const validationError = validateParticipant(participant);
      if (validationError) {
        paymentFormLog.error('PARTICIPANT_VALIDATION_FAILED', new Error(validationError), { 
          participantId: participant.id 
        });
        updateParticipantStatus(participant.id, { status: 'failed', error: validationError });
        continue;
      }
      
      validPendingParticipants.push(participant);
    }
    
    if (validPendingParticipants.length === 0) {
      toast.error('No valid pending participants found');
      return;
    }

    paymentFormLog.info('VALID_PARTICIPANTS_IDENTIFIED', { 
      validCount: validPendingParticipants.length,
      totalCount: participants.length
    });

    setIsProcessing(true);
    setCurrentStep('processing');
    setProcessedCount(0);
    setFailedCount(0);
    
    for (let i = 0; i < validPendingParticipants.length; i++) {
      const participant = validPendingParticipants[i];
      
      try {
        updateParticipantStatus(participant.id, { status: 'processing' });
        
        // CRITICAL: Trace wallet address before payment
        paymentFormLog.addressTrace('BEFORE_PAYMENT', participant.walletAddress, `Payment-${i}-${participant.id}`);
        
        paymentFormLog.info('PROCESSING_INDIVIDUAL_PAYMENT', {
          index: i + 1,
          total: validPendingParticipants.length,
          participantId: participant.id,
          displayName: participant.displayName,
          amount: participant.earnings,
          walletAddress: participant.walletAddress.slice(-8),
          fullWalletAddress: participant.walletAddress, // CRITICAL: Log full address
          walletAddressLength: participant.walletAddress.length
        });
        
        toast.loading(`Sending ${participant.earnings.toFixed(3)} ALGO to ${participant.displayName}...`, {
          id: `payment-${participant.id}`
        });

        // CRITICAL: Pass the FULL wallet address to sendPayment
        const transactionId = await sendPayment(
          participant.walletAddress, // This MUST be the full 58-character address
          participant.earnings,
          `Experiment payment: ${experimentTitle} - ${participant.displayName}`
        );

        updateParticipantStatus(participant.id, {
          status: 'completed',
          transactionId
        });

        setProcessedCount(prev => prev + 1);
        
        toast.success(`Payment sent to ${participant.displayName}!`, {
          id: `payment-${participant.id}`
        });

        paymentFormLog.info('INDIVIDUAL_PAYMENT_SUCCESS', {
          participantId: participant.id,
          transactionId: transactionId.slice(0, 16),
          amount: participant.earnings
        });

        // Add delay between transactions
        if (i < validPendingParticipants.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Payment failed';
        
        paymentFormLog.error('INDIVIDUAL_PAYMENT_FAILED', error, {
          participantId: participant.id,
          amount: participant.earnings,
          errorMessage,
          walletAddress: participant.walletAddress.slice(-8),
          fullWalletAddress: participant.walletAddress // CRITICAL: Log full address
        });
        
        updateParticipantStatus(participant.id, {
          status: 'failed',
          error: errorMessage
        });

        setFailedCount(prev => prev + 1);
        
        toast.error(`Payment failed for ${participant.displayName}: ${errorMessage}`, {
          id: `payment-${participant.id}`
        });
      }
    }

    setIsProcessing(false);
    setCurrentStep('complete');
    
    paymentFormLog.info('PAYMENT_PROCESSING_COMPLETE', {
      processed: processedCount,
      failed: failedCount,
      total: validPendingParticipants.length
    });
    
    if (failedCount === 0) {
      toast.success('All payments completed successfully!');
    } else {
      toast.error(`${failedCount} payments failed. Please retry failed payments.`);
    }
  };

  const retryFailedPayments = async () => {
    const failedParticipants = participants.filter(p => p && p.status === 'failed');
    
    paymentFormLog.info('RETRYING_FAILED_PAYMENTS', { 
      failedCount: failedParticipants.length 
    });
    
    // Reset failed participants to pending
    failedParticipants.forEach(p => {
      updateParticipantStatus(p.id, { status: 'pending', error: undefined });
    });
    
    setCurrentStep('review');
    setFailedCount(0);
  };

  const exportResults = () => {
    try {
      const csvContent = [
        ['Participant ID', 'Display Name', 'Wallet Address', 'Earnings (ALGO)', 'Status', 'Transaction ID', 'Error'].join(','),
        ...participants.map(p => [
          p.id || '',
          p.displayName || '',
          p.walletAddress || '', // CRITICAL: Export full wallet address
          (p.earnings || 0).toFixed(6),
          p.status || 'unknown',
          p.transactionId || '',
          p.error || ''
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `experiment-${experimentId}-payments.csv`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success('Payment results exported!');
      paymentFormLog.info('RESULTS_EXPORTED', { participantCount: participants.length });
    } catch (error) {
      paymentFormLog.error('EXPORT_FAILED', error);
      toast.error('Failed to export results');
    }
  };

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Payment Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-blue-700">Participants</p>
            <p className="font-bold text-blue-900">{participants.length}</p>
          </div>
          <div>
            <p className="text-blue-700">Total Amount</p>
            <p className="font-bold text-blue-900">{totalAmount.toFixed(3)} ALGO</p>
          </div>
          <div>
            <p className="text-blue-700">Your Balance</p>
            <p className={`font-bold ${balance >= totalAmount ? 'text-green-600' : 'text-red-600'}`}>
              {balance.toFixed(3)} ALGO
            </p>
          </div>
          <div>
            <p className="text-blue-700">Network</p>
            <p className="font-bold text-blue-900 capitalize">{network}</p>
          </div>
        </div>
      </div>

      {balance < totalAmount && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h4 className="font-medium text-red-900">Insufficient Balance</h4>
          </div>
          <p className="text-sm text-red-800 mt-1">
            You need {(totalAmount - balance).toFixed(3)} more ALGO to complete all payments.
          </p>
        </div>
      )}

      {participants.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <h4 className="font-medium text-yellow-900">No Valid Participants Found</h4>
          </div>
          <p className="text-sm text-yellow-800 mt-1">
            No valid participant data found for payment processing. Please check the experiment data.
          </p>
          <div className="mt-3 p-3 bg-yellow-100 rounded text-xs text-yellow-700">
            <p className="font-medium">Debug Information:</p>
            <p>• Initial data type: {typeof initialParticipants}</p>
            <p>• Initial is array: {Array.isArray(initialParticipants) ? 'Yes' : 'No'}</p>
            <p>• Extraction result: {participants.length} participants</p>
            <p>• Data preview: {initialParticipants ? JSON.stringify(initialParticipants).substring(0, 100) + '...' : 'null'}</p>
          </div>
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Participant</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Wallet</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Earnings</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((participant, index) => (
                <tr key={participant.id} className="border-t border-gray-200">
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{participant.displayName}</p>
                      <p className="text-xs text-gray-500">{participant.experimentRole || 'Participant'}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {formatAddress(participant.walletAddress)}
                    </code>
                    {/* CRITICAL: Add full address for debugging */}
                    <div className="text-xs text-gray-400 mt-1" title={participant.walletAddress}>
                      Full: {participant.walletAddress.length} chars
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="font-bold text-green-600">
                      {participant.earnings.toFixed(3)} ALGO
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      participant.status === 'completed' ? 'bg-green-100 text-green-800' :
                      participant.status === 'failed' ? 'bg-red-100 text-red-800' :
                      participant.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {participant.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderProcessingStep = () => (
    <div className="space-y-6 text-center">
      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Payments</h3>
        <p className="text-gray-600">
          Sending payments to participants. Please do not close this window.
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Progress</span>
          <span className="text-sm font-medium text-gray-900">
            {processedCount + failedCount} / {participants.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
            style={{ 
              width: `${participants.length > 0 ? ((processedCount + failedCount) / participants.length) * 100 : 0}%` 
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>Completed: {processedCount}</span>
          <span>Failed: {failedCount}</span>
        </div>
      </div>

      <div className="max-h-48 overflow-y-auto">
        {participants.map((participant) => (
          <div key={participant.id} className="flex items-center justify-between p-2 border-b border-gray-100 last:border-b-0">
            <span className="text-sm text-gray-700">{participant.displayName}</span>
            <div className="flex items-center space-x-2">
              {participant.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-600" />}
              {participant.status === 'failed' && <AlertCircle className="w-4 h-4 text-red-600" />}
              {participant.status === 'processing' && <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />}
              <span className="text-xs text-gray-500">{participant.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="space-y-6 text-center">
      <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Payments Complete</h3>
        <p className="text-gray-600">
          {failedCount === 0 ? 
            'All payments have been processed successfully!' :
            `${processedCount} payments completed, ${failedCount} failed.`
          }
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-2xl font-bold text-green-600">{processedCount}</p>
          <p className="text-sm text-green-700">Successful</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-2xl font-bold text-red-600">{failedCount}</p>
          <p className="text-sm text-red-700">Failed</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-2xl font-bold text-blue-600">
            {(processedCount * totalAmount / Math.max(participants.length, 1)).toFixed(3)}
          </p>
          <p className="text-sm text-blue-700">ALGO Sent</p>
        </div>
      </div>

      {failedCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-900 mb-2">Failed Payments</h4>
          <div className="space-y-2">
            {participants.filter(p => p.status === 'failed').map((participant) => (
              <div key={participant.id} className="text-sm text-yellow-800">
                <span className="font-medium">{participant.displayName}:</span> {participant.error || 'Unknown error'}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <CreditCard className="w-6 h-6 mr-2" />
              Payment Transaction Form
            </h2>
            <p className="text-sm text-gray-600 mt-1">{experimentTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {!isConnected ? (
            <div className="text-center py-8">
              <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Your Wallet</h3>
              <p className="text-gray-600 mb-6">
                Please connect your Algorand wallet to process payments.
              </p>
              <button
                onClick={connectWallet}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Connect Wallet
              </button>
            </div>
          ) : (
            <>
              {currentStep === 'review' && renderReviewStep()}
              {currentStep === 'processing' && renderProcessingStep()}
              {currentStep === 'complete' && renderCompleteStep()}
            </>
          )}
        </div>

        {/* Footer */}
        {isConnected && (
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-4">
              {currentStep === 'complete' && (
                <>
                  <button
                    onClick={exportResults}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export Results</span>
                  </button>
                  
                  {failedCount > 0 && (
                    <button
                      onClick={retryFailedPayments}
                      className="flex items-center space-x-2 px-4 py-2 text-yellow-700 bg-yellow-100 border border-yellow-300 rounded-lg hover:bg-yellow-200 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Retry Failed</span>
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center space-x-3">
              {currentStep === 'review' && (
                <>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={processPayments}
                    disabled={balance < totalAmount || isProcessing || participants.length === 0}
                    className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    <span>Process Payments</span>
                  </button>
                </>
              )}
              
              {currentStep === 'complete' && (
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default PaymentTransactionForm;