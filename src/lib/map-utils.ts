export function createSvgIcon(svgContent: string, color: string, bg: string = '#ffffff') {
  return `<div style="
    width:28px;height:28px;border-radius:4px;
    background:${bg};border:2px solid ${color};
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 2px 4px rgba(0,0,0,0.3);
  ">${svgContent}</div>`;
}

export function getProteksiSVG(tipe: string, color: string) {
  const t = tipe.toLowerCase();
  
  if (t === 'recloser' || t === 'circuit breaker') {
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16 L8 16 A 4 4 0 0 1 16 16 L20 16"/></svg>`;
  }
  if (t === 'lbs' || t === 'disconnector' || t === 'ds') {
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16 L10 16 L18 8 M18 16 L20 16"/></svg>`;
  }
  if (t === 'fco') {
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5"><rect x="6" y="4" width="12" height="16"/><line x1="6" y1="4" x2="18" y2="20"/></svg>`;
  }
  if (t === 'la') {
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5"><path d="M12 4v8M6 12h12l-6 8z"/></svg>`;
  }
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5"><path d="M4 12c0-3 3-5 5-2 0-3 3-5 5-2 0-3 3-5 5-2v4"/></svg>`;
}

export function getGarduSVG(tipe: string, color: string, konstruksi?: string) {
  const k = konstruksi?.toLowerCase() || '';
  
  if (tipe === 'GI' || tipe === 'GD') {
    // GI/GD — large substation (two overlapping circles with filled background)
    return `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="28" height="28" rx="4" fill="#1e40af" stroke="#fff" stroke-width="2"/>
      <circle cx="16" cy="10" r="5" fill="none" stroke="#fff" stroke-width="2"/>
      <circle cx="16" cy="20" r="5" fill="none" stroke="#fff" stroke-width="2"/>
    </svg>`;
  }

  // Portal (H-frame) — filled blue bg + white H-frame symbol
  if (k.includes('portal')) {
    return `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="28" height="28" rx="4" fill="#1e40af" stroke="#fff" stroke-width="2"/>
      <line x1="10" y1="6" x2="10" y2="26" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="22" y1="6" x2="22" y2="26" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="10" y1="12" x2="22" y2="12" stroke="#fff" stroke-width="1.5"/>
      <line x1="10" y1="20" x2="22" y2="20" stroke="#fff" stroke-width="1.5"/>
      <circle cx="16" cy="16" r="3.5" fill="#3b82f6" stroke="#fff" stroke-width="1.5"/>
    </svg>`;
  }
  
  // Cantol (single pole mount) — filled blue bg + pole with box
  if (k.includes('cantol')) {
    return `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="28" height="28" rx="4" fill="#1e40af" stroke="#fff" stroke-width="2"/>
      <line x1="12" y1="6" x2="12" y2="26" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
      <rect x="15" y="11" width="8" height="10" rx="1.5" fill="#3b82f6" stroke="#fff" stroke-width="1.5"/>
      <line x1="12" y1="16" x2="15" y2="16" stroke="#fff" stroke-width="1.5"/>
    </svg>`;
  }

  // Default Trafo — blue bg + classic transformer symbol (overlapping circles)
  return `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="28" height="28" rx="4" fill="#1e40af" stroke="#fff" stroke-width="2"/>
    <circle cx="16" cy="11" r="5" fill="none" stroke="#fff" stroke-width="2"/>
    <circle cx="12" cy="20" r="4" fill="none" stroke="#fff" stroke-width="1.5"/>
    <circle cx="20" cy="20" r="4" fill="none" stroke="#fff" stroke-width="1.5"/>
  </svg>`;
}

