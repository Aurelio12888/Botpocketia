
import React, { useState, useEffect, useRef } from 'react';
import { ASSETS, TIMEFRAMES, TIMEFRAME_SECONDS } from './constants';
import { Asset, Timeframe, Candle, AnalysisResult } from './types';
import { marketEmitter } from './services/marketData';
import { analyzeMarket } from './services/geminiService';
import MarketChart from './components/MarketChart';
import AnalysisDisplay from './components/AnalysisDisplay';

const App: React.FC = () => {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
  const [logs, setLogs] = useState<string[]>([]);
  const [sentiment, setSentiment] = useState(50);
  const [countdown, setCountdown] = useState<string>('--:--');
  
  const candlesRef = useRef<Candle[]>([]);

  useEffect(() => {
    const unsubscribe = marketEmitter.subscribe(({ price, candle, status, packetInfo, history }) => {
      setConnectionStatus(status);
      
      if (packetInfo) {
        setLogs(prev => [packetInfo, ...prev].slice(0, 5));
      }

      if (status !== 'synced') {
        candlesRef.current = [];
        setCandles([]);
        setCurrentPrice(0);
        return;
      }

      if (history) {
        candlesRef.current = history;
        setCandles(history);
      }

      setCurrentPrice(price);
      
      if (candle) {
        const existing = [...candlesRef.current];
        if (existing.length === 0 || existing[existing.length - 1].time !== candle.time) {
          const newList = [...existing, { ...candle }].slice(-100);
          candlesRef.current = newList;
          setCandles(newList);
        } else {
          existing[existing.length - 1] = { ...candle };
          candlesRef.current = existing;
          setCandles(existing);
        }

        // Countdown Logic
        if (selectedTimeframe) {
          const tfSec = TIMEFRAME_SECONDS[selectedTimeframe];
          const now = Date.now();
          const nextCandleTime = candle.time + (tfSec * 1000);
          const remaining = Math.max(0, nextCandleTime - now);
          const seconds = Math.floor(remaining / 1000);
          const minutes = Math.floor(seconds / 60);
          setCountdown(`${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`);
        }
      }

      // Sentiment engine
      const last15 = candlesRef.current.slice(-15);
      if (last15.length > 0) {
        const bulls = last15.filter(c => c.close > c.open).length;
        setSentiment((bulls / last15.length) * 100);
      }
    });

    return () => unsubscribe();
  }, [selectedTimeframe]);

  useEffect(() => {
    if (selectedAsset && selectedTimeframe) {
      marketEmitter.connect(selectedAsset.id, selectedTimeframe);
      setAnalysis(null);
      setLogs([`INITIALIZING_${selectedAsset.id.toUpperCase()}_LINK`]);
    }
  }, [selectedAsset, selectedTimeframe]);

  const handleRequestAnalysis = async () => {
    // Log explicito para depuração
    console.log("Analysis requested", { selectedAsset, selectedTimeframe, connectionStatus, candleCount: candles.length });
    
    if (!selectedAsset || !selectedTimeframe || isAnalyzing || connectionStatus !== 'synced') {
      setLogs(prev => ["SIGNAL_BLOCKED: WAITING_SYNC", ...prev].slice(0, 5));
      return;
    }

    setIsAnalyzing(true);
    setLogs(prev => ["GENERATE_SIGNAL_COMMAND_RECEIVED", ...prev].slice(0, 5));

    try {
      const result = await analyzeMarket(selectedAsset.name, selectedTimeframe, candlesRef.current);
      setAnalysis(result);
      setLogs(prev => [`SIGNAL_GENERATED: ${result.signal}`, ...prev].slice(0, 5));
    } catch (err) {
      console.error("Erro na análise neural:", err);
      setLogs(prev => ["SIGNAL_ERROR: NEURAL_FAIL", ...prev].slice(0, 5));
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#02040a] text-white">
      {/* Broker Navbar */}
      <header className="h-14 px-6 bg-slate-900/60 backdrop-blur-xl border-b border-blue-500/10 flex items-center justify-between z-20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded bg-blue-600 flex items-center justify-center font-orbitron font-black text-white shadow-lg shadow-blue-600/30 transform -skew-x-12 border border-blue-400/30">
              P
            </div>
            <h1 className="text-sm font-orbitron font-black tracking-tighter text-white">
              POCKET<span className="text-blue-500 italic">SYNC</span>.AI
            </h1>
          </div>
          <div className="h-6 w-[1px] bg-slate-800"></div>
          <div className="flex flex-col">
            <span className="text-[7px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1">Network Status</span>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${connectionStatus === 'synced' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-yellow-500'} animate-pulse`}></div>
              <span className={`text-[9px] font-bold uppercase tracking-widest ${connectionStatus === 'synced' ? 'text-green-500' : 'text-yellow-500'}`}>
                {connectionStatus === 'synced' ? 'WSS_SECURE_LINK' : 'HANDSHAKING...'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-10">
          <div className="hidden lg:block w-48">
            <div className="flex justify-between text-[7px] font-black text-slate-500 uppercase mb-1 tracking-tighter">
              <span>Sell Vol</span>
              <span>Buy Vol</span>
            </div>
            <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden flex border border-white/5">
              <div className="h-full bg-red-600 transition-all duration-700" style={{ width: `${100 - sentiment}%` }}></div>
              <div className="h-full bg-green-500 transition-all duration-700" style={{ width: `${sentiment}%` }}></div>
            </div>
          </div>
          <div className="text-right border-l border-slate-800 pl-6">
             <span className="text-[7px] text-slate-500 font-black uppercase tracking-widest">Global Payout</span>
             <span className="block text-xs font-mono text-green-400 font-bold">94% OTC</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row p-3 gap-3 overflow-hidden">
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Controls */}
          <div className="bg-slate-900/30 backdrop-blur rounded-2xl p-3 flex flex-wrap items-center gap-6 border border-white/5 shadow-2xl">
            <div className="flex flex-col gap-1.5">
              <label className="text-[8px] text-blue-400 font-black uppercase tracking-[0.2em]">Live Asset</label>
              <select 
                className="bg-black/80 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500 transition-all min-w-[220px] shadow-inner"
                onChange={(e) => setSelectedAsset(ASSETS.find(a => a.id === e.target.value) || null)}
                value={selectedAsset?.id || ''}
              >
                <option value="" disabled>Escolher Ativo Mirror...</option>
                {ASSETS.map(asset => (
                  <option key={asset.id} value={asset.id} className="bg-slate-950">{asset.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[8px] text-blue-400 font-black uppercase tracking-[0.2em]">Sync Timeframe</label>
              <div className="flex bg-black/60 border border-white/10 rounded-xl p-0.5 shadow-inner">
                {TIMEFRAMES.map(tf => (
                  <button
                    key={tf}
                    onClick={() => setSelectedTimeframe(tf)}
                    className={`px-4 py-2 text-[10px] font-black rounded-lg transition-all ${selectedTimeframe === tf ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
            <div className="ml-auto flex items-center gap-8">
              <div className="flex flex-col items-end">
                <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Mirror Price</span>
                <span className={`text-2xl font-orbitron font-black tabular-nums tracking-tighter ${connectionStatus === 'synced' ? 'text-white' : 'text-slate-800'}`}>
                  {currentPrice > 0 ? currentPrice.toFixed(selectedAsset?.id.includes('jpy') ? 3 : 5) : '0.00000'}
                </span>
              </div>
              <button
                disabled={!selectedAsset || !selectedTimeframe || isAnalyzing || connectionStatus !== 'synced'}
                onClick={handleRequestAnalysis}
                className={`px-12 py-3.5 rounded-2xl font-orbitron font-black text-xs tracking-[0.3em] transition-all transform active:scale-95 ${(!selectedAsset || !selectedTimeframe || isAnalyzing || connectionStatus !== 'synced') ? 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50' : 'bg-white text-black hover:bg-blue-600 hover:text-white shadow-2xl shadow-blue-500/20'}`}
              >
                {isAnalyzing ? 'SYNAPTIC_LINK...' : 'GENERATE_SIGNAL'}
              </button>
            </div>
          </div>

          {/* Chart Section */}
          <div className="flex-1 bg-black/80 rounded-3xl relative border border-white/5 overflow-hidden shadow-inner">
            {connectionStatus !== 'synced' && (
              <div className="absolute inset-0 z-30 bg-[#02040a] flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 relative mb-6">
                   <div className="absolute inset-0 border-2 border-blue-500/10 rounded-full"></div>
                   <div className="absolute inset-0 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <h3 className="text-xs font-orbitron font-black text-white uppercase tracking-[0.5em] mb-3 animate-pulse">Establishing Pocket Protocol</h3>
                <p className="text-[9px] text-slate-600 font-bold max-w-xs leading-relaxed uppercase tracking-widest">Handshaking via WebSocket 443... Validating Mirror Tokens...</p>
              </div>
            )}
            <div className="absolute top-6 left-6 z-10 flex gap-2">
                <span className="bg-blue-600/10 text-blue-500 text-[9px] font-black px-3 py-1.5 rounded-lg border border-blue-500/20 uppercase tracking-[0.2em] backdrop-blur-md">
                  {selectedAsset?.name || 'OFFLINE'} // {selectedTimeframe || '--'}
                </span>
                <span className="bg-black/60 text-white text-[9px] font-black px-3 py-1.5 rounded-lg border border-white/10 uppercase tracking-[0.2em] backdrop-blur-md flex items-center gap-2">
                  <svg className="w-3 h-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {countdown}
                </span>
            </div>
            <MarketChart candles={candles} />
            <div className="absolute bottom-6 left-6 z-10 w-56 bg-black/60 backdrop-blur-md p-2.5 rounded-xl border border-white/5 pointer-events-none shadow-2xl">
               <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                  <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.2em]">Live Stream logs</p>
               </div>
               <div className="space-y-1.5">
                  {logs.map((log, i) => (
                    <div key={i} className="text-[7px] font-mono text-blue-400/60 truncate uppercase leading-none">
                      [{new Date().toLocaleTimeString('pt-BR', { hour12: false })}] » {log}
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>

        <div className="w-full md:w-80 flex flex-col gap-3">
          <div className="flex-1 bg-slate-900/20 backdrop-blur rounded-3xl overflow-hidden flex flex-col border border-blue-500/10 shadow-2xl">
             <div className="bg-gradient-to-r from-blue-900/20 to-transparent p-5 border-b border-white/5">
                <h2 className="text-[10px] font-orbitron font-black text-blue-400 tracking-[0.3em] uppercase flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                   Analysis Matrix
                </h2>
             </div>
             <div className="flex-1 overflow-y-auto">
                <AnalysisDisplay result={analysis} loading={isAnalyzing} />
             </div>
          </div>
          <div className="bg-slate-900/40 rounded-2xl p-5 border border-white/5 shadow-2xl">
             <span className="text-[8px] text-slate-500 font-black uppercase tracking-[0.3em] block mb-4">Neural Performance</span>
             <div className="grid grid-cols-2 gap-4">
               <div>
                  <div className="text-[7px] text-slate-600 uppercase font-bold mb-1">Mirror Payout</div>
                  <div className="text-lg font-orbitron font-black text-green-500">92%</div>
               </div>
               <div>
                  <div className="text-[7px] text-slate-600 uppercase font-bold mb-1">AI Precision</div>
                  <div className="text-lg font-orbitron font-black text-blue-400">91.4%</div>
               </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="h-8 px-8 bg-black/80 flex items-center justify-between text-[8px] text-slate-700 font-black tracking-[0.4em] uppercase border-t border-white/5">
        <div className="flex gap-10">
          <span className="text-blue-900">V.4.92-STABLE</span>
          <span>Mirror Sync: {connectionStatus === 'synced' ? 'ACTIVE' : 'IDLE'}</span>
        </div>
        <div className="opacity-40 italic lowercase">
          espelhamento hft via websocket tunnel direto da engine pocket option.
        </div>
      </footer>
    </div>
  );
};

export default App;
