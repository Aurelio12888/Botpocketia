
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Candle } from '../types';

interface MarketChartProps {
  candles: Candle[];
}

const MarketChart: React.FC<MarketChartProps> = ({ candles }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || candles.length === 0) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    const margin = { top: 20, right: 80, bottom: 30, left: 10 };

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale (Time)
    const xScale = d3.scaleBand()
      .domain(candles.map(c => c.time.toString()))
      .range([0, chartWidth])
      .padding(0.3);

    // Y Scale (Price) - Adaptativa para JPY e USD
    const yMin = d3.min(candles, c => c.low) || 0;
    const yMax = d3.max(candles, c => c.high) || 0;
    const diff = yMax - yMin;
    const padding = diff === 0 ? 0.001 : diff * 0.2;

    const yScale = d3.scaleLinear()
      .domain([yMin - padding, yMax + padding])
      .range([chartHeight, 0]);

    // Background Grid
    g.append('g')
      .attr('stroke', 'rgba(255,255,255,0.03)')
      .call(d3.axisLeft(yScale).tickSize(-chartWidth).tickFormat(() => ""));

    // Lateral Axis
    const isJpy = yMax > 10;
    const yAxis = d3.axisRight(yScale)
      .ticks(12)
      .tickFormat(d3.format(isJpy ? ".3f" : ".5f"));

    const yAxisG = g.append('g')
      .attr('transform', `translate(${chartWidth}, 0)`)
      .call(yAxis);

    yAxisG.selectAll('text')
      .attr('fill', '#4b5563')
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'monospace');
    
    yAxisG.select('.domain').remove();
    yAxisG.selectAll('line').attr('stroke', 'rgba(255,255,255,0.08)');

    // Candlesticks
    const candleG = g.selectAll('.candle')
      .data(candles)
      .enter()
      .append('g')
      .attr('class', 'candle');

    candleG.append('line')
      .attr('x1', d => (xScale(d.time.toString()) || 0) + xScale.bandwidth() / 2)
      .attr('x2', d => (xScale(d.time.toString()) || 0) + xScale.bandwidth() / 2)
      .attr('y1', d => yScale(d.high))
      .attr('y2', d => yScale(d.low))
      .attr('stroke', d => d.close >= d.open ? '#22c55e' : '#ef4444')
      .attr('stroke-width', 1.5);

    candleG.append('rect')
      .attr('x', d => xScale(d.time.toString()) || 0)
      .attr('y', d => yScale(Math.max(d.open, d.close)))
      .attr('width', xScale.bandwidth())
      .attr('height', d => Math.max(1, Math.abs(yScale(d.open) - yScale(d.close))))
      .attr('fill', d => d.close >= d.open ? '#22c55e' : '#ef4444')
      .attr('stroke', d => d.close >= d.open ? '#22c55e' : '#ef4444')
      .attr('stroke-width', 0.5)
      .attr('rx', 0.5);

    // Current Price Indicator
    const lastCandle = candles[candles.length - 1];
    const currentY = yScale(lastCandle.close);

    const priceLine = g.append('g');
    
    priceLine.append('line')
      .attr('x1', 0)
      .attr('x2', chartWidth)
      .attr('y1', currentY)
      .attr('y2', currentY)
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,2')
      .attr('opacity', 0.6);

    const priceBadge = priceLine.append('g')
        .attr('transform', `translate(${chartWidth}, ${currentY})`);

    priceBadge.append('rect')
        .attr('x', 0)
        .attr('y', -9)
        .attr('width', 75)
        .attr('height', 18)
        .attr('fill', '#3b82f6')
        .attr('rx', 2);

    priceBadge.append('text')
        .attr('x', 6)
        .attr('y', 4)
        .attr('fill', 'white')
        .attr('font-size', '9px')
        .attr('font-weight', 'black')
        .attr('font-family', 'monospace')
        .text(lastCandle.close.toFixed(isJpy ? 3 : 5));

  }, [candles]);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-[#020408]">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};

export default MarketChart;
