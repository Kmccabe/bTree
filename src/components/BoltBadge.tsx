import React from 'react';
import { ExternalLink } from 'lucide-react';

interface BoltBadgeProps {
  variant?: 'default' | 'minimal' | 'footer';
  className?: string;
}

const BoltBadge: React.FC<BoltBadgeProps> = ({ variant = 'default', className = '' }) => {
  const baseClasses = "inline-flex items-center space-x-2 text-sm font-medium transition-all duration-200 hover:scale-105";
  
  const variants = {
    default: "px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg shadow-md hover:shadow-lg",
    minimal: "px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200",
    footer: "text-gray-500 hover:text-gray-700"
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
        {variant === 'default' && (
          <div className="w-5 h-5 bg-white rounded-sm flex items-center justify-center">
            <span className="text-purple-600 font-bold text-xs">⚡</span>
          </div>
        )}
        <span>Built with Bolt.new</span>
        <ExternalLink className="w-4 h-4" />
      </div>
    </a>
  );
};

export default BoltBadge;