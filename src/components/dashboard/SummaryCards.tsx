'use client';

import { Zap, AlertTriangle, Activity, Users } from 'lucide-react';

const cards = [
  {
    label: 'Total Aset Terdaftar',
    value: '1,284',
    badge: '+12 minggu ini',
    badgeType: 'up',
    color: 'blue',
    icon: Zap,
  },
  {
    label: 'Gangguan Aktif',
    value: '7',
    badge: '-3 dari kemarin',
    badgeType: 'up',
    color: 'red',
    icon: AlertTriangle,
  },
  {
    label: 'Beban Puncak (kVA)',
    value: '4,720',
    badge: '+5.2%',
    badgeType: 'down',
    color: 'yellow',
    icon: Activity,
  },
  {
    label: 'Pelanggan Terlayani',
    value: '22,890',
    badge: '+48 baru',
    badgeType: 'up',
    color: 'green',
    icon: Users,
  },
];

export function SummaryCards() {
  return (
    <div className="summary-grid">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className={`summary-card ${card.color}`}>
            <div className={`summary-icon ${card.color}`}>
              <Icon size={22} />
            </div>
            <div className="summary-info">
              <div className="summary-value">{card.value}</div>
              <div className="summary-label">{card.label}</div>
              <span className={`summary-badge ${card.badgeType}`}>{card.badge}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
