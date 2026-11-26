import React, { useState } from 'react';
import { formatCurrencyBRL } from '@/utils/formatters';

export interface DonutSlice {
  id: string;
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  slices: DonutSlice[];
  centerLabel?: string;
  centerValue?: string;
  emptyMessage?: string;
}

/**
 * Gráfico de rosca (Donut) em SVG com legenda à direita e leitura tabular-nums.
 */
export function DonutChart({
  slices,
  centerLabel = 'Total',
  centerValue,
  emptyMessage = 'Sem dados registrados para exibição.',
}: DonutChartProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const validSlices = slices.filter((s) => s.value > 0);
  const total = validSlices.reduce((acc, s) => acc + s.value, 0);

  if (total <= 0) {
    return (
      <div className="flex flex-col sm:flex-row items-center gap-6 py-4">
        <div className="w-36 h-36 rounded-full border-[14px] border-[#C6D2D0]/40 flex items-center justify-center shrink-0">
          <span className="text-xs text-[#748598] font-medium">0%</span>
        </div>
        <p className="text-sm text-[#748598]">{emptyMessage}</p>
      </div>
    );
  }

  const size = 160;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;
  const segments = validSlices.map((slice) => {
    const percent = slice.value / total;
    const dashLength = percent * circumference;
    const dashOffset = -cumulativePercent * circumference;
    cumulativePercent += percent;
    return {
      ...slice,
      percent: percent * 100,
      dashLength,
      dashOffset,
    };
  });

  const activeSegment = segments.find((s) => s.id === hoveredId) ?? null;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
      {/* Gráfico SVG */}
      <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90 overflow-visible"
          role="img"
          aria-label={centerLabel}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#ECF6F4"
            strokeWidth={strokeWidth}
          />
          {segments.map((seg) => {
            const isHovered = hoveredId === seg.id;
            return (
              <circle
                key={seg.id}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={`${seg.dashLength} ${circumference}`}
                strokeDashoffset={seg.dashOffset}
                strokeLinecap="butt"
                onMouseEnter={() => setHoveredId(seg.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="transition-all duration-200 cursor-pointer"
              />
            );
          })}
        </svg>

        {/* Centro do Donut */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pointer-events-none">
          <span className="text-[11px] font-medium text-[#748598] leading-tight line-clamp-1">
            {activeSegment ? activeSegment.label : centerLabel}
          </span>
          <span className="text-sm font-bold text-[#0F273D] tabular-nums mt-0.5">
            {activeSegment
              ? `${activeSegment.percent.toFixed(1)}%`
              : centerValue ?? formatCurrencyBRL(total)}
          </span>
        </div>
      </div>

      {/* Legenda à direita */}
      <div className="flex-1 w-full space-y-2.5">
        {segments.map((seg) => {
          const isHovered = hoveredId === seg.id;
          return (
            <div
              key={seg.id}
              onMouseEnter={() => setHoveredId(seg.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`flex items-center justify-between gap-3 px-2 py-1 rounded-md transition-colors cursor-default ${
                isHovered ? 'bg-[#F5FAF9]' : ''
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-[2px] shrink-0"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="text-xs sm:text-sm text-[#0F273D] truncate">{seg.label}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 tabular-nums">
                <span className="text-xs text-[#748598] hidden md:inline">
                  {formatCurrencyBRL(seg.value)}
                </span>
                <span className="text-xs sm:text-sm font-bold text-[#0F273D] w-12 text-right">
                  {seg.percent.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
