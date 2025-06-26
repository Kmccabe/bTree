import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Wallet, BarChart3, Plus, Home, LogOut, Settings, Globe, RefreshCw, AlertCircle } from 'lucide-react';
import { useAlgorand } from '../contexts/AlgorandContext';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar: React.FC = () => {
  const { 
    isConnected, 
    accountAddress, 
    balance, 
    network, 
    isLoadingBalance,
    connectWallet, 
    disconnectWallet, 
    switchNetwork,
    refreshBalance
  } = useAlgorand();
  const location = useLocation();
  const [showNetworkMenu, setShowNetworkMenu] = useState(false);

  const navigationItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { path: '/create-experiment', label: 'Create', icon: Plus },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const handleNetworkSwitch = async (newNetwork: 'mainnet' | 'testnet') => {
    await switchNetwork(newNetwork);
    setShowNetworkMenu(false);
  };

  const handleRefreshBalance = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await refreshBalance();
  };

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200/50 shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              bTree
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-100 text-primary-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Network Switcher & Wallet Connection */}
          <div className="flex items-center space-x-4">
            {/* Network Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowNetworkMenu(!showNetworkMenu)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  network === 'mainnet' 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {network === 'mainnet' ? 'MainNet' : 'TestNet'}
                </span>
                <div className={`w-2 h-2 rounded-full ${
                  network === 'mainnet' ? 'bg-green-500' : 'bg-blue-500'
                }`} />
              </button>

              <AnimatePresence>
                {showNetworkMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                  >
                    <button
                      onClick={() => handleNetworkSwitch('testnet')}
                      className={`w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                        network === 'testnet' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <div>
                        <p className="font-medium">TestNet</p>
                        <p className="text-xs text-gray-500">For development & testing</p>
                      </div>
                      {network === 'testnet' && (
                        <div className="ml-auto w-2 h-2 rounded-full bg-blue-500" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleNetworkSwitch('mainnet')}
                      className={`w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                        network === 'mainnet' ? 'bg-green-50 text-green-700' : 'text-gray-700'
                      }`}
                    >
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <div>
                        <p className="font-medium">MainNet</p>
                        <p className="text-xs text-gray-500">Live network with real ALGO</p>
                      </div>
                      {network === 'mainnet' && (
                        <div className="ml-auto w-2 h-2 rounded-full bg-green-500" />
                      )}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Wallet Connection */}
            {isConnected ? (
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium text-gray-900">
                    {formatAddress(accountAddress!)}
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <span>
                      {isLoadingBalance ? 'Loading...' : `${balance.toFixed(2)} ALGO`}
                    </span>
                    <button
                      onClick={handleRefreshBalance}
                      disabled={isLoadingBalance}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                      title="Refresh balance"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingBalance ? 'animate-spin' : ''}`} />
                    </button>
                    {balance === 0 && network === 'testnet' && (
                      <div className="flex items-center space-x-1 text-yellow-600" title="No TestNet ALGO found">
                        <AlertCircle className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="flex items-center space-x-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Disconnect</span>
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg hover:from-primary-700 hover:to-secondary-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Wallet className="w-4 h-4" />
                <span>Connect Wallet</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close network menu */}
      {showNetworkMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowNetworkMenu(false)}
        />
      )}

      {/* TestNet Balance Warning */}
      {isConnected && balance === 0 && network === 'testnet' && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 text-yellow-800">
              <AlertCircle className="w-4 h-4" />
              <span>No TestNet ALGO found in your wallet.</span>
            </div>
            <a
              href="https://testnet.algoexplorer.io/dispenser"
              target="_blank"
              rel="noopener noreferrer"
              className="text-yellow-700 hover:text-yellow-900 font-medium underline"
            >
              Get Test ALGO →
            </a>
          </div>
        </div>
      )}
    </motion.nav>
  );
};

export default Navbar;