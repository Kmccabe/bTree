import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Github, Twitter, Mail, Heart } from 'lucide-react';
import BoltBadge from './BoltBadge';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">bTree</span>
            </div>
            <p className="text-gray-300 mb-6 max-w-md">
              Experimental Economics Platform - Conduct cutting-edge economic research with 
              real monetary incentives, transparent data collection, and automated participant payments.
            </p>
            <BoltBadge variant="default" className="mb-4" />
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/dashboard" className="text-gray-300 hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/create-experiment" className="text-gray-300 hover:text-white transition-colors">
                  Create Experiment
                </Link>
              </li>
              <li>
                <Link to="/analytics" className="text-gray-300 hover:text-white transition-colors">
                  Analytics
                </Link>
              </li>
              <li>
                <Link to="/trust-game/demo?role=A" className="text-gray-300 hover:text-white transition-colors">
                  Try Demo
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://github.com/your-repo/btree" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a 
                  href="https://testnet.algoexplorer.io/dispenser" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  TestNet Faucet
                </a>
              </li>
              <li>
                <a 
                  href="https://perawallet.app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Pera Wallet
                </a>
              </li>
              <li>
                <a 
                  href="https://developer.algorand.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Algorand Docs
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <p className="text-gray-400 text-sm">
                © 2025 bTree. Licensed under MIT License.
              </p>
            </div>
            
            <div className="flex items-center space-x-6">
              <a
                href="https://github.com/your-repo/btree"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                title="GitHub Repository"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com/btree_platform"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                title="Follow on Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="mailto:contact@btree-platform.com"
                className="text-gray-400 hover:text-white transition-colors"
                title="Contact Us"
              >
                <Mail className="w-5 h-5" />
              </a>
              <BoltBadge variant="footer" />
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-800 text-center">
            <p className="text-gray-500 text-xs flex items-center justify-center">
              Made with <Heart className="w-4 h-4 text-red-500 mx-1" /> for experimental economics research
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;