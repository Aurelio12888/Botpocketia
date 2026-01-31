
export type Timeframe = '1s' | '5s' | '30s' | '1m' | '5m';

export interface Asset {
  id: string;
  name: string;
  symbol: string;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface AnalysisResult {
  signal: 'BUY' | 'SELL' | 'WAIT';
  confidence: number;
  reason: string;
  timestamp: number;
}

export interface MarketState {
  currentPrice: number;
  priceHistory: number[];
  candles: Candle[];
}