// ===== TIANG JTM ICONS =====
// Realistic pole icon: vertical pole with crossarm and insulators
export function getTiangSVG(tipe: string, color: string) {
  if (tipe === 'sudut' || tipe === 'penegang') {
    // Angle/tension pole — diamond marker  
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2 L22 12 L12 22 L2 12 Z" fill="${color}" fill-opacity="0.3" stroke="${color}" stroke-width="2"/>
      <circle cx="12" cy="12" r="3" fill="${color}"/>
    </svg>`;
  }

  // Normal pole — vertical pole with crossarm
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="12" y1="3" x2="12" y2="21" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="5" y1="7" x2="19" y2="7" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
    <circle cx="6" cy="7" r="1.5" fill="${color}"/>
    <circle cx="18" cy="7" r="1.5" fill="${color}"/>
    <circle cx="12" cy="7" r="1.5" fill="${color}"/>
  </svg>`;
}

// Tiang JTM with schoor/support — pole with diagonal brace
export function getTiangSchoorSVG(color: string) {
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="12" y1="3" x2="12" y2="21" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="5" y1="7" x2="19" y2="7" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
    <line x1="12" y1="14" x2="5" y2="21" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="3 2"/>
    <circle cx="6" cy="7" r="1.5" fill="${color}"/>
    <circle cx="18" cy="7" r="1.5" fill="${color}"/>
  </svg>`;
}

// ===== GIS INTERNATIONAL PROPOSED SYMBOLOGY =====
// Used for "Usulan" / Draft elements. They use hollow shapes and dashed strokes.
export function getProposedPoleSVG(tipeKonstruksi: string, color: string) {
  const tk = tipeKonstruksi.toLowerCase();
  
  if (tk === 'sudut') {
    // Angle Pole = Hollow Diamond dashed
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2 L22 12 L12 22 L2 12 Z" fill="#ffffff" fill-opacity="0.9" stroke="${color}" stroke-width="2.5" stroke-dasharray="4 2"/>
    </svg>`;
  }
  if (tk === 'penegang' || tk === 'akhir') {
    // Tension / Dead-end Pole = Hollow Square dashed
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="18" height="18" fill="#ffffff" fill-opacity="0.9" stroke="${color}" stroke-width="2.5" stroke-dasharray="4 2"/>
    </svg>`;
  }
  
  // Custom Tumpu/Tangent = Hollow Circle dashed with a small dot inside
  return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" fill="#ffffff" fill-opacity="0.9" stroke="${color}" stroke-width="2.5" stroke-dasharray="4 2"/>
    <circle cx="12" cy="12" r="2" fill="${color}"/>
  </svg>`;
}

export function getProposedTrafoSVG(color: string) {
  // Proposed Transformer = Hollow Triangle dashed
  return `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="12,2 22,20 2,20" fill="#ffffff" fill-opacity="0.9" stroke="${color}" stroke-width="2.5" stroke-dasharray="4 2"/>
    <text x="12" y="16" font-size="8" fill="${color}" font-weight="bold" font-family="sans-serif" text-anchor="middle">T</text>
  </svg>`;
}

// Kontramast — pole with guy wire (tensioned)
export function getTiangKontramastSVG(color: string) {
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="12" y1="3" x2="12" y2="21" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="5" y1="7" x2="19" y2="7" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
    <line x1="12" y1="7" x2="4" y2="21" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="12" y1="7" x2="20" y2="21" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="6" cy="7" r="1.5" fill="${color}"/>
    <circle cx="18" cy="7" r="1.5" fill="${color}"/>
  </svg>`;
}

// JTM Line icon for legend
export function getJTMLineSVG(color: string, isDashed: boolean = false) {
  return `<svg width="24" height="8" viewBox="0 0 24 8" xmlns="http://www.w3.org/2000/svg">
    <line x1="0" y1="4" x2="24" y2="4" stroke="${color}" stroke-width="3" stroke-linecap="round" ${isDashed ? 'stroke-dasharray="4 3"' : ''}/>
  </svg>`;
}

// ===== HARDWARE / POWER ASSET ICONS (INTERNATIONAL STANDARD) =====

// PLTD / Diesel Generator: IEEE/IEC Standard generator symbol (Circle with G)
export function getGeneratorSVG() {
  const color = '#d97706'; // amber
  return `<svg width="36" height="36" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="16" fill="#fef3c7" stroke="${color}" stroke-width="3"/>
    <text x="20" y="27" font-size="20" font-family="Arial, sans-serif" font-weight="bold" fill="${color}" text-anchor="middle">G</text>
  </svg>`;
}

// PLTS / Solar Farm: IEC Standard PV cell symbol 
export function getSolarSVG() {
  const color = '#d97706'; // amber
  return `<svg width="36" height="36" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="10" width="28" height="20" rx="2" fill="#fef3c7" stroke="${color}" stroke-width="3"/>
    <line x1="15" y1="10" x2="15" y2="30" stroke="${color}" stroke-width="2"/>
    <line x1="24" y1="10" x2="24" y2="30" stroke="${color}" stroke-width="2"/>
    <line x1="6" y1="20" x2="34" y2="20" stroke="${color}" stroke-width="2"/>
    <text x="20" y="8" font-size="10" font-family="Arial, sans-serif" font-weight="bold" fill="${color}" text-anchor="middle">PV</text>
  </svg>`;
}

// Recloser / LBS: IEEE/IEC standard circuit breaker / switch symbol (square with R or switch)
export function getRecloserSVG() {
  const color = '#e11d48'; // rose/red
  return `<svg width="28" height="28" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="24" height="24" fill="#ffe4e6" stroke="${color}" stroke-width="3"/>
    <text x="16" y="22" font-size="16" font-family="Arial, sans-serif" font-weight="bold" fill="${color}" text-anchor="middle">R</text>
  </svg>`;
}

// FCO / Fuse Cut Out: IEEE standard fuse symbol (rectangle with conductor passing through)
export function getFcoSVG() {
  const color = '#0284c7'; // bright blue
  return `<svg width="24" height="24" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <line x1="16" y1="2" x2="16" y2="30" stroke="${color}" stroke-width="3"/>
    <rect x="10" y="8" width="12" height="16" fill="#e0f2fe" stroke="${color}" stroke-width="3"/>
  </svg>`;
}
