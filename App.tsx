import React, { useState } from 'react';
import { HashRouter } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ExploreGallery } from './components/ExploreGallery';
import { CreateWorld } from './components/CreateWorld';
import { World } from './types';

// Mock Initial Data
const INITIAL_WORLDS: World[] = [
  {
    id: '1',
    title: '霓虹雨夜 (Neon Rain)',
    description: '一座永不停止下雨的赛博朋克都市，居民们生活在巨大的全息广告牌阴影下，街道上流淌着液态的彩色光芒。',
    imageUrl: 'https://picsum.photos/seed/cyberpunk/800/600',
    author: 'SysAdmin',
    tags: ['Cyberpunk', 'Sci-Fi'],
    isAiGenerated: false,
    likes: 1240
  },
  {
    id: '2',
    title: '静谧群岛 (The Silent Isles)',
    description: '漂浮在无重力海洋上空的岩石群岛，连接它们的是古老的藤蔓桥梁。这里没有风声，只有远处鲸鱼的低吟。',
    imageUrl: 'https://picsum.photos/seed/isles/800/600',
    author: 'Explorer_01',
    tags: ['Fantasy', 'Nature'],
    isAiGenerated: false,
    likes: 856
  },
  {
    id: '3',
    title: '火星温室 (Mars Dome 7)',
    description: '红色星球上的第七个生命绿洲，巨大的玻璃穹顶下培育着地球已经灭绝的植物物种。',
    imageUrl: 'https://picsum.photos/seed/mars/800/600',
    author: 'Elon_M',
    tags: ['Sci-Fi', 'Space'],
    isAiGenerated: false,
    likes: 2300
  },
  {
    id: '4',
    title: '水晶峡谷 (Crystal Canyon)',
    description: '整个地貌由巨大的紫色水晶构成，阳光折射出致命但美丽的激光束。探险家必须在日落后才能通行。',
    imageUrl: 'https://picsum.photos/seed/crystal/800/600',
    author: 'GeoGeek',
    tags: ['Fantasy', 'Landscape'],
    isAiGenerated: false,
    likes: 543
  },
   {
    id: '5',
    title: '机械森林 (Clockwork Woods)',
    description: '树木是黄铜齿轮构成的，树叶是精密的金属薄片。每天中午12点，整个森林会重新上发条。',
    imageUrl: 'https://picsum.photos/seed/clockwork/800/600',
    author: 'Tinker',
    tags: ['Steampunk', 'Surreal'],
    isAiGenerated: false,
    likes: 912
  },
   {
    id: '6',
    title: '极光荒原 (Aurora Waste)',
    description: '位于世界尽头的冰封之地，天空永远被极光覆盖，地面反射着天空的色彩，分不清上下。',
    imageUrl: 'https://picsum.photos/seed/aurora/800/600',
    author: 'IceQueen',
    tags: ['Nature', 'Atmospheric'],
    isAiGenerated: false,
    likes: 150
  }
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'explore' | 'create'>('explore');
  const [worlds, setWorlds] = useState<World[]>(INITIAL_WORLDS);

  const handleWorldCreated = (newWorld: World) => {
    setWorlds(prev => [newWorld, ...prev]);
    // Optionally switch back to explore to see it in the grid.
    setActiveTab('explore');
  };

  return (
    <HashRouter>
      <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-200 font-sans selection:bg-purple-500/30 selection:text-purple-200 overflow-hidden">
        <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
        
        {/* Main Layout Area - fills remaining space */}
        <main className="flex-1 flex flex-col min-h-0 relative w-full">
          {activeTab === 'explore' ? (
            /* Explore Mode: Centered container with scrollbar on the page */
            <div className="h-full overflow-y-auto custom-scrollbar">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                    <ExploreGallery worlds={worlds} switchToCreate={() => setActiveTab('create')} />
                    
                    <footer className="border-t border-slate-900 py-8 mt-12 text-center text-slate-600 text-sm">
                        <p>© 2024 WorldBook. Powered by Google Gemini.</p>
                    </footer>
                </div>
            </div>
          ) : (
            /* Create Mode: Full IDE-like layout, no padding, no footer */
            <CreateWorld onWorldCreated={handleWorldCreated} />
          )}
        </main>
      </div>
    </HashRouter>
  );
};

export default App;