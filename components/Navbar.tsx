import React from 'react';
import { Globe2, Compass, PlusCircle } from 'lucide-react';

interface NavbarProps {
  activeTab: 'explore' | 'create';
  onTabChange: (tab: 'explore' | 'create') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-lg bg-slate-900/80 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onTabChange('explore')}>
            <div className="bg-gradient-to-tr from-cyan-500 to-blue-600 p-1.5 rounded-lg">
              <Globe2 size={24} className="text-white" />
            </div>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tight">
              WorldBook
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => onTabChange('explore')}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${activeTab === 'explore' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Compass size={18} />
              探索世界
            </button>
            <button 
              onClick={() => onTabChange('create')}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${activeTab === 'create' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <PlusCircle size={18} />
              创造世界
            </button>
          </div>

          {/* Mobile Menu Button (Simplified for this demo) */}
          <div className="flex md:hidden">
             <div className="flex space-x-4">
                <button 
                  onClick={() => onTabChange('explore')}
                  className={`p-2 rounded-md ${activeTab === 'explore' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
                >
                  <Compass size={20} />
                </button>
                <button 
                  onClick={() => onTabChange('create')}
                  className={`p-2 rounded-md ${activeTab === 'create' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
                >
                  <PlusCircle size={20} />
                </button>
             </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
