import React from 'react';
import { World } from '../types';
import { WorldCard } from './WorldCard';
import { Button } from './Button';

interface ExploreGalleryProps {
  worlds: World[];
  switchToCreate: () => void;
}

export const ExploreGallery: React.FC<ExploreGalleryProps> = ({ worlds, switchToCreate }) => {
  return (
    <div className="w-full">
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
         <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
            探索
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mx-2">
              未知
            </span>
            边界
         </h1>
         <p className="max-w-2xl text-lg text-slate-400">
            WorldBook 收录了来自宇宙各处的奇妙景象。欣赏他人的创造，或亲自执笔，让想象成为现实。
         </p>
         <Button onClick={switchToCreate} variant="outline" size="lg" className="mt-4">
            创造你的世界 &rarr;
         </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
        {worlds.map((world) => (
          <WorldCard key={world.id} world={world} />
        ))}
      </div>
      
      {worlds.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-2xl">
          <p className="text-slate-500 mb-4">暂无世界... 成为第一个创造者吧！</p>
        </div>
      )}
    </div>
  );
};
