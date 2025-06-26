import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Users, 
  Coins, 
  Shield, 
  TrendingUp, 
  Award,
  ArrowRight,
  CheckCircle,
  Plus
} from 'lucide-react';
import BoltBadge from '../components/BoltBadge';

const HomePage: React.FC = () => {
  const features = [
    {
      icon: BarChart3,
      title: 'Real-time Experiments',
      description: 'Run sophisticated economic experiments with live participants and instant results.',
    },
    {
      icon: Coins,
      title: 'Blockchain Incentives',
      description: 'Automated payments and rewards through Algorand smart contracts.',
    },
    {
      icon: Shield,
      title: 'Secure & Transparent',
      description: 'All transactions and data are recorded on the blockchain for complete transparency.',
    },
    {
      icon: Users,
      title: 'Participant Management',
      description: 'Easy recruitment and management of research participants with built-in verification.',
    },
  ];

  const experimentTypes = [
    'Public Goods Games',
    'Auction Mechanisms',
    'Market Simulations',
    'Behavioral Studies',
    'Trust Games',
    'Coordination Games',
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/10 via-transparent to-secondary-600/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6"
            >
              Experimental Economics
              <span className="block bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                On The Blockchain
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed"
            >
              Conduct cutting-edge economic research with real monetary incentives, 
              transparent data collection, and automated participant payments.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8"
            >
              <Link
                to="/dashboard"
                className="group flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl hover:from-primary-700 hover:to-secondary-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <span className="font-semibold text-lg">Start Researching</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link
                to="/trust-game/demo?role=A"
                className="flex items-center space-x-2 px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:border-primary-300 hover:text-primary-700 transition-all duration-200"
              >
                <span className="font-semibold text-lg">Try Trust Game Demo</span>
              </Link>
            </motion.div>

            {/* Enhanced Bolt Badge in Hero */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex justify-center"
            >
              <BoltBadge variant="hero" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose bTree?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built specifically for researchers who need reliable, scalable, and transparent experimental platforms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="group text-center p-6 rounded-2xl border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-8 h-8 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Experiment Types Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-primary-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Run Any Type of Economic Experiment
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Our platform supports a wide range of experimental designs, from simple behavioral studies to complex market mechanisms.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {experimentTypes.map((type, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="flex items-center space-x-3"
                  >
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">{type}</span>
                  </motion.div>
                ))}
              </div>

              <Link
                to="/create-experiment"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Create Your First Experiment</span>
              </Link>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-200">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Trust Game Experiment</h3>
                    <p className="text-gray-500">2 participants • Interactive</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Initial Endowment</span>
                    <span className="font-semibold text-gray-900">1.0 ALGO</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Multiplier</span>
                    <span className="font-semibold text-gray-900">2.0x</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Trust Level</span>
                    <span className="font-semibold text-green-600">High</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center space-x-2 text-green-600">
                    <Award className="w-5 h-5" />
                    <span className="font-medium">Ready to Play</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-secondary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Transform Your Research?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Join leading economists and researchers who are using blockchain technology 
              to conduct more reliable and transparent experiments.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/dashboard"
                className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-primary-600 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-lg shadow-lg"
              >
                <span>Get Started Today</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              
              {/* Additional Bolt Badge in CTA */}
              <BoltBadge variant="default" className="bg-white/10 text-white border border-white/20 hover:bg-white/20" />
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;