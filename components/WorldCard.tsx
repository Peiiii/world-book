import React, { useState } from 'react';
import { World } from '../types';
import { Heart, Share2, Sparkles, Download, Copy, Check } from 'lucide-react';

interface WorldCardProps {
  world: World;
}

export const WorldCard: React.FC<WorldCardProps> = ({ world }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      // Fetch the image as a blob
      const response = await fetch(world.imageUrl);
      const blob = await response.blob();
      
      // Copy to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy image:', err);
      // Fallback or error notification could go here
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDownloading(true);
    try {
      const response = await fetch(world.imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `worldbook-${world.title.replace(/\s+/g, '-').toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download image:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="group relative bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden hover:border-slate-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-900/20 flex flex-col h-full">
      {/* Image Container */}
      <div className="aspect-[4/3] w-full overflow-hidden relative bg-slate-900">
        <img 
          src={world.imageUrl} 
          alt={world.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* AI Badge */}
        {world.isAiGenerated && (
          <div className="absolute top-3 left-3 bg-purple-500/20 backdrop-blur-md border border-purple-500/30 text-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 opacity-90">
            <Sparkles size={10} />
            <span>AI</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="mb-2">
          <h3 className="text-lg font-bold text-white leading-tight mb-1 group-hover:text-purple-300 transition-colors">{world.title}</h3>
          <p className="text-slate-400 text-xs line-clamp-2 h-8">
            {world.description}
          </p>
        </div>
        
        {/* Footer Actions */}
        <div className="mt-auto pt-3 border-t border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                {world.author.charAt(0)}
             </div>
             <span className="text-xs text-slate-400 font-medium">{world.author}</span>
          </div>
          
          <div className="flex items-center gap-1">
            {/* Action Buttons: Always visible for accessibility, but styled subtly */}
            <button 
                onClick={handleCopy}
                className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
                title="复制图片"
            >
               {isCopied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            </button>
            
            <button 
                onClick={handleDownload}
                className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
                title="下载图片"
            >
                {isDownloading ? <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-500 border-t-white animate-spin"/> : <Download size={14} />}
            </button>

             <div className="w-px h-3 bg-slate-700 mx-1"></div>

            <button className="flex items-center gap-1 text-slate-500 hover:text-pink-400 transition-colors text-xs font-medium px-1.5 py-1 hover:bg-pink-500/10 rounded-md">
              <Heart size={14} /> {world.likes}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};