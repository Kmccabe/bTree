import React from 'react';
import { ExternalLink, Zap } from 'lucide-react';

interface BoltBadgeProps {
  variant?: 'default' | 'minimal' | 'footer' | 'hero';
  className?: string;
}

const BoltBadge: React.FC<BoltBadgeProps> = ({ variant = 'default', className = '' }) => {
  const baseClasses = "inline-flex items-center space-x-2 text-sm font-medium transition-all duration-200 hover:scale-105 cursor-pointer";
  
  const variants = {
    default: "px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg shadow-md hover:shadow-lg",
    minimal: "px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200",
    footer: "text-gray-500 hover:text-gray-700",
    hero: "px-6 py-3 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 animate-pulse"
  };

  const getBoltIcon = () => {
    switch (variant) {
      case 'hero':
        return <Zap className="w-5 h-5 text-yellow-300 animate-bounce" fill="currentColor" />;
      case 'default':
        return (
          <div className="w-5 h-5 bg-white rounded-sm flex items-center justify-center">
            <Zap className="w-3 h-3 text-purple-600" fill="currentColor" />
          </div>
        );
      case 'minimal':
        return <Zap className="w-4 h-4 text-purple-600" fill="currentColor" />;
      case 'footer':
        return <Zap className="w-4 h-4" fill="currentColor" />;
      default:
        return <Zap className="w-4 h-4" fill="currentColor" />;
    }
  };

  return (
    <a
      href="https://bolt.new"
      target="_blank"
      rel="noopener noreferrer"
      className={`${baseClasses} ${variants[variant]} ${className}`}
      title="Built with Bolt.new - AI-powered full-stack development"
    >
      <div className="flex items-center space-x-2">
        {getBoltIcon()}
        <span className={variant === 'hero' ? 'font-semibold' : ''}>
          Built with Bolt.new
        </span>
        <ExternalLink className="w-4 h-4 opacity-75" />
      </div>
    </a>
  );
};

export default BoltBadge;