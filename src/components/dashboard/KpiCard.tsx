import React from 'react';
import { cn } from '@/utils/cn';

export type KpiTone = 'neutral' | 'success' | 'warning' | 'danger';

interface KpiCardProps {
  label: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  tone?: KpiTone;
}

const TONE_STYLES: Record<KpiTone, { iconBg: string; valueText: string; border: string }> = {
  neutral: {
    iconBg: 'bg-[#ECF6F4] text-[#0F273D]',
    valueText: 'text-[#0F273D]',
    border: 'border-[#C6D2D0]',
  },
  success: {
    iconBg: 'bg-[#2CE078]/15 text-[#0F273D]',
    valueText: 'text-[#0F273D]',
    border: 'border-[#2CE078]/60',
  },
  warning: {
    iconBg: 'bg-[#DDA64B]/15 text-[#0F273D]',
    valueText: 'text-[#0F273D]',
    border: 'border-[#DDA64B]/60',
  },
  danger: {
    iconBg: 'bg-[#DF4F52]/15 text-[#DF4F52]',
    valueText: 'text-[#DF4F52]',
    border: 'border-[#DF4F52]/60',
  },
};

/**
 * Card de indicador financeiro (KPI) para o topo do Dashboard.
 */
export function KpiCard({ label, value, subtitle, icon, tone = 'neutral' }: KpiCardProps) {
  const styles = TONE_STYLES[tone];

  return (
    <div
      className={cn(
        'bg-white border rounded-xl p-5 flex flex-col justify-between gap-3 shadow-xs transition-shadow hover:shadow-sm',
        styles.border
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-medium text-[#748598] leading-snug">{label}</span>
        <div
          className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
            styles.iconBg
          )}
        >
          {icon}
        </div>
      </div>

      <div>
        <div
          className={cn(
            'text-lg sm:text-xl font-bold font-display tabular-nums tracking-tight',
            styles.valueText
          )}
        >
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-[#748598] mt-1 tabular-nums leading-tight">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
