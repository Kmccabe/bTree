import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PeraWalletConnect } from '@perawallet/connect';
import algosdk from 'algosdk';
import toast from 'react-hot-toast';

export type AlgorandNetwork = 'mainnet' | 'testnet';

interface AlgorandContextType {
  isConnected: boolean;
  accountAddress: string | null;
  balance: number;
  balanceInMicroAlgos: number;
  network: AlgorandNetwork;
  isLoadingBalance: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: (network: AlgorandNetwork) => Promise<void>;
  refreshBalance: () => Promise<void>;
  signTransaction: (txn: algosdk.Transaction) => Promise<Uint8Array>;
  sendPayment: (toAddress: string, amountInAlgo: number, note?: string) => Promise<string>;
  peraWallet: PeraWalletConnect;
  algodClient: algosdk.Algodv2;
}

const AlgorandContext = createContext<AlgorandContextType | undefined>(undefined);

const peraWallet = new PeraWalletConnect({
  shouldShowSignTxnToast: false,
});

interface AlgorandProviderProps {
  children: ReactNode;
}

// CRITICAL: Enhanced Algorand node configuration with explicit HTTPS port
const getAlgodClient = (network: AlgorandNetwork) => {
  if (network === 'mainnet') {
    return new algosdk.Algodv2(
      '',
      'https://mainnet-api.algonode.cloud',
      '443' // Explicitly specify HTTPS port for robust connection
    );
  } else {
    return new algosdk.Algodv2(
      '',
      'https://testnet-api.algonode.cloud',
      '443' // Explicitly specify HTTPS port for robust connection
    );
  }
};

// Enhanced logging utility for payment operations
const paymentLog = {
  info: (action: string, data: any = {}) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 💰 PAYMENT_INFO: ${action}`, data);
  },
  error: (action: string, error: any, data: any = {}) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] 💰 PAYMENT_ERROR: ${action}`, { 
      error: error?.message || error, 
      stack: error?.stack,
      ...data 
    });
  },
  transaction: (action: string, txData: any) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 💰 PAYMENT_TX: ${action}`, txData);
  },
  network: (action: string, data: any = {}) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 💰 NETWORK: ${action}`, data);
  }
};

// CRITICAL: BigInt-safe JSON replacer function
const bigIntReplacer = (key: string, value: any): any => {
  if (typeof value === 'bigint') {
    return value.toString() + 'n'; // Add 'n' suffix to indicate it was a BigInt
  }
  return value;
};

// CRITICAL: Multiple output methods for transaction parameters
const logTransactionParams = (suggestedParams: any, attempt: number) => {
  // Method 1: Fire emoji banner with console.log
  console.log(
    `\n` +
    `🚨🔥🚨🔥🚨🔥🚨🔥🚨🔥🚨🔥🚨🔥🚨🔥🚨🔥🚨🔥🚨🔥🚨🔥🚨🔥🚨🔥🚨🔥🚨🔥\n` +
    `🔥                    RAW TRANSACTION PARAMS RECEIVED                    🔥\n` +
    `🔥                           ATTEMPT ${attempt}                                🔥\n` +
    `🚨🔥🚨🔥🚨🔥🚨🔥🚨🔥🚨🔥🚨🔥🚨🔥🚨🔥🚨🔥🚨🔥🚨🔥🚨🔥🚨🔥🚨🔥🚨🔥🚨🔥\n`
  );
  
  // Method 2: console.table for structured view
  console.table(suggestedParams);
  
  // Method 3: JSON.stringify with BigInt replacer
  console.log('📋 Raw Parameters Object (JSON):', JSON.stringify(suggestedParams, bigIntReplacer, 2));
  
  // Method 4: Individual property logging
  console.log('🔍 Individual Properties:');
  Object.keys(suggestedParams).forEach(key => {
    const value = suggestedParams[key];
    console.log(`  ${key}:`, value, `(type: ${typeof value})`);
  });
  
  // Method 5: console.dir for deep inspection
  console.dir(suggestedParams, { depth: null, colors: true });
  
  // Method 6: console.warn for visibility
  console.warn('⚠️ TRANSACTION PARAMS:', suggestedParams);
  
  // Method 7: console.error for maximum visibility
  console.error('🚨 FORCED VISIBILITY - TRANSACTION PARAMS:', suggestedParams);
  
  // Method 8: Direct property access logging
  console.log('🎯 Direct Property Access:');
  console.log('  fee:', suggestedParams.fee);
  console.log('  firstRound:', suggestedParams.firstRound);
  console.log('  lastRound:', suggestedParams.lastRound);
  console.log('  genesisID:', suggestedParams.genesisID);
  console.log('  genesisHash:', suggestedParams.genesisHash);
  
  console.log(
    `🚨🔥🚨🔥🚨🔥🚨🔥🚨🔥🚨🔥🚨🔥🚨🔥🚨🔥🚨🔥🚨🔥🚨🔥🚨🔥🚨🔥🚨🔥🚨🔥🚨🔥\n`
  );
};

