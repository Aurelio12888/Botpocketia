
import React from 'react';
import { AnalysisResult } from '../types';

interface ExtendedAnalysisResult extends AnalysisResult {
  strategiesChecked?: string[];
}

interface AnalysisDisplayProps {
  result: ExtendedAnalysisResult | null;
  loading: boolean;
}

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ result, loading }) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-6">
        <div className="relative">
          <div className="w-20 h-20 border-2 border-blue-500/20 rounded-full"></div>
          <div className="absolute inset-0 w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-4 bg-blue-500/10 rounded-full animate-pulse flex items-center justify-center">
            <span className="text-[10px] text-blue-400 font-bold">AI</span>
          </div>
        </div>
        <div className="text-center">
          <p className="text-blue-400 font-orbitron text-sm tracking-widest animate-pulse">ESCANEANDO MICRO-VARIAÇÕES</p>
          <p className="text-[10px] text-gray-500 mt-2">Aplicando estratégias de fluxo e rejeição...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center px-6">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-gray-400 mb-1">Módulo Neural em Standby</p>
        <p className="text-[11px] leading-relaxed opacity-60">Selecione o ativo e o tempo gráfico para ativar o processamento de fluxo em tempo real.</p>
      </div>
    );
  }

  const isBuy = result.signal === 'BUY';
  const isSell = result.signal === 'SELL';

  return (
    <div className="p-5 flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Sinal Gerado</span>
          <div className="text-xs text-gray-500 font-mono">ID: {Math.random().toString(36).substring(7).toUpperCase()}</div>
        </div>
        <div className="bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
          <span className="text-[10px] font-bold text-blue-400">{result.confidence}% CONF</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center py-4">
        <div className={`text-6xl font-orbitron font-black mb-2 transition-all duration-500 ${isBuy ? 'text-green-500 neon-text-green' : isSell ? 'text-red-500 neon-text-red' : 'text-gray-500'}`}>
          {result.signal}
        </div>
        <div className={`text-2xl font-bold ${isBuy ? 'text-green-500/50' : isSell ? 'text-red-500/50' : 'text-gray-500'}`}>
          {isBuy ? 'CALL ⬆' : isSell ? 'PUT ⬇' : 'HOLD 〰'}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">Estratégias Detectadas</p>
          <div className="flex flex-wrap gap-1">
            {result.strategiesChecked?.map((strat, i) => (
              <span key={i} className="text-[9px] bg-blue-900/30 text-blue-300 px-2 py-0.5 rounded border border-blue-500/20 font-mono">
                {strat}
              </span>
            )) || <span className="text-[9px] text-gray-600">Price Action Standard</span>}
          </div>
        </div>

        <div className="bg-white/5 p-3 rounded-lg border border-white/10">
          <p className="text-[10px] text-blue-400 uppercase font-bold mb-1 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"/></svg>
            Insight Técnico:
          </p>
          <p className="text-[11px] text-gray-300 leading-snug">
            {result.reason}
          </p>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center text-[9px] text-gray-500 font-mono">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
          PRECISÃO OTIMIZADA
        </span>
        <span>{new Date(result.timestamp).toLocaleTimeString()}</span>
      </div>
    </div>
  );
};

export default AnalysisDisplay;
