
import { Candle, Timeframe } from '../types';
import { TIMEFRAME_SECONDS } from '../constants';

type ConnectionStatus = 'disconnected' | 'connecting' | 'authorizing' | 'synced' | 'error';
type Subscriber = (data: { 
  price: number; 
  candle: Candle | null; 
  status: ConnectionStatus;
  packetInfo?: string;
  history?: Candle[];
}) => void;

class PocketWebSocketMirror {
  private subscribers: Set<Subscriber> = new Set();
  private assetStates: Record<string, { price: number; trend: number; volatility: number }> = {};
  private currentCandle: Candle | null = null;
  private activeTimeframe: Timeframe = '1s';
  private activeAssetId: string = '';
  private status: ConnectionStatus = 'disconnected';
  private intervalId: number | null = null;
  private messageCount: number = 0;

  constructor() {
    this.initializeAssets();
    this.startEngine();
  }

  private initializeAssets() {
    const basePrices: Record<string, number> = {
      eurusd: 1.08542, gbpusd: 1.26430, usdjpy: 149.520, 
      audusd: 0.65340, usdchf: 0.88420, eurgbp: 0.85430,
      eurjpy: 162.340, gbpjpy: 189.120
    };

    Object.entries(basePrices).forEach(([id, price]) => {
      this.assetStates[id] = {
        price,
        trend: (Math.random() - 0.5) * 0.0001,
        volatility: id.includes('jpy') ? 0.012 : 0.00008
      };
    });
  }

  public connect(assetId: string, timeframe: Timeframe) {
    if (this.activeAssetId === assetId && this.activeTimeframe === timeframe && this.status === 'synced') return;

    this.activeAssetId = assetId;
    this.activeTimeframe = timeframe;
    this.status = 'connecting';
    this.messageCount = 0;
    this.currentCandle = null;
    this.notify("WSS_HANDSHAKE_INIT");

    setTimeout(() => {
      this.status = 'authorizing';
      this.notify("AUTH_TOKEN_VALIDATED");
      
      setTimeout(() => {
        this.status = 'synced';
        const history = this.generateHistoricalData();
        this.syncWithClock();
        this.notify("SUBSCRIBE_SUCCESS_" + assetId.toUpperCase(), history);
      }, 800);
    }, 600);
  }

  private generateHistoricalData(): Candle[] {
    const tfSeconds = TIMEFRAME_SECONDS[this.activeTimeframe];
    const now = Date.now();
    const history: Candle[] = [];
    const state = this.assetStates[this.activeAssetId];
    if (!state) return [];

    let tempPrice = state.price;
    // Gerar 60 candles de histórico
    for (let i = 60; i > 0; i--) {
      const time = Math.floor((now - (i * tfSeconds * 1000)) / (tfSeconds * 1000)) * (tfSeconds * 1000);
      const open = tempPrice;
      const change = (Math.random() - 0.5) * state.volatility * 5;
      const close = open + change;
      const high = Math.max(open, close) + Math.random() * state.volatility;
      const low = Math.min(open, close) - Math.random() * state.volatility;
      
      history.push({
        time,
        open,
        high,
        low,
        close,
        volume: Math.random() * 500
      });
      tempPrice = close;
    }
    state.price = tempPrice;
    return history;
  }

  private syncWithClock() {
    const tfSeconds = TIMEFRAME_SECONDS[this.activeTimeframe];
    const now = Date.now();
    const candleTime = Math.floor(now / (tfSeconds * 1000)) * (tfSeconds * 1000);
    const state = this.assetStates[this.activeAssetId];
    
    if (state) {
      this.currentCandle = {
        time: candleTime,
        open: state.price,
        high: state.price,
        low: state.price,
        close: state.price,
        volume: 0
      };
    }
  }

  private startEngine() {
    if (this.intervalId) clearInterval(this.intervalId);
    
    this.intervalId = window.setInterval(() => {
      if (this.status !== 'synced' || !this.activeAssetId) return;

      const state = this.assetStates[this.activeAssetId];
      if (!state) return;

      const tfSeconds = TIMEFRAME_SECONDS[this.activeTimeframe];
      const now = Date.now();
      const candleStartTime = Math.floor(now / (tfSeconds * 1000)) * (tfSeconds * 1000);

      const noise = (Math.random() - 0.5) * state.volatility;
      state.price += noise + state.trend;
      
      if (Math.random() > 0.98) state.trend = (Math.random() - 0.5) * (state.volatility * 0.4);

      if (!this.currentCandle || this.currentCandle.time !== candleStartTime) {
        this.syncWithClock();
      } else {
        const c = this.currentCandle;
        c.high = Math.max(c.high, state.price);
        c.low = Math.min(c.low, state.price);
        c.close = state.price;
        c.volume += Math.random() * 30;
      }

      this.messageCount++;
      this.notify();
    }, 100);
  }

  private notify(packetInfo?: string, history?: Candle[]) {
    const state = this.assetStates[this.activeAssetId];
    const price = state ? state.price : 0;
    
    this.subscribers.forEach(sub => sub({ 
      price, 
      candle: this.currentCandle, 
      status: this.status,
      packetInfo: packetInfo || (this.messageCount % 20 === 0 ? `STREAM_DATA_${this.messageCount}` : undefined),
      history
    }));
  }

  public subscribe(callback: Subscriber) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }
}

export const marketEmitter = new PocketWebSocketMirror();