// CRITICAL: Enhanced transaction parameter validation for algosdk v3.0.0
const validateTransactionParams = (params: any): void => {
  paymentLog.transaction('VALIDATING_TRANSACTION_PARAMS', {
    fee: params.fee?.toString(),
    firstRound: params.firstRound?.toString(),
    firstRoundType: typeof params.firstRound,
    lastRound: params.lastRound?.toString(),
    lastRoundType: typeof params.lastRound,
    genesisID: params.genesisID,
    genesisHash: params.genesisHash ? 'present' : 'missing',
    genesisHashType: typeof params.genesisHash,
    genesisHashLength: params.genesisHash?.length
  });

  // algosdk v3.0.0 uses firstRound and lastRound
  if (params.firstRound === undefined || params.firstRound === null) {
    throw new Error('Transaction parameter firstRound is undefined or null. The Algorand node may not be responding correctly.');
  }

  if (params.lastRound === undefined || params.lastRound === null) {
    throw new Error('Transaction parameter lastRound is undefined or null. The Algorand node may not be responding correctly.');
  }

  // Convert BigInt to number for validation if needed
  const firstRoundNum = typeof params.firstRound === 'bigint' ? Number(params.firstRound) : params.firstRound;
  const lastRoundNum = typeof params.lastRound === 'bigint' ? Number(params.lastRound) : params.lastRound;

  paymentLog.transaction('CONVERTED_PARAMS_FOR_VALIDATION', {
    originalFirstRound: params.firstRound?.toString(),
    convertedFirstRound: firstRoundNum,
    originalLastRound: params.lastRound?.toString(),
    convertedLastRound: lastRoundNum,
    firstRoundIsNumber: typeof firstRoundNum === 'number',
    lastRoundIsNumber: typeof lastRoundNum === 'number'
  });

  if (typeof firstRoundNum !== 'number' || firstRoundNum <= 0) {
    throw new Error(`Invalid firstRound value: ${params.firstRound} (converted: ${firstRoundNum}). Expected a positive number.`);
  }

  if (typeof lastRoundNum !== 'number' || lastRoundNum <= 0) {
    throw new Error(`Invalid lastRound value: ${params.lastRound} (converted: ${lastRoundNum}). Expected a positive number.`);
  }

  if (lastRoundNum <= firstRoundNum) {
    throw new Error(`Invalid round range: lastRound (${lastRoundNum}) must be greater than firstRound (${firstRoundNum}).`);
  }

  if (!params.genesisID || typeof params.genesisID !== 'string') {
    throw new Error('Transaction parameter genesisID is missing or invalid.');
  }

  // FIXED: More flexible genesisHash validation
  if (!params.genesisHash) {
    throw new Error('Transaction parameter genesisHash is missing.');
  }

  // Check if genesisHash is a Uint8Array, string, or Buffer
  const isValidGenesisHash = 
    params.genesisHash instanceof Uint8Array ||
    (typeof params.genesisHash === 'string' && params.genesisHash.length > 0) ||
    (params.genesisHash && typeof params.genesisHash === 'object' && params.genesisHash.length !== undefined);

  if (!isValidGenesisHash) {
    paymentLog.error('GENESIS_HASH_VALIDATION_DETAILS', new Error('Invalid genesisHash'), {
      genesisHash: params.genesisHash,
      genesisHashType: typeof params.genesisHash,
      genesisHashConstructor: params.genesisHash?.constructor?.name,
      isUint8Array: params.genesisHash instanceof Uint8Array,
      hasLength: params.genesisHash?.length !== undefined,
      length: params.genesisHash?.length
    });
    throw new Error('Transaction parameter genesisHash is invalid. Expected Uint8Array, string, or Buffer.');
  }

  paymentLog.transaction('TRANSACTION_PARAMS_VALIDATION_PASSED', {
    firstRound: firstRoundNum,
    lastRound: lastRoundNum,
    roundRange: lastRoundNum - firstRoundNum,
    genesisID: params.genesisID,
    genesisHashType: typeof params.genesisHash,
    genesisHashValid: true
  });
};

