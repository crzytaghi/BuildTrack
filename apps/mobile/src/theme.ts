export const colors = {
  // Backgrounds
  pageBg: '#0b1118',
  cardBg: '#0f172a',
  inputBg: '#111827',

  // Text
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  textLabel: '#e2e8f0',
  textMuted: '#64748b',

  // Brand / actions
  primary: '#0ea5e9',
  primaryText: '#0f172a',
  link: '#93c5fd',

  // Status
  errorBg: '#7f1d1d',
  errorText: '#fecaca',
  successBg: '#14532d',
  successText: '#bbf7d0',
  warningBg: '#78350f',
  warningText: '#fde68a',

  // Status badges
  statusPlanning: '#1e3a5f',
  statusPlanningText: '#93c5fd',
  statusActive: '#14532d',
  statusActiveText: '#86efac',
  statusOnHold: '#78350f',
  statusOnHoldText: '#fde68a',
  statusCompleted: '#1e1b4b',
  statusCompletedText: '#a5b4fc',

  // Task status badges
  taskTodo: '#1e3a5f',
  taskTodoText: '#93c5fd',
  taskInProgress: '#78350f',
  taskInProgressText: '#fde68a',
  taskBlocked: '#7f1d1d',
  taskBlockedText: '#fecaca',
  taskDone: '#14532d',
  taskDoneText: '#86efac',

  // Borders / dividers
  border: '#1f2937',
  borderSubtle: '#334155',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 22,
} as const;
