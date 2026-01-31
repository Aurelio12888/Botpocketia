
import React from 'react';
import { Asset, Timeframe } from './types';

export const ASSETS: Asset[] = [
  { id: 'eurusd', name: 'EUR/USD OTC', symbol: '€/$' },
  { id: 'gbpusd', name: 'GBP/USD OTC', symbol: '£/$' },
  { id: 'usdjpy', name: 'USD/JPY OTC', symbol: '$/¥' },
  { id: 'audusd', name: 'AUD/USD OTC', symbol: 'A$/$' },
  { id: 'usdchf', name: 'USD/CHF OTC', symbol: '$/Fr' },
  { id: 'eurgbp', name: 'EUR/GBP OTC', symbol: '€/£' },
  { id: 'eurjpy', name: 'EUR/JPY OTC', symbol: '€/¥' },
  { id: 'gbpjpy', name: 'GBP/JPY OTC', symbol: '£/¥' },
];

export const TIMEFRAMES: Timeframe[] = ['1s', '5s', '30s', '1m', '5m'];

export const TIMEFRAME_SECONDS: Record<Timeframe, number> = {
  '1s': 1,
  '5s': 5,
  '30s': 30,
  '1m': 60,
  '5m': 300,
};
