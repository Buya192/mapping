// ============================================
// Map Color Scheme & Symbol Configuration
// ============================================

// Gardu colors by type
export const GARDU_COLORS: Record<string, string> = {
  GI: '#ef4444',         // Red
  GD: '#3b82f6',         // Blue
  Trafo: '#eab308',      // Yellow
  Gardu_Tiang: '#22c55e' // Green
};

export const GARDU_LABELS: Record<string, string> = {
  GI: 'Gardu Induk',
  GD: 'Gardu Distribusi',
  Trafo: 'Trafo Tiang',
  Gardu_Tiang: 'Gardu Tiang'
};

// Penyulang/Line colors by voltage
export const LINE_COLORS: Record<string, { color: string; weight: number; dashArray?: string }> = {
  '150': { color: '#a855f7', weight: 4 },                    // Purple - SUTT
  '20': { color: '#ef4444', weight: 3 },                      // Red - JTM
  '0.4': { color: '#3b82f6', weight: 2 },                     // Blue - JTR
  'tanah': { color: '#92400e', weight: 2, dashArray: '8, 6' } // Brown dashed - underground
};

// Tiang symbols (SVG path patterns)
export const TIANG_SYMBOLS: Record<string, { shape: string; color: string; size: number }> = {
  normal: { shape: 'circle', color: '#94a3b8', size: 6 },
  akhir: { shape: 'circle-solid', color: '#f97316', size: 8 },
  sudut: { shape: 'diamond', color: '#06b6d4', size: 8 },
  penegang: { shape: 'crosshair', color: '#8b5cf6', size: 8 },
  percabangan: { shape: 'star', color: '#f43f5e', size: 10 }
};

export const TIANG_LABELS: Record<string, string> = {
  normal: 'Tiang Normal',
  akhir: 'Tiang Akhir',
  sudut: 'Tiang Sudut',
  penegang: 'Tiang Penegang',
  percabangan: 'Tiang Percabangan'
};

// Proteksi colors
export const PROTEKSI_COLORS: Record<string, string> = {
  Recloser: '#f59e0b',
  Sectionalizer: '#10b981',
  FCO: '#ef4444',
  LBS: '#6366f1',
  DS: '#8b5cf6',
  LA: '#06b6d4'
};

// Gangguan status colors
export const GANGGUAN_STATUS_COLORS: Record<string, string> = {
  lapor: '#ef4444',
  proses: '#f59e0b',
  selesai: '#22c55e'
};

// Chart color palette
export const CHART_COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b',
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'
];

// Konduktor info
export const KONDUKTOR_INFO: Record<string, string> = {
  AAAC: 'All Aluminium Alloy Conductor',
  ACSR: 'Aluminium Conductor Steel Reinforced',
  XLPE: 'Cross-Linked Polyethylene (Kabel)',
  NYY: 'Kabel Tanah NYY',
  NFA2X: 'Twisted Cable Aluminium'
};

export const UKURAN_PENAMPANG = [35, 50, 70, 95, 150, 240, 300]; // mm²
