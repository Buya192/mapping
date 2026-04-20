'use client';

import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';

export function VerificationStats() {
  // Demo stats
  const stats = {
    verified: 142,
    pending: 28,
    errors: 5,
    total: 175,
  };

  const verifiedPercent = Math.round((stats.verified / stats.total) * 100);
  const pendingPercent = Math.round((stats.pending / stats.total) * 100);
  const errorPercent = Math.round((stats.errors / stats.total) * 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Verified */}
      <div className="glass-card">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-[#22c55e]/20 border border-[#22c55e]/30 flex items-center justify-center">
            <CheckCircle2 size={20} className="text-[#22c55e]" />
          </div>
          <div>
            <div className="text-xs font-mono text-[#52525b] uppercase tracking-widest">Terverifikasi</div>
            <div className="text-2xl font-bold font-mono text-[#22c55e]">{stats.verified}</div>
          </div>
        </div>
        <div className="w-full bg-[#18181b] rounded-full h-2 overflow-hidden">
          <div 
            className="h-full bg-[#22c55e]" 
            style={{ width: `${verifiedPercent}%` }}
          />
        </div>
        <div className="text-[10px] text-[#52525b] mt-2">{verifiedPercent}% dari total {stats.total}</div>
      </div>

      {/* Pending */}
      <div className="glass-card">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-[#f59e0b]/20 border border-[#f59e0b]/30 flex items-center justify-center">
            <Clock size={20} className="text-[#f59e0b]" />
          </div>
          <div>
            <div className="text-xs font-mono text-[#52525b] uppercase tracking-widest">Pending</div>
            <div className="text-2xl font-bold font-mono text-[#f59e0b]">{stats.pending}</div>
          </div>
        </div>
        <div className="w-full bg-[#18181b] rounded-full h-2 overflow-hidden">
          <div 
            className="h-full bg-[#f59e0b]" 
            style={{ width: `${pendingPercent}%` }}
          />
        </div>
        <div className="text-[10px] text-[#52525b] mt-2">{pendingPercent}% menunggu verifikasi</div>
      </div>

      {/* Errors */}
      <div className="glass-card">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-[#ef4444]/20 border border-[#ef4444]/30 flex items-center justify-center">
            <AlertCircle size={20} className="text-[#ef4444]" />
          </div>
          <div>
            <div className="text-xs font-mono text-[#52525b] uppercase tracking-widest">Permasalahan</div>
            <div className="text-2xl font-bold font-mono text-[#ef4444]">{stats.errors}</div>
          </div>
        </div>
        <div className="w-full bg-[#18181b] rounded-full h-2 overflow-hidden">
          <div 
            className="h-full bg-[#ef4444]" 
            style={{ width: `${errorPercent}%` }}
          />
        </div>
        <div className="text-[10px] text-[#52525b] mt-2">{errorPercent}% ada masalah atau anomali</div>
      </div>
    </div>
  );
}
