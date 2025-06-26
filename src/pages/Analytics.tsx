import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign,
  Download,
  Filter,
  Calendar,
  Eye,
  Target,
  Zap,
  Award,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Activity
} from 'lucide-react';

const Analytics: React.FC = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [selectedExperiment, setSelectedExperiment] = useState('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'experiments' | 'participants' | 'financial'>('overview');

  const timeRanges = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 3 months' },
    { value: '1y', label: 'Last year' },
  ];

  const experiments = [
    { value: 'all', label: 'All Experiments' },
    { value: 'public-goods', label: 'Public Goods Games' },
    { value: 'auctions', label: 'Auction Studies' },
    { value: 'trust', label: 'Trust Games' },
  ];

  // Mock data for demonstration
  const overviewStats = [
    { 
      label: 'Total Experiments', 
      value: '47', 
      change: '+12%', 
      changeType: 'positive', 
      icon: BarChart3,
      color: 'text-primary-600'
    },
    { 
      label: 'Active Participants', 
      value: '2,341', 
      change: '+8%', 
      changeType: 'positive', 
      icon: Users,
      color: 'text-green-600'
    },
    { 
      label: 'Total Rewards Paid', 
      value: '12,847 ALGO', 
      change: '+23%', 
      changeType: 'positive', 
      icon: DollarSign,
      color: 'text-secondary-600'
    },
    { 
      label: 'Avg. Efficiency', 
      value: '87.3%', 
      change: '-2%', 
      changeType: 'negative', 
      icon: Target,
      color: 'text-accent-600'
    },
  ];

  const recentExperiments = [
    {
      id: 1,
      title: 'Public Goods - Winter 2024',
      type: 'Public Goods',
      participants: 24,
      efficiency: 89.2,
      totalReward: 450,
      status: 'completed',
      completedDate: '2024-01-15'
    },
    {
      id: 2,
      title: 'Trust Game Study',
      type: 'Behavioral',
      participants: 18,
      efficiency: 76.5,
      totalReward: 320,
      status: 'completed',
      completedDate: '2024-01-12'
    },
    {
      id: 3,
      title: 'Double Auction Market',
      type: 'Market',
      participants: 32,
      efficiency: 94.1,
      totalReward: 680,
      status: 'active',
      completedDate: 'In Progress'
    },
  ];

  const participantInsights = [
    { metric: 'Avg. Session Duration', value: '23.4 min', trend: 'up' },
    { metric: 'Return Rate', value: '78%', trend: 'up' },
    { metric: 'Completion Rate', value: '91%', trend: 'down' },
    { metric: 'Satisfaction Score', value: '4.6/5', trend: 'up' },
  ];

  const renderOverviewTab = () => (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <Icon className={`w-8 h-8 ${stat.color}`} />
                <div className={`flex items-center space-x-1 text-sm font-medium ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.changeType === 'positive' ? 
                    <ArrowUpRight className="w-4 h-4" /> : 
                    <ArrowDownRight className="w-4 h-4" />
                  }
                  <span>{stat.change}</span>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Experiment Success Rate Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Experiment Success Rate</h3>
            <button className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
          
          <div className="h-64 bg-gradient-to-br from-primary-50 to-secondary-50 rounded-lg flex items-center justify-center mb-4">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-primary-300 mx-auto mb-2" />
              <p className="text-gray-500">Success rate trend chart</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">94%</p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">4%</p>
              <p className="text-sm text-gray-600">In Progress</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">2%</p>
              <p className="text-sm text-gray-600">Cancelled</p>
            </div>
          </div>
        </div>

        {/* Participant Engagement */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Participant Engagement</h3>
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Real-time</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {participantInsights.map((insight, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-700 font-medium">{insight.metric}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-gray-900">{insight.value}</span>
                  <div className={`w-2 h-2 rounded-full ${
                    insight.trend === 'up' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Experiments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Experiments</h3>
          <button className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            <Eye className="w-4 h-4" />
            <span>View All</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Experiment</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Participants</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Efficiency</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Rewards</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentExperiments.map((experiment) => (
                <tr key={experiment.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{experiment.title}</p>
                      <p className="text-sm text-gray-500">{experiment.completedDate}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {experiment.type}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-900">{experiment.participants}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-900 font-medium">{experiment.efficiency}%</span>
                      <div className={`w-2 h-2 rounded-full ${
                        experiment.efficiency > 85 ? 'bg-green-500' : 
                        experiment.efficiency > 70 ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-900">{experiment.totalReward} ALGO</td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      experiment.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {experiment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderExperimentsTab = () => (
    <div className="space-y-8">
      {/* Experiment Type Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Experiment Performance by Type</h3>
          <div className="h-64 bg-gradient-to-br from-primary-50 to-secondary-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-primary-300 mx-auto mb-2" />
              <p className="text-gray-500">Performance comparison chart</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Performing Experiments</h3>
          <div className="space-y-4">
            {[
              { name: 'Public Goods #12', efficiency: 96.2, participants: 30 },
              { name: 'Trust Game #8', efficiency: 94.7, participants: 24 },
              { name: 'Market Sim #5', efficiency: 92.1, participants: 28 },
            ].map((exp, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{exp.name}</p>
                  <p className="text-xs text-gray-500">{exp.participants} participants</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">{exp.efficiency}%</p>
                  <div className="flex items-center">
                    <Award className="w-3 h-3 text-yellow-500 mr-1" />
                    <span className="text-xs text-gray-500">Top 5%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Experiment Analysis */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Experiment Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">18.3 min</p>
            <p className="text-sm text-gray-600">Avg. Duration</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">22.4</p>
            <p className="text-sm text-gray-600">Avg. Participants</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Zap className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">91.2%</p>
            <p className="text-sm text-gray-600">Success Rate</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderParticipantsTab = () => (
    <div className="space-y-8">
      {/* Participant Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Participant Demographics</h3>
          <div className="h-64 bg-gradient-to-br from-secondary-50 to-primary-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <PieChart className="w-12 h-12 text-secondary-300 mx-auto mb-2" />
              <p className="text-gray-500">Demographics breakdown</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Engagement Metrics</h3>
          <div className="space-y-4">
            {[
              { label: 'New Participants', value: '234', change: '+15%' },
              { label: 'Returning Participants', value: '1,847', change: '+8%' },
              { label: 'Average Sessions', value: '3.2', change: '+12%' },
              { label: 'Drop-out Rate', value: '7.8%', change: '-3%' },
            ].map((metric, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-700 font-medium">{metric.label}</span>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">{metric.value}</p>
                  <p className="text-sm text-green-600">{metric.change}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Participant Behavior Analysis */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Behavioral Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: 'Risk Preference', value: 'Moderate', trend: 'stable' },
            { title: 'Cooperation Rate', value: '73%', trend: 'up' },
            { title: 'Strategic Thinking', value: 'High', trend: 'up' },
            { title: 'Learning Rate', value: '0.82', trend: 'stable' },
          ].map((insight, index) => (
            <div key={index} className="text-center p-4 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">{insight.title}</p>
              <p className="text-xl font-bold text-gray-900">{insight.value}</p>
              <div className={`inline-flex items-center mt-2 text-xs ${
                insight.trend === 'up' ? 'text-green-600' : 
                insight.trend === 'down' ? 'text-red-600' : 'text-gray-500'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-1 ${
                  insight.trend === 'up' ? 'bg-green-500' : 
                  insight.trend === 'down' ? 'bg-red-500' : 'bg-gray-400'
                }`} />
                {insight.trend}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderFinancialTab = () => (
    <div className="space-y-8">
      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: 'Total Rewards Distributed', value: '12,847 ALGO', change: '+23%', icon: DollarSign },
          { title: 'Average Reward per Participant', value: '5.49 ALGO', change: '+8%', icon: Users },
          { title: 'Platform Efficiency', value: '98.2%', change: '+1%', icon: Target },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <Icon className="w-8 h-8 text-primary-600" />
                <span className="text-sm font-medium text-green-600">{stat.change}</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{stat.value}</h3>
              <p className="text-sm text-gray-600">{stat.title}</p>
            </div>
          );
        })}
      </div>

      {/* Reward Distribution Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Reward Distribution Over Time</h3>
        <div className="h-64 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <TrendingUp className="w-12 h-12 text-green-300 mx-auto mb-2" />
            <p className="text-gray-500">Financial trends chart</p>
          </div>
        </div>
      </div>

      {/* Transaction Details */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
          <button className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
        
        <div className="space-y-3">
          {[
            { experiment: 'Public Goods #15', amount: '450 ALGO', participants: 24, date: '2024-01-15' },
            { experiment: 'Trust Game #12', amount: '320 ALGO', participants: 18, date: '2024-01-14' },
            { experiment: 'Market Sim #8', amount: '680 ALGO', participants: 32, date: '2024-01-13' },
          ].map((transaction, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{transaction.experiment}</p>
                <p className="text-sm text-gray-500">{transaction.participants} participants • {transaction.date}</p>
              </div>
              <p className="text-lg font-semibold text-green-600">{transaction.amount}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600">Comprehensive insights into your experimental research</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4 lg:mt-0">
            <select
              value={selectedExperiment}
              onChange={(e) => setSelectedExperiment(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {experiments.map((exp) => (
                <option key={exp.value} value={exp.value}>{exp.label}</option>
              ))}
            </select>
            
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {timeRanges.map((range) => (
                <option key={range.value} value={range.value}>{range.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'experiments', label: 'Experiments', icon: Activity },
              { id: 'participants', label: 'Participants', icon: Users },
              { id: 'financial', label: 'Financial', icon: DollarSign },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'experiments' && renderExperimentsTab()}
          {activeTab === 'participants' && renderParticipantsTab()}
          {activeTab === 'financial' && renderFinancialTab()}
        </motion.div>
      </div>
    </div>
  );
};

export default Analytics;