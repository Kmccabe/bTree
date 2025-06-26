import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plus, 
  BarChart3, 
  Users, 
  Clock, 
  Play, 
  Pause, 
  Settings,
  TrendingUp,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useAlgorand } from '../contexts/AlgorandContext';

const Dashboard: React.FC = () => {
  const { isConnected } = useAlgorand();
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'draft'>('active');

  // Mock data for demonstration
  const experiments = {
    active: [
      {
        id: 1,
        title: 'Public Goods Game - Winter 2024',
        participants: 24,
        maxParticipants: 30,
        startDate: '2024-01-15',
        endDate: '2024-01-30',
        status: 'running',
        totalRewards: 450,
        type: 'Public Goods'
      },
      {
        id: 2,
        title: 'Double Auction Market Study',
        participants: 16,
        maxParticipants: 20,
        startDate: '2024-01-20',
        endDate: '2024-02-05',
        status: 'recruiting',
        totalRewards: 800,
        type: 'Market'
      }
    ],
    completed: [
      {
        id: 3,
        title: 'Trust Game Experiment',
        participants: 40,
        maxParticipants: 40,
        completedDate: '2024-01-10',
        totalRewards: 600,
        efficiency: 87.3,
        type: 'Behavioral'
      }
    ],
    draft: [
      {
        id: 4,
        title: 'Coordination Game Study',
        description: 'Multi-round coordination game with communication',
        created: '2024-01-12',
        type: 'Coordination'
      }
    ]
  };

  const stats = [
    { label: 'Active Experiments', value: '2', icon: Play, color: 'text-green-600' },
    { label: 'Total Participants', value: '40', icon: Users, color: 'text-blue-600' },
    { label: 'Rewards Distributed', value: '1,850 ALGO', icon: DollarSign, color: 'text-primary-600' },
    { label: 'Avg. Efficiency', value: '91.2%', icon: TrendingUp, color: 'text-secondary-600' },
  ];

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-6">
              Please connect your Algorand wallet to access the research dashboard.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Research Dashboard</h1>
            <p className="text-gray-600">Manage your experiments and analyze results</p>
          </div>
          <Link
            to="/create-experiment"
            className="mt-4 lg:mt-0 inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg hover:from-primary-700 hover:to-secondary-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>New Experiment</span>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Experiments Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <div className="px-6 py-4">
              <div className="flex space-x-8">
                {(['active', 'completed', 'draft'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-4 text-sm font-medium capitalize border-b-2 transition-colors ${
                      activeTab === tab
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab} Experiments ({experiments[tab].length})
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'active' && (
              <div className="space-y-4">
                {experiments.active.map((experiment) => (
                  <motion.div
                    key={experiment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{experiment.title}</h3>
                        <p className="text-sm text-gray-500">{experiment.type} • Started {experiment.startDate}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          experiment.status === 'running' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {experiment.status}
                        </span>
                        <button className="p-2 text-gray-400 hover:text-gray-600">
                          <Settings className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {experiment.participants}/{experiment.maxParticipants} participants
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Ends {experiment.endDate}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {experiment.totalRewards} ALGO rewards
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <BarChart3 className="w-4 h-4 text-gray-400" />
                        <Link 
                          to={`/experiment/${experiment.id}`}
                          className="text-sm text-primary-600 hover:text-primary-700"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full" 
                        style={{ width: `${(experiment.participants / experiment.maxParticipants) * 100}%` }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {activeTab === 'completed' && (
              <div className="space-y-4">
                {experiments.completed.map((experiment) => (
                  <motion.div
                    key={experiment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{experiment.title}</h3>
                        <p className="text-sm text-gray-500">{experiment.type} • Completed {experiment.completedDate}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Completed
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {experiment.participants} participants
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {experiment.efficiency}% efficiency
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {experiment.totalRewards} ALGO distributed
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <BarChart3 className="w-4 h-4 text-gray-400" />
                        <Link 
                          to={`/analytics?experiment=${experiment.id}`}
                          className="text-sm text-primary-600 hover:text-primary-700"
                        >
                          View Analytics
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {activeTab === 'draft' && (
              <div className="space-y-4">
                {experiments.draft.map((experiment) => (
                  <motion.div
                    key={experiment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{experiment.title}</h3>
                        <p className="text-sm text-gray-500">{experiment.type} • Created {experiment.created}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Draft
                        </span>
                        <button className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                          Edit & Launch
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;