
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, Candle, Timeframe } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeMarket = async (
  assetName: string,
  timeframe: Timeframe,
  candles: Candle[]
): Promise<AnalysisResult> => {
  try {
    const recentData = candles.slice(-30).map(c => ({
      o: c.open.toFixed(5),
      h: c.high.toFixed(5),
      l: c.low.toFixed(5),
      c: c.close.toFixed(5),
      v: Math.round(c.volume)
    }));

    // Detect technical patterns to pass as context
    const last3 = candles.slice(-3);
    const isBullishSequence = last3.every(c => c.close > c.open);
    const isBearishSequence = last3.every(c => c.close < c.open);

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Análise Profissional OTC: ${assetName} | Timeframe: ${timeframe}.
      CONTEXTO TÉCNICO:
      - Sequência Atual: ${isBullishSequence ? 'Bullish Momentum' : isBearishSequence ? 'Bearish Momentum' : 'Ranging'}
      - Histórico (30 candles): ${JSON.stringify(recentData)}.
      
      ESTRATÉGIAS OBRIGATÓRIAS PARA VERIFICAR:
      1. MHI (Padrão de 3 velas em ciclos de 5): Identificar se o próximo candle segue a minoria.
      2. Rejeição de Pavio: Verificar se houve toque em suportes/resistências locais com retração imediata.
      3. Fluxo de Vela (Continuity): Se o corpo da última vela é > 70% do tamanho total (sem pavio superior/inferior expressivo).
      4. Micro-Gaps: Verificar saltos de preço entre o fechamento anterior e abertura atual.

      REGRAS:
      - Foque 100% em assertividade para o PRÓXIMO candle.
      - Se houver dúvida ou mercado lateral sem volume, retorne WAIT.`,
      config: {
        systemInstruction: "Você é um algoritmo de alta frequência (HFT) especializado em Pocket Broker OTC. Sua análise deve ser seca, técnica e focada em probabilidade estatística de reversão ou continuidade. Retorne exclusivamente JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            signal: { type: Type.STRING, enum: ["BUY", "SELL", "WAIT"] },
            confidence: { type: Type.NUMBER, description: "Probabilidade de acerto 0-100" },
            reason: { type: Type.STRING, description: "Estratégia aplicada (ex: MHI, Rejeição, Fluxo)" },
            strategiesChecked: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Lista de estratégias detectadas no gráfico"
            }
          },
          required: ["signal", "confidence", "reason", "strategiesChecked"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return {
      ...result,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error("Erro na análise profunda:", error);
    return {
      signal: 'WAIT',
      confidence: 0,
      reason: 'Instabilidade no processamento neural.',
      timestamp: Date.now()
    };
  }
};
