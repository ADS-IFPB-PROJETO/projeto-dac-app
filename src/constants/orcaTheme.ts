/**
 * Tokens semânticos de cores e espaçamentos do ORCA.
 * Baseado em .context/identidade-visual.md
 */
export const OrcaColors = {
  bgCanvas: '#ECF6F4',
  brandPrimary: '#0F273D',
  brandHover: '#1A3B59',
  statusWarning: '#DDA64B',
  statusSuccess: '#2CE078',
  statusSuccessSoft: 'rgba(44, 224, 120, 0.15)',
  statusWarningSoft: 'rgba(221, 166, 75, 0.15)',
  statusDanger: '#DF4F52',
  statusDangerSoft: 'rgba(223, 79, 82, 0.15)',
  borderSubtle: '#C6D2D0',
  textMuted: '#748598',
  surfaceCard: '#FFFFFF',
  surfaceSubtle: '#F5FAF9',
  white: '#FFFFFF',
} as const;

export const OrcaRadius = {
  sm: 8,
  md: 10,
  lg: 12,
  full: 9999,
} as const;
