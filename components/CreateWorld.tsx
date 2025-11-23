import React, { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import { Sparkles, Wand2, Loader2, AlertCircle, Dice5, Zap, Send, Copy, Download, PanelRightClose, PanelRightOpen, Lightbulb, Bot, ArrowLeftCircle, CheckCircle2 } from 'lucide-react';
import { generateWorldLore, generateWorldImage, enhanceWorldPrompt, createArchitectChat, getArchitectSuggestions, Suggestion } from '../services/geminiService';
import { World, GenerationStatus, WorldDraft } from '../types';
import { Chat, GenerateContentResponse } from "@google/genai";

interface CreateWorldProps {
  onWorldCreated: (world: World) => void;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// --- Draft Card Component ---
const DraftCard = ({ draft, onApply }: { draft: WorldDraft, onApply: () => void }) => {
  return (
    <div className="mt-3 mb-1 bg-slate-950 border border-indigo-500/30 rounded-lg overflow-hidden animate-in zoom-in-95 duration-300">
       <div className="bg-indigo-950/30 px-3 py-2 border-b border-indigo-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></div>
             <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">World Blueprint</span>
          </div>
          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/20 truncate max-w-[80px]">
            {draft.style}
          </span>
       </div>
       <div className="p-3">
          <h4 className="font-bold text-indigo-100 text-sm mb-1">{draft.title}</h4>
          <p className="text-xs text-slate-400 leading-relaxed mb-3 line-clamp-4 italic">
            "{draft.description}"
          </p>
          <button 
             onClick={onApply}
             className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold py-2 rounded transition-colors flex items-center justify-center gap-2 group"
          >
            <ArrowLeftCircle size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            Apply to Workspace
          </button>
       </div>
    </div>
  );
};

export const CreateWorld: React.FC<CreateWorldProps> = ({ onWorldCreated }) => {
  // Main State
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('Cinematic Realistic');
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [generatedWorld, setGeneratedWorld] = useState<World | null>(null);
  
  // Architect/Chat State
  const [showArchitect, setShowArchitect] = useState(true);
  const [chatInstance, setChatInstance] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatThinking, setIsChatThinking] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Flash effect state
  const [isFlashing, setIsFlashing] = useState(false);

  const styles = [
    "Cinematic Realistic", "Cyberpunk", "Studio Ghibli Style", "Oil Painting", "Abstract", "Isometric 3D", "Dark Fantasy", "Solarpunk", "Watercolor", "Pixel Art"
  ];

  // Initialize Chat
  useEffect(() => {
    if (!chatInstance) {
        const chat = createArchitectChat();
        setChatInstance(chat);
        setMessages([{ role: 'model', text: '我是你的世界架构师。告诉我你心中模糊的想法，无论是“一座漂浮的岛屿”还是“悲伤的机器人”，我会帮你把它变成一个宏大的世界。' }]);
        refreshSuggestions('');
    }
  }, [chatInstance]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatThinking, showArchitect]);

  const refreshSuggestions = async (context: string) => {
      const newSuggestions = await getArchitectSuggestions(context);
      setSuggestions(newSuggestions);
  };

  const handleSendMessage = async (text: string = chatInput) => {
    if (!text.trim() || !chatInstance) return;
    
    const userMsg = text;
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatThinking(true);
    
    try {
      const response = await chatInstance.sendMessageStream({ message: userMsg });
      
      let fullText = '';
      setMessages(prev => [...prev, { role: 'model', text: '' }]); // Placeholder

      for await (const chunk of response) {
        const c = chunk as GenerateContentResponse;
        if (c.text) {
             fullText += c.text;
             setMessages(prev => {
                const newArr = [...prev];
                newArr[newArr.length - 1].text = fullText;
                return newArr;
             });
        }
      }
      setIsChatThinking(false);
      refreshSuggestions(fullText);
    } catch (e) {
      console.error(e);
      setIsChatThinking(false);
      setMessages(prev => [...prev, { role: 'model', text: '架构师似乎走神了，请重试。' }]);
    }
  };

  const handleApplyDraft = (draft: WorldDraft) => {
      setPrompt(draft.description);
      if (styles.includes(draft.style)) {
          setStyle(draft.style);
      }
      
      // Flash effect to show sync
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 800);
  };

  const parseMessage = (text: string): { cleanText: string, draft: WorldDraft | null } => {
      const draftRegex = /```json_draft\s*([\s\S]*?)\s*```/;
      const match = text.match(draftRegex);
      
      if (match) {
          try {
              const draft = JSON.parse(match[1]);
              const cleanText = text.replace(match[0], '').trim();
              return { cleanText, draft };
          } catch (e) {
              console.error("Draft parsing failed", e);
              return { cleanText: text, draft: null };
          }
      }
      return { cleanText: text, draft: null };
  };

  // --- Main Generation Handlers ---

  const handleEnhance = async () => {
    if (!prompt.trim()) {
       setPrompt("正在生成随机灵感...");
    }
    
    try {
      const newPrompt = await enhanceWorldPrompt(prompt);
      setPrompt(newPrompt);
    } catch (err: any) {
      setError("无法优化灵感，请稍后再试。");
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setStatus(GenerationStatus.THINKING);
    setError(null);
    setGeneratedWorld(null);

    try {
      const lore = await generateWorldLore(prompt, style);
      setStatus(GenerationStatus.PAINTING);

      const imageUrl = await generateWorldImage(lore.visualPrompt);

      const newWorld: World = {
        id: Date.now().toString(),
        title: lore.title,
        description: lore.description,
        imageUrl: imageUrl,
        author: "You",
        isAiGenerated: true,
        tags: [style, "AI Generated"],
        likes: 0
      };

      setGeneratedWorld(newWorld);
      setStatus(GenerationStatus.COMPLETED);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create world. Please try again.");
      setStatus(GenerationStatus.ERROR);
    }
  };

  const copyImageToClipboard = async (imageUrl: string) => {
      try {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          await navigator.clipboard.write([
              new ClipboardItem({
                  [blob.type]: blob
              })
          ]);
          alert("图片已复制到剪贴板！");
      } catch (e) {
          console.error(e);
          alert("复制失败，请尝试右键复制。");
      }
  };

  return (
    // MAIN CONTAINER: FULL SCREEN SPLIT VIEW (IDE STYLE)
    <div className="flex flex-1 w-full h-full bg-slate-950 relative isolate overflow-hidden">
      
      {/* 
        ========================================
        LEFT PANEL: WORKSPACE (FLUID)
        ========================================
      */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900/40 relative z-0">
        
        {/* Workspace Header */}
        <div className="h-14 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-950 shrink-0">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                    <Wand2 size={16} className="text-indigo-400" />
                </div>
                <h2 className="font-semibold text-slate-200 tracking-tight">World Studio</h2>
             </div>

             <div className="flex items-center gap-3">
                {/* Mobile Toggle */}
                <button 
                    onClick={() => setShowArchitect(!showArchitect)}
                    className={`md:hidden p-2 rounded-lg transition-colors ${showArchitect ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                    <Bot size={20} />
                </button>
                
                {/* Desktop Open Button (Visible only when sidebar is closed) */}
                <button 
                    onClick={() => setShowArchitect(true)}
                    className={`hidden md:flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:border-slate-500 transition-all ${showArchitect ? 'opacity-0 pointer-events-none translate-x-4' : 'opacity-100 translate-x-0'}`}
                >
                    <PanelRightOpen size={14} />
                    <span>Open Assistant</span>
                </button>
             </div>
        </div>

        {/* Scrollable Canvas Area */}
        <div className={`flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10 scroll-smooth bg-slate-950/20 transition-colors duration-500 ${isFlashing ? 'bg-indigo-500/10' : ''}`}>
             <div className="max-w-4xl mx-auto space-y-8 pb-20">
                
                {/* Step 1: Prompt Input */}
                <div className="group relative">
                    <div className="flex justify-between items-end mb-3">
                        <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                            <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-mono transition-colors duration-500 ${isFlashing ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>1</span>
                            世界描述
                        </label>
                        <button 
                            onClick={() => handleEnhance()}
                            disabled={status !== GenerationStatus.IDLE && status !== GenerationStatus.COMPLETED}
                            className="text-xs flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50"
                        >
                            {prompt.length === 0 ? <><Dice5 size={12}/> 随机生成</> : <><Zap size={12}/> AI 润色</>}
                        </button>
                    </div>
                    
                    <div className={`relative transition-all duration-300 rounded-lg ${isFlashing ? 'ring-2 ring-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)]' : 'focus-within:ring-1 focus-within:ring-indigo-500'}`}>
                        <textarea 
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="描述一个你梦中的世界... 例如：一座建在巨大瀑布之上的蒸汽朋克城市..."
                            className="w-full h-40 bg-slate-900 border border-slate-800 rounded-lg p-5 text-base text-slate-200 placeholder:text-slate-600 resize-none focus:outline-none focus:border-indigo-500 transition-colors leading-relaxed font-mono"
                            disabled={status === GenerationStatus.THINKING || status === GenerationStatus.PAINTING}
                        />
                        {isFlashing && (
                           <div className="absolute top-3 right-3 text-indigo-400 animate-in fade-in zoom-in">
                               <CheckCircle2 size={16} />
                           </div>
                        )}
                        <div className="absolute bottom-3 right-3 text-[10px] text-slate-600 font-mono">
                            {prompt.length} chars
                        </div>
                    </div>
                </div>

                {/* Step 2: Style Selection */}
                <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-mono transition-colors duration-500 ${isFlashing ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>2</span>
                        艺术风格
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                        {styles.map((s) => (
                        <button
                            key={s}
                            onClick={() => setStyle(s)}
                            disabled={status !== GenerationStatus.IDLE && status !== GenerationStatus.COMPLETED && status !== GenerationStatus.ERROR}
                            className={`px-3 py-2.5 rounded text-xs font-medium border text-center transition-all duration-300 ${
                            style === s 
                                ? 'bg-indigo-600 text-white border-indigo-500 ring-1 ring-indigo-500/30' 
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:border-slate-600 hover:text-slate-200'
                            }`}
                        >
                            {s}
                        </button>
                        ))}
                    </div>
                </div>

                {/* Action Bar */}
                <div className="pt-4 flex items-center gap-4 border-t border-slate-800/50">
                     <Button 
                        onClick={handleGenerate} 
                        disabled={!prompt.trim() || (status === GenerationStatus.THINKING || status === GenerationStatus.PAINTING)}
                        className="flex-1 h-12 text-base font-semibold rounded-md shadow-lg shadow-indigo-900/20"
                        variant="primary"
                    >
                        {status === GenerationStatus.THINKING ? (
                            <span className="flex items-center gap-3"><Loader2 className="animate-spin" /> 正在构思世界观...</span>
                        ) : status === GenerationStatus.PAINTING ? (
                            <span className="flex items-center gap-3"><Wand2 className="animate-bounce" /> 正在渲染图像...</span>
                        ) : (
                            <span className="flex items-center gap-3"><Sparkles size={18} /> 开始创造</span>
                        )}
                    </Button>
                </div>

                 {/* Error Display */}
                 {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3 text-red-300 text-sm animate-in slide-in-from-top-2">
                        <AlertCircle size={18} className="mt-0.5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Result Section */}
                {generatedWorld && (
                    <div className="animate-in fade-in slide-in-from-bottom-5 duration-700 fill-mode-forwards">
                         <div className="rounded-lg overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
                            <div className="relative group bg-black aspect-video flex items-center justify-center">
                                <img 
                                    src={generatedWorld.imageUrl} 
                                    alt={generatedWorld.title} 
                                    className="w-full h-full object-contain"
                                />
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
                                    <button 
                                        onClick={() => copyImageToClipboard(generatedWorld.imageUrl)}
                                        className="p-2 bg-black/50 hover:bg-black/80 rounded backdrop-blur-md border border-white/10 text-white transition-all"
                                    >
                                        <Copy size={18} />
                                    </button>
                                    <button 
                                        onClick={() => {
                                            const link = document.createElement('a');
                                            link.href = generatedWorld.imageUrl;
                                            link.download = `worldbook-${generatedWorld.title}.png`;
                                            link.click();
                                        }}
                                        className="p-2 bg-black/50 hover:bg-black/80 rounded backdrop-blur-md border border-white/10 text-white transition-all"
                                    >
                                        <Download size={18} />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="p-8">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-6">
                                    <h3 className="text-3xl font-bold text-white font-display">{generatedWorld.title}</h3>
                                    <div className="flex items-center gap-3">
                                        <span className="px-3 py-1 rounded bg-slate-800 text-slate-400 text-xs font-medium border border-slate-700">{generatedWorld.tags[0]}</span>
                                        <Button onClick={() => onWorldCreated(generatedWorld)} variant="secondary" size="sm" className="bg-white text-slate-900 hover:bg-slate-200">
                                            保存到画廊
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-slate-300 text-lg leading-relaxed font-light opacity-90">
                                    {generatedWorld.description}
                                </p>
                            </div>
                         </div>
                    </div>
                )}
             </div>
        </div>
      </div>

      {/* 
        ========================================
        RIGHT PANEL: ARCHITECT (SIDEBAR)
        ========================================
      */}
      
      {/* 1. Mobile Backdrop */}
      {showArchitect && (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden animate-in fade-in duration-200"
            onClick={() => setShowArchitect(false)}
        />
      )}

      {/* 2. Sidebar Container */}
      <div 
        className={`
            group bg-slate-950 border-l border-slate-800 flex-shrink-0 z-[70]

            /* Mobile: Drawer Behavior */
            fixed inset-y-0 right-0 w-[85vw] shadow-2xl
            transform transition-transform duration-300 ease-out
            ${showArchitect ? 'translate-x-0' : 'translate-x-full'}

            /* Desktop: Tiled/Split Behavior (Overrides Mobile) */
            md:relative md:inset-auto md:z-auto md:shadow-none md:transform-none
            md:transition-[width,opacity] md:duration-300 md:ease-[cubic-bezier(0.25,1,0.5,1)]
            ${showArchitect 
                ? 'md:w-[400px] md:opacity-100' 
                : 'md:w-0 md:opacity-0 md:border-l-0 md:overflow-hidden'
            }
        `}
      >
        {/* 
            3. Inner Content Wrapper 
        */}
        <div className="w-[85vw] md:w-[400px] h-full flex flex-col bg-slate-950">
            
            {/* Sidebar Header */}
            <div className="h-14 px-4 flex items-center justify-between border-b border-slate-800 bg-slate-950 shrink-0">
                <div className="flex items-center gap-2 text-indigo-400">
                    <Bot size={18} />
                    <span className="font-bold text-xs uppercase tracking-wider text-indigo-100">Architect AI</span>
                </div>
                <button 
                    onClick={() => setShowArchitect(false)}
                    className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded transition-all"
                    title="Collapse Sidebar"
                >
                    <PanelRightClose size={18} />
                </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-slate-950">
                {messages.map((msg, idx) => {
                    // Check if there is a draft in the message
                    const { cleanText, draft } = msg.role === 'model' ? parseMessage(msg.text) : { cleanText: msg.text, draft: null };
                    
                    return (
                        <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 fade-in duration-300`}>
                            {/* Text Bubble */}
                            <div 
                                className={`max-w-[90%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
                                    msg.role === 'user' 
                                    ? 'bg-indigo-600 text-white rounded-br-none' 
                                    : 'bg-slate-900 border border-slate-800 text-slate-300 rounded-bl-none'
                                }`}
                            >
                                <span className="whitespace-pre-wrap">{cleanText}</span>
                            </div>

                            {/* Render Draft Card if present */}
                            {draft && (
                                <div className="max-w-[95%] w-full">
                                    <DraftCard draft={draft} onApply={() => handleApplyDraft(draft)} />
                                </div>
                            )}
                        </div>
                    );
                })}
                
                {isChatThinking && (
                    <div className="flex justify-start animate-in fade-in">
                        <div className="bg-slate-900 rounded-lg rounded-bl-none px-4 py-3 border border-slate-800">
                             <div className="flex gap-1.5">
                                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                             </div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 shrink-0 space-y-3">
                 {/* Suggestion Chips */}
                 {suggestions.length > 0 && !isChatThinking && (
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mask-fade-right">
                        {suggestions.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => handleSendMessage(s.prompt)}
                                className="whitespace-nowrap shrink-0 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded text-xs text-slate-400 hover:text-slate-200 transition-all flex items-center gap-1.5"
                            >
                                <Lightbulb size={10} className="text-yellow-500/50" />
                                {s.label}
                            </button>
                        ))}
                    </div>
                )}

                <div className="relative">
                    <input 
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type a message..."
                        className="w-full bg-slate-900 border border-slate-800 rounded pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600 font-sans"
                    />
                    <button 
                        onClick={() => handleSendMessage()} 
                        disabled={!chatInput.trim() || isChatThinking}
                        className="absolute right-1.5 top-1.5 w-9 h-9 flex items-center justify-center rounded bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-0 disabled:scale-75 transition-all duration-200"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};