// CRITICAL: Retry logic for transaction parameter fetching
const getTransactionParamsWithRetry = async (
  algodClient: algosdk.Algodv2, 
  network: AlgorandNetwork, 
  maxRetries: number = 5
): Promise<any> => {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      paymentLog.network('FETCHING_TRANSACTION_PARAMS_ATTEMPT', { 
        attempt, 
        maxRetries, 
        network 
      });

      // First, check node health
      const nodeStatus = await algodClient.status().do();
      paymentLog.network('NODE_HEALTH_CHECK', {
        lastRound: nodeStatus['last-round'],
        timeSinceLastRound: nodeStatus['time-since-last-round'],
        network,
        attempt
      });

      // Fetch transaction parameters
      const suggestedParams = await algodClient.getTransactionParams().do();
      
      // 🚨🔥 ENHANCED LOGGING: Multiple output methods for maximum visibility 🔥🚨
      logTransactionParams(suggestedParams, attempt);

      // CRITICAL: Validate transaction parameters before proceeding
      validateTransactionParams(suggestedParams);
      
      // CRITICAL: Ensure minimum fee is set (fix for fee: 0 issue)
      if (suggestedParams.fee === 0) {
        paymentLog.network('FIXING_ZERO_FEE', { 
          originalFee: suggestedParams.fee,
          newFee: 1000,
          network,
          attempt
        });
        suggestedParams.fee = 1000; // Set minimum fee of 1000 microAlgos
      }
      
      paymentLog.transaction('TRANSACTION_PARAMS_SUCCESS', {
        fee: suggestedParams.fee,
        firstRound: suggestedParams.firstRound?.toString(),
        lastRound: suggestedParams.lastRound?.toString(),
        genesisHash: suggestedParams.genesisHash ? suggestedParams.genesisHash.slice(0, 16) : 'missing',
        genesisID: suggestedParams.genesisID,
        network,
        attempt,
        retriesUsed: attempt - 1
      });

      return suggestedParams;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      paymentLog.error('TRANSACTION_PARAMS_ATTEMPT_FAILED', lastError, { 
        attempt, 
        maxRetries, 
        network,
        willRetry: attempt < maxRetries
      });

      // If this is not the last attempt, wait before retrying
      if (attempt < maxRetries) {
        const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5 seconds
        paymentLog.network('RETRYING_AFTER_DELAY', { 
          delayMs, 
          nextAttempt: attempt + 1, 
          network 
        });
        
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  // All retries failed
  paymentLog.error('ALL_TRANSACTION_PARAMS_RETRIES_FAILED', lastError, { 
    maxRetries, 
    network 
  });

  // Provide more specific error messages based on the type of failure
  if (lastError?.message.includes('firstRound') || lastError?.message.includes('lastRound')) {
    throw new Error(`Algorand node error after ${maxRetries} attempts: ${lastError.message}. The ${network} network may be experiencing issues. Please try again later.`);
  } else if (lastError?.message.includes('genesisID') || lastError?.message.includes('genesisHash')) {
    throw new Error(`Network configuration error after ${maxRetries} attempts: ${lastError.message}. Please check your network connection and try again.`);
  } else {
    throw new Error(`Failed to get transaction parameters after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}. Please check your connection and try again.`);
  }
};

// CRITICAL: Address validation and cleaning function
const validateAndCleanAddress = (address: string, context: string = ''): string => {
  try {
    paymentLog.info('ADDRESS_VALIDATION_START', {
      address: address,
      addressLength: address?.length,
      addressType: typeof address,
      context: context
    });

    // Basic validation
    if (!address || typeof address !== 'string') {
      throw new Error(`Address is not a valid string: ${typeof address}`);
    }

    if (address.length !== 58) {
      throw new Error(`Address length is ${address.length}, expected 58 characters`);
    }

    // Validate using Algorand SDK
    const decoded = algosdk.decodeAddress(address);
    const cleanAddress = algosdk.encodeAddress(decoded.publicKey);
    
    paymentLog.info('ADDRESS_VALIDATION_SUCCESS', {
      originalAddress: address,
      cleanedAddress: cleanAddress,
      addressesMatch: address === cleanAddress,
      context: context
    });
    
    return cleanAddress;
  } catch (error) {
    paymentLog.error('ADDRESS_VALIDATION_FAILED', error, {
      address: address,
      addressLength: address?.length,
      context: context
    });
    throw new Error(`Invalid Algorand address: ${error.message}`);
  }
};

// CRITICAL: Utility functions following Algorand best practices
const algoToMicroAlgo = (algoAmount: number): number => {
  const microAlgos = Math.floor(algoAmount * 1000000);
  paymentLog.transaction('ALGO_TO_MICROALGO_CONVERSION', {
    algoAmount,
    microAlgos
  });
  return microAlgos;
};

const microAlgoToAlgo = (microAlgoAmount: number): number => {
  return microAlgoAmount / 1000000;
};

export const AlgorandProvider: React.FC<AlgorandProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [accountAddress, setAccountAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [balanceInMicroAlgos, setBalanceInMicroAlgos] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [network, setNetwork] = useState<AlgorandNetwork>(() => {
    const savedNetwork = localStorage.getItem('algorand-network');
    return (savedNetwork as AlgorandNetwork) || 'testnet';
  });
  const [algodClient, setAlgodClient] = useState(() => getAlgodClient(network));

  useEffect(() => {
    localStorage.setItem('algorand-network', network);
    const newClient = getAlgodClient(network);
    setAlgodClient(newClient);
    
    paymentLog.network('NETWORK_SWITCHED', { 
      network, 
      nodeUrl: network === 'mainnet' ? 'mainnet-api.algonode.cloud' : 'testnet-api.algonode.cloud',
      port: '443'
    });
    
    if (isConnected && accountAddress) {
      setBalance(0);
      setBalanceInMicroAlgos(0);
      setTimeout(() => {
        fetchBalance(accountAddress, newClient);
      }, 1000);
    }
  }, [network]);

  useEffect(() => {
    peraWallet.reconnectSession().then((accounts) => {
      if (accounts.length) {
        setAccountAddress(accounts[0]);
        setIsConnected(true);
        paymentLog.info('WALLET_RECONNECTED', { 
          address: accounts[0].slice(-8), 
          network 
        });
        setTimeout(() => {
          fetchBalance(accounts[0], algodClient);
        }, 1000);
      }
    }).catch((error) => {
      paymentLog.error('WALLET_RECONNECTION_FAILED', error);
    });

    peraWallet.connector?.on('disconnect', () => {
      paymentLog.info('WALLET_DISCONNECTED');
      setIsConnected(false);
      setAccountAddress(null);
      setBalance(0);
      setBalanceInMicroAlgos(0);
    });
  }, []);

  const fetchBalance = async (address: string, client?: algosdk.Algodv2, retryCount = 0) => {
    const clientToUse = client || algodClient;
    setIsLoadingBalance(true);
    
    try {
      paymentLog.info('FETCHING_BALANCE', { 
        address: address.slice(-8), 
        network, 
        attempt: retryCount + 1,
        nodeUrl: network === 'mainnet' ? 'mainnet-api.algonode.cloud' : 'testnet-api.algonode.cloud',
        port: '443'
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        const nodeStatus = await clientToUse.status().do();
        paymentLog.network('NODE_STATUS_SUCCESS', { 
          lastRound: nodeStatus['last-round'],
          network,
          timeSinceLastRound: nodeStatus['time-since-last-round']
        });
      } catch (statusError) {
        paymentLog.error('NODE_STATUS_FAILED', statusError, { network });
        throw new Error(`Failed to connect to ${network} node: ${statusError.message}`);
      }
      
      let accountInfo;
      try {
        accountInfo = await clientToUse.accountInformation(address).do();
        paymentLog.info('ACCOUNT_INFO_SUCCESS', {
          address: address.slice(-8),
          amount: accountInfo.amount?.toString(),
          minBalance: accountInfo['min-balance']?.toString(),
          network
        });
      } catch (accountError) {
        paymentLog.error('ACCOUNT_INFO_FAILED', accountError, { address: address.slice(-8), network });
        throw new Error(`Failed to fetch account information: ${accountError.message}`);
      }
      
      const balanceInMicroAlgosNumber = Number(accountInfo.amount || 0);
      const balanceInAlgo = microAlgoToAlgo(balanceInMicroAlgosNumber);
      
      paymentLog.info('BALANCE_FETCHED_SUCCESS', { 
        balanceInAlgo, 
        balanceInMicroAlgos: balanceInMicroAlgosNumber, 
        network,
        minBalance: accountInfo['min-balance'] || 0
      });
      
      setBalanceInMicroAlgos(balanceInMicroAlgosNumber);
      setBalance(balanceInAlgo);
      
      if (balanceInAlgo === 0 && network === 'testnet') {
        toast.info('No TestNet ALGO found. Visit the faucet to get test tokens!', {
          duration: 5000,
        });
      } else if (balanceInAlgo > 0) {
        toast.success(`Balance loaded: ${balanceInAlgo.toFixed(2)} ALGO on ${network.toUpperCase()}`);
      }
    } catch (error) {
      paymentLog.error('BALANCE_FETCH_FAILED', error, { 
        address: address.slice(-8), 
        network, 
        attempt: retryCount + 1,
        nodeUrl: network === 'mainnet' ? 'mainnet-api.algonode.cloud' : 'testnet-api.algonode.cloud',
        port: '443'
      });
      
      if (retryCount < 3) {
        const retryDelay = (retryCount + 1) * 2000;
        paymentLog.info('BALANCE_FETCH_RETRY', { 
          retryCount: retryCount + 1, 
          retryDelay,
          network 
        });
        setTimeout(() => {
          fetchBalance(address, clientToUse, retryCount + 1);
        }, retryDelay);
        return;
      }
      
      toast.error(`Failed to fetch balance on ${network.toUpperCase()}. Please check your connection and try again.`);
      setBalance(0);
      setBalanceInMicroAlgos(0);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const refreshBalance = async () => {
    if (accountAddress && isConnected) {
      toast.loading('Refreshing balance...', { id: 'refresh-balance' });
      await fetchBalance(accountAddress);
      toast.dismiss('refresh-balance');
    }
  };

  const connectWallet = async () => {
    try {
      paymentLog.info('CONNECTING_WALLET', { network });
      
      const accounts = await peraWallet.connect();
      setAccountAddress(accounts[0]);
      setIsConnected(true);
      
      paymentLog.info('WALLET_CONNECTED_SUCCESS', { 
        address: accounts[0].slice(-8), 
        network 
      });
      
      toast.success(`Wallet connected to ${network.toUpperCase()}!`);
      
      setTimeout(() => {
        fetchBalance(accounts[0]);
      }, 1000);
    } catch (error) {
      paymentLog.error('WALLET_CONNECTION_FAILED', error, { network });
      toast.error('Failed to connect wallet. Please try again.');
    }
  };

  const disconnectWallet = () => {
    paymentLog.info('DISCONNECTING_WALLET', { 
      address: accountAddress?.slice(-8), 
      network 
    });
    
    peraWallet.disconnect();
    setIsConnected(false);
    setAccountAddress(null);
    setBalance(0);
    setBalanceInMicroAlgos(0);
    toast.success('Wallet disconnected');
  };

  const switchNetwork = async (newNetwork: AlgorandNetwork) => {
    if (newNetwork === network) return;
    
    const wasConnected = isConnected;
    const previousAddress = accountAddress;
    
    paymentLog.network('SWITCHING_NETWORK', { 
      from: network, 
      to: newNetwork, 
      wasConnected 
    });
    
    if (isConnected) {
      peraWallet.disconnect();
      setIsConnected(false);
      setAccountAddress(null);
      setBalance(0);
      setBalanceInMicroAlgos(0);
    }
    
    setNetwork(newNetwork);
    
    toast.success(`Switched to ${newNetwork.toUpperCase()}`);
    
    if (wasConnected && previousAddress) {
      toast.info('Please reconnect your wallet to the new network');
    }
  };

  // FIXED: Enhanced signTransaction method for algosdk v3.0.0 and Pera Wallet compatibility
  const signTransaction = async (txn: algosdk.Transaction): Promise<Uint8Array> => {
    try {
      // Get the receiver and amount using the correct algosdk v3.0.0 properties
      const receiver = txn.to;
      const amount = txn.amount;
      
      paymentLog.transaction('SIGNING_TRANSACTION_START', {
        sender: txn.from?.toString(),
        receiver: receiver?.toString(),
        amount: amount?.toString(),
        fee: txn.fee?.toString(),
        network
      });

      // CRITICAL: Log the complete transaction object before signing
      paymentLog.transaction('TRANSACTION_OBJECT_BEFORE_SIGNING', {
        txnType: txn.type,
        sender: txn.from?.toString(),
        receiver: receiver?.toString(),
        amount: amount?.toString(),
        fee: txn.fee?.toString(),
        firstRound: txn.firstRound?.toString(),
        lastRound: txn.lastRound?.toString(),
        genesisID: txn.genesisID,
        genesisHash: txn.genesisHash ? Array.from(txn.genesisHash).slice(0, 8).join(',') + '...' : 'missing',
        note: txn.note ? new TextDecoder().decode(txn.note) : 'no note',
        closeRemainderTo: txn.closeRemainderTo?.toString(),
        assetIndex: txn.assetIndex?.toString(),
        flatFee: txn.flatFee,
        lease: txn.lease ? Array.from(txn.lease).slice(0, 8).join(',') + '...' : 'no lease',
        rekeyTo: txn.rekeyTo?.toString(),
        group: txn.group ? Array.from(txn.group).slice(0, 8).join(',') + '...' : 'no group'
      });

      // CRITICAL: Validation for algosdk v3.0.0
      if (!txn.from) {
        throw new Error('Transaction sender address is null or undefined');
      }
      
      // For payment transactions, check the receiver
      if (txn.type === 'pay' && !receiver) {
        throw new Error('Transaction receiver is null or undefined');
      }
      
      // For payment transactions, check amount
      if (txn.type === 'pay' && (amount === undefined || amount === null)) {
        throw new Error('Transaction amount is null or undefined');
      }

      paymentLog.transaction('TRANSACTION_VALIDATION_PASSED', {
        sender: txn.from.toString(),
        receiver: receiver?.toString() || 'N/A',
        amount: amount?.toString() || 'N/A',
        network
      });
      
      // FIXED: Pass the transaction object directly to Pera Wallet
      // algosdk v3.0.0 should be fully compatible with Pera Wallet Connect v1.4.1
      paymentLog.transaction('PASSING_TXN_TO_PERA_WALLET_V3', {
        txnConstructor: txn.constructor.name,
        txnType: typeof txn,
        isTransaction: txn instanceof algosdk.Transaction,
        hasRequiredProperties: !!(txn.from && txn.fee && txn.firstRound && txn.lastRound),
        algodkVersion: '3.0.0'
      });

      // CRITICAL: Pass the transaction object directly (algosdk v3.0.0 compatible)
      const signedTxnArray = await peraWallet.signTransaction([
        { txn: txn }  // Pass the transaction object directly
      ]);
      
      paymentLog.transaction('TRANSACTION_SIGNED_SUCCESS', { 
        signedTxnLength: signedTxnArray.length,
        network
      });
      
      // Return the first (and only) signed transaction
      return signedTxnArray[0];
    } catch (error) {
      paymentLog.error('TRANSACTION_SIGNING_FAILED', error, { 
        network,
        txnSender: txn?.from?.toString(),
        txnReceiver: txn?.to?.toString(),
        txnAmount: txn?.amount?.toString()
      });
      throw error;
    }
  };

  // CRITICAL: Enhanced sendPayment function with SDK v3.0.0 parameter names
  const sendPayment = async (toAddress: string, amountInAlgo: number, note?: string): Promise<string> => {
    if (!isConnected || !accountAddress) {
      const error = new Error('Wallet not connected');
      paymentLog.error('PAYMENT_FAILED_NO_WALLET', error);
      throw error;
    }

    // CRITICAL: Capture and validate sender address immediately
    const senderAddress = accountAddress;
    
    paymentLog.info('SENDER_ADDRESS_CAPTURED', {
      senderAddress: senderAddress,
      senderAddressLength: senderAddress.length,
      senderAddressType: typeof senderAddress,
      senderAddressSlice: senderAddress.slice(-8)
    });

    if (!senderAddress) {
      const error = new Error('Sender address is null or undefined');
      paymentLog.error('SENDER_ADDRESS_MISSING', error);
      throw error;
    }

    try {
      paymentLog.info('PAYMENT_INITIATED', {
        from: senderAddress.slice(-8),
        to: toAddress.slice(-8),
        amountInAlgo,
        note: note?.substring(0, 50),
        network,
        currentBalance: balance,
        fullSenderAddress: senderAddress,
        fullToAddress: toAddress
      });

      // CRITICAL: Validate and clean both addresses
      const cleanSenderAddress = validateAndCleanAddress(senderAddress, 'sender');
      const cleanToAddress = validateAndCleanAddress(toAddress, 'recipient');

      if (typeof amountInAlgo !== 'number' || amountInAlgo <= 0) {
        throw new Error(`Invalid amount: ${amountInAlgo} ALGO`);
      }

      if (isNaN(amountInAlgo)) {
        throw new Error(`Amount is not a number: ${amountInAlgo}`);
      }

      // Convert ALGO amount to microAlgos
      const amountInMicroAlgos = algoToMicroAlgo(amountInAlgo);
      const currentBalanceInMicroAlgos = balanceInMicroAlgos;
      
      paymentLog.transaction('AMOUNT_CONVERSION', {
        amountInAlgo,
        amountInMicroAlgos,
        currentBalanceInMicroAlgos,
        network
      });
      
      // Check if user has sufficient balance
      if (amountInMicroAlgos > currentBalanceInMicroAlgos) {
        const error = new Error(`Insufficient balance. You have ${balance.toFixed(6)} ALGO but trying to send ${amountInAlgo} ALGO`);
        paymentLog.error('INSUFFICIENT_BALANCE', error, {
          requiredAmount: amountInAlgo,
          availableBalance: balance,
          network
        });
        throw error;
      }

      // CRITICAL: Enhanced transaction parameter fetching with retry logic
      paymentLog.info('FETCHING_TRANSACTION_PARAMS_WITH_RETRY', { network });
      const suggestedParams = await getTransactionParamsWithRetry(algodClient, network, 5);
      
      // CRITICAL: Log all addresses before transaction creation
      paymentLog.info('ABOUT_TO_CREATE_TRANSACTION', {
        senderAddress: cleanSenderAddress,
        senderAddressLength: cleanSenderAddress.length,
        toAddress: cleanToAddress,
        toAddressLength: cleanToAddress.length,
        amountInMicroAlgos,
        network,
        suggestedParamsPresent: !!suggestedParams
      });
      
      // CRITICAL: Create payment transaction with SDK v3.0.0 parameter names
      let txn;
      try {
        // CRITICAL: Explicitly cast addresses to string primitives
        const senderAddressString = String(cleanSenderAddress);
        const receiverAddressString = String(cleanToAddress);
        
        // CRITICAL: DEBUG LOG - Add debug log before makePaymentTxnWithSuggestedParams
        paymentLog.info('DEBUG_INPUTS_TO_MAKE_PAYMENT_TXN', {
          from: senderAddressString,
          to: receiverAddressString,
          amount: amountInMicroAlgos,
          suggestedParamsPresent: !!suggestedParams
        });
        
        // CRITICAL: Log the exact values being passed to the SDK
        paymentLog.info('TXN_CREATION_INPUTS_SDK_V3', {
          from: senderAddressString,
          to: receiverAddressString,
          fromType: typeof senderAddressString,
          toType: typeof receiverAddressString,
          fromLength: senderAddressString.length,
          toLength: receiverAddressString.length,
          amount: amountInMicroAlgos,
          amountType: typeof amountInMicroAlgos,
          suggestedParamsKeys: Object.keys(suggestedParams),
          sdkVersion: '3.0.0'
        });
        
        // CRITICAL: Use SDK v3.0.0 parameter names: from/to
        txn = algosdk.makePaymentTxnWithSuggestedParams(
          senderAddressString,      // from
          receiverAddressString,    // to
          amountInMicroAlgos,       // amount
          undefined,                // closeRemainderTo
          note ? new TextEncoder().encode(note) : undefined, // note
          suggestedParams           // suggestedParams
        );

        // CRITICAL: IMMEDIATE transaction object inspection after creation
        paymentLog.info('🚨🔥 TRANSACTION_OBJECT_IMMEDIATELY_AFTER_CREATION 🔥🚨', {
          txnExists: !!txn,
          txnType: typeof txn,
          txnConstructor: txn?.constructor?.name,
          // CRITICAL: Check all transaction properties for v3.0.0
          txnFrom: txn?.from?.toString() || 'UNDEFINED',
          txnTo: txn?.to?.toString() || 'UNDEFINED',
          txnAmount: txn?.amount?.toString() || 'UNDEFINED',
          txnFee: txn?.fee?.toString() || 'UNDEFINED',
          txnFirstRound: txn?.firstRound?.toString() || 'UNDEFINED',
          txnLastRound: txn?.lastRound?.toString() || 'UNDEFINED',
          txnGenesisID: txn?.genesisID || 'UNDEFINED',
          txnGenesisHash: txn?.genesisHash ? 'present' : 'UNDEFINED',
          // Check all transaction properties
          allTxnKeys: txn ? Object.keys(txn) : 'NO_TXN',
          network,
          sdkVersion: '3.0.0'
        });

        paymentLog.transaction('TRANSACTION_CREATED_SUCCESS', {
          sender: cleanSenderAddress.slice(-8),
          receiver: cleanToAddress.slice(-8),
          amount: `${amountInAlgo} ALGO (${amountInMicroAlgos} microAlgos)`,
          fee: suggestedParams.fee,
          note: note?.substring(0, 50),
          network,
          txnType: txn.type,
          sdkVersion: '3.0.0'
        });
      } catch (txnError) {
        paymentLog.error('TRANSACTION_CREATION_FAILED', txnError, { 
          network,
          senderAddress: cleanSenderAddress,
          receiverAddress: cleanToAddress,
          amountInMicroAlgos,
          sdkVersion: '3.0.0'
        });
        throw new Error(`Failed to create transaction: ${txnError.message}`);
      }

      // Sign the transaction
      const signedTxn = await signTransaction(txn);

      // Submit the transaction
      paymentLog.info('SUBMITTING_TRANSACTION', { network });
      let txId;
      try {
        const submitResult = await algodClient.sendRawTransaction(signedTxn).do();
        txId = submitResult.txId;
        
        paymentLog.transaction('TRANSACTION_SUBMITTED_SUCCESS', { 
          txId: txId.slice(0, 16),
          fullTxId: txId,
          network
        });
      } catch (submitError) {
        paymentLog.error('TRANSACTION_SUBMISSION_FAILED', submitError, { network });
        throw new Error(`Failed to submit transaction: ${submitError.message}`);
      }
      
      toast.success(`Payment sent! Transaction ID: ${txId.slice(0, 8)}...`);

      // Wait for confirmation
      paymentLog.info('WAITING_FOR_CONFIRMATION', { 
        txId: txId.slice(0, 16), 
        network 
      });
      
      try {
        const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);
        
        paymentLog.transaction('TRANSACTION_CONFIRMED_SUCCESS', { 
          txId: txId.slice(0, 16),
          confirmedRound: confirmedTxn['confirmed-round'],
          network
        });
        
        toast.success(`Payment confirmed! ${amountInAlgo} ALGO sent to ${cleanToAddress.slice(0, 8)}... on ${network.toUpperCase()}`);
      } catch (confirmError) {
        paymentLog.error('TRANSACTION_CONFIRMATION_FAILED', confirmError, { 
          txId: txId.slice(0, 16), 
          network 
        });
        // Don't throw here - transaction was submitted successfully
        toast.warning(`Transaction submitted but confirmation failed. Check transaction ${txId.slice(0, 8)}... on ${network.toUpperCase()}`);
      }

      // Refresh balance after successful transaction
      setTimeout(() => {
        refreshBalance();
      }, 2000);

      return txId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send payment';
      
      paymentLog.error('PAYMENT_FAILED', error, {
        to: toAddress?.slice(-8),
        amount: amountInAlgo,
        errorMessage,
        network,
        senderAddress: senderAddress?.slice(-8)
      });
      
      toast.error(`Payment failed: ${errorMessage}`);
      throw error;
    }
  };

  const value: AlgorandContextType = {
    isConnected,
    accountAddress,
    balance,
    balanceInMicroAlgos,
    network,
    isLoadingBalance,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    refreshBalance,
    signTransaction,
    sendPayment,
    peraWallet,
    algodClient,
  };

  return (
    <AlgorandContext.Provider value={value}>
      {children}
    </AlgorandContext.Provider>
  );
};

export const useAlgorand = () => {
  const context = useContext(AlgorandContext);
  if (!context) {
    throw new Error('useAlgorand must be used within an AlgorandProvider');
  }
  return context;
};