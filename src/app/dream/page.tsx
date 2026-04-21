'use client';

import { useState, useCallback } from 'react';
import { 
  Download, LogIn, Database, RefreshCw, CheckCircle2, XCircle, 
  AlertTriangle, Server, Key, Eye, EyeOff, CloudDownload,
  ChevronDown, ArrowRight, Loader2, FileJson, Import
} from 'lucide-react';

interface PullResult {
  totalCount: number;
  count: number;
  data: Record<string, unknown>[];
}

interface ImportResult {
  inserted: number;
  updated: number;
  errors: number;
  details: string[];
}

type Step = 'login' | 'select' | 'pull' | 'review' | 'import' | 'done';

const SERVER_OPTIONS = [
  { label: 'Production (api-eamdist.pln.co.id)', value: 'http://api-eamdist.pln.co.id/api-eam-gateway/eam' },
  { label: 'MAS Dev (masdev.apps.eam)', value: 'https://dev.manage.masdev.apps.eam.pusat.corp.pln.co.id' },
  { label: 'Internal (10.99.10.41)', value: 'http://10.99.10.41' },
  { label: 'Custom URL...', value: 'custom' },
];

const ASSET_TYPES = [
  { label: 'XAR Asset (Asset Register)', value: 'xarasset', desc: 'Data aset dari modul Asset Register DREAM' },
  { label: 'XAR Locations (Lokasi)', value: 'xarlocations', desc: 'Data lokasi aset DREAM' },
  { label: 'MX API Asset (Aset Umum)', value: 'mxapiasset', desc: 'Data aset dari API Maximo standar' },
  { label: 'Class Structure (Master)', value: 'classstructure', desc: 'Master data klasifikasi aset' },
];

export default function DreamPage() {
  const [step, setStep] = useState<Step>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Login state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedServer, setSelectedServer] = useState(SERVER_OPTIONS[0].value);
  const [customServer, setCustomServer] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Pull state
  const [assetType, setAssetType] = useState('xarasset');
  const [siteid, setSiteid] = useState('');
  const [pageSize, setPageSize] = useState(100);
  const [pullResult, setPullResult] = useState<PullResult | null>(null);

  // Import state
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const serverUrl = selectedServer === 'custom' ? customServer : selectedServer;

  const apiCall = useCallback(async (body: Record<string, unknown>) => {
    const res = await fetch('/api/dream/maximo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, serverUrl, ...body }),
    });
    return res.json();
  }, [username, password, serverUrl]);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiCall({ action: 'login' });
      if (result.success) {
        setLoginSuccess(true);
        setStep('select');
      } else {
        setError(result.error || 'Login gagal');
      }
    } catch {
      setError('Tidak bisa terhubung ke server');
    }
    setLoading(false);
  };

  const handlePull = async () => {
    setLoading(true);
    setError(null);
    try {
      const action = assetType === 'classstructure' ? 'pull_classstructure' : 'pull_assets';
      const result = await apiCall({ action, assetType, siteid, pageSize });
      if (result.success) {
        setPullResult({
          totalCount: result.totalCount || result.data?.length || 0,
          count: result.count || result.data?.length || 0,
          data: result.data || [],
        });
        setSelectedRows(new Set(Array.from({ length: (result.data || []).length }, (_, i) => i)));
        setStep('review');
      } else {
        setError(result.error || 'Gagal menarik data');
      }
    } catch {
      setError('Error saat pull data');
    }
    setLoading(false);
  };

  const handleImport = async () => {
    if (!pullResult) return;
    setLoading(true);
    setError(null);
    try {
      const selectedAssets = pullResult.data.filter((_, i) => selectedRows.has(i));
      const result = await apiCall({ action: 'import', assets: selectedAssets });
      if (result.success) {
        setImportResult(result.results);
        setStep('done');
      } else {
        setError(result.error || 'Gagal import data');
      }
    } catch {
      setError('Error saat import');
    }
    setLoading(false);
  };

  const toggleRow = (idx: number) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const selectAll = () => {
    if (pullResult) {
      setSelectedRows(new Set(Array.from({ length: pullResult.data.length }, (_, i) => i)));
    }
  };

  const deselectAll = () => setSelectedRows(new Set());

  const steps: { key: Step; label: string; icon: typeof LogIn }[] = [
    { key: 'login', label: 'Login Maximo', icon: LogIn },
    { key: 'select', label: 'Pilih Data', icon: Database },
    { key: 'pull', label: 'Tarik Data', icon: CloudDownload },
    { key: 'review', label: 'Review', icon: FileJson },
    { key: 'import', label: 'Import', icon: Import },
    { key: 'done', label: 'Selesai', icon: CheckCircle2 },
  ];

  const stepIndex = steps.findIndex(s => s.key === step);

  return (
    <>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <h1 className="page-title">🔗 DREAM / Maximo Integration</h1>
        <p className="page-subtitle">Tarik data aset dari IBM Maximo DREAM Mobile ke PLN Jarkom</p>
      </div>

      {/* STEPPER */}
      <div style={{ 
        display: 'flex', alignItems: 'center', gap: 4, marginBottom: 24, padding: '16px 20px',
        background: '#0a0a0f', borderRadius: 12, border: '1px solid #1e293b',
        overflowX: 'auto'
      }}>
        {steps.map((s, i) => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
              borderRadius: 8, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
              background: i <= stepIndex ? (i === stepIndex ? 'rgba(59,130,246,0.2)' : 'rgba(34,197,94,0.1)') : 'transparent',
              color: i < stepIndex ? '#22c55e' : i === stepIndex ? '#3b82f6' : '#64748b',
              border: i === stepIndex ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
            }}>
              {i < stepIndex ? <CheckCircle2 size={14} /> : <s.icon size={14} />}
              {s.label}
            </div>
            {i < steps.length - 1 && <ArrowRight size={12} color="#334155" />}
          </div>
        ))}
      </div>

      {/* ERROR */}
      {error && (
        <div style={{
          padding: '12px 16px', marginBottom: 16, borderRadius: 10,
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8
        }}>
          <XCircle size={16} /> {error}
          <button onClick={() => setError(null)} style={{ marginLeft: 'auto', cursor: 'pointer', background: 'none', border: 'none', color: '#f87171' }}>✕</button>
        </div>
      )}

      {/* STEP 1: LOGIN */}
      {step === 'login' && (
        <div className="card" style={{ maxWidth: 520, margin: '0 auto', padding: 24 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 24 }}>
              <Server size={28} color="#fff" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Login IBM Maximo</h2>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Masukkan kredensial DREAM Mobile Anda</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Server Maximo</label>
              <select className="form-select" value={selectedServer} onChange={e => setSelectedServer(e.target.value)}>
                {SERVER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {selectedServer === 'custom' && (
                <input className="form-input" placeholder="https://your-maximo-server.com" value={customServer} onChange={e => setCustomServer(e.target.value)} style={{ marginTop: 8 }} />
              )}
            </div>

            <div className="form-group">
              <label className="form-label">👤 Username</label>
              <input className="form-input" placeholder="username Maximo/DREAM" value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" />
            </div>

            <div className="form-group">
              <label className="form-label">🔑 Password</label>
              <div style={{ position: 'relative' }}>
                <input className="form-input" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" style={{ paddingRight: 40 }} />
                <button onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', fontSize: 12, color: '#fbbf24', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>Pastikan Anda terhubung ke <strong>VPN/jaringan internal PLN</strong> untuk mengakses server Maximo.</span>
            </div>

            <button onClick={handleLogin} disabled={loading || !username || !password} className="btn btn-primary btn-full" style={{ padding: 14, fontSize: 15, opacity: loading || !username || !password ? 0.5 : 1 }}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
              {loading ? 'Menghubungkan...' : 'Login ke Maximo'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: SELECT DATA TYPE */}
      {step === 'select' && (
        <div className="card" style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <CheckCircle2 size={20} color="#22c55e" />
            <span style={{ fontSize: 14, color: '#22c55e', fontWeight: 600 }}>Login berhasil sebagai {username}</span>
          </div>

          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 16 }}>Pilih Jenis Data</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {ASSET_TYPES.map(t => (
              <div key={t.value} onClick={() => setAssetType(t.value)} style={{
                padding: '14px 16px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s',
                background: assetType === t.value ? 'rgba(59,130,246,0.12)' : '#0d1117',
                border: assetType === t.value ? '1px solid rgba(59,130,246,0.4)' : '1px solid #1e293b',
              }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: assetType === t.value ? '#60a5fa' : '#e2e8f0' }}>{t.label}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{t.desc}</div>
              </div>
            ))}
          </div>

          <div className="form-row" style={{ gap: 12 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Site ID (opsional)</label>
              <input className="form-input" placeholder="Cth: PLN_BNT" value={siteid} onChange={e => setSiteid(e.target.value)} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Jumlah Data</label>
              <select className="form-select" value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
                <option value={50}>50 record</option>
                <option value={100}>100 record</option>
                <option value={200}>200 record</option>
                <option value={500}>500 record</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={() => setStep('login')} className="btn" style={{ padding: '12px 20px', background: '#1e293b', border: '1px solid #334155', color: '#94a3b8' }}>
              ← Kembali
            </button>
            <button onClick={handlePull} disabled={loading} className="btn btn-primary" style={{ flex: 1, padding: 12, opacity: loading ? 0.5 : 1 }}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : <CloudDownload size={18} />}
              {loading ? 'Menarik Data...' : 'Tarik Data dari Maximo'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: REVIEW */}
      {step === 'review' && pullResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <div className="card" style={{ padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#3b82f6' }}>{pullResult.totalCount}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Total di Server</div>
            </div>
            <div className="card" style={{ padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#22c55e' }}>{pullResult.count}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Berhasil Ditarik</div>
            </div>
            <div className="card" style={{ padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#f59e0b' }}>{selectedRows.size}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Dipilih untuk Import</div>
            </div>
          </div>

          {/* Data Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Preview Data ({pullResult.count} record)</h3>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={selectAll} className="btn" style={{ padding: '4px 10px', fontSize: 11, background: '#1e293b', border: '1px solid #334155', color: '#94a3b8' }}>Pilih Semua</button>
                <button onClick={deselectAll} className="btn" style={{ padding: '4px 10px', fontSize: 11, background: '#1e293b', border: '1px solid #334155', color: '#94a3b8' }}>Hapus Pilihan</button>
              </div>
            </div>
            <div style={{ overflowX: 'auto', maxHeight: 400 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#0f172a', position: 'sticky', top: 0, zIndex: 1 }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>✓</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Asset Num</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Description</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Class</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Penyulang</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Site</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>GPS</th>
                  </tr>
                </thead>
                <tbody>
                  {pullResult.data.map((row, i) => (
                    <tr key={i} onClick={() => toggleRow(i)} style={{ 
                      borderBottom: '1px solid #1a1a2e', cursor: 'pointer', transition: 'background 0.15s',
                      background: selectedRows.has(i) ? 'rgba(59,130,246,0.06)' : 'transparent',
                    }}>
                      <td style={{ padding: '6px 12px' }}>
                        <input type="checkbox" checked={selectedRows.has(i)} onChange={() => toggleRow(i)} style={{ accentColor: '#3b82f6' }} />
                      </td>
                      <td style={{ padding: '6px 12px', color: '#60a5fa', fontFamily: 'monospace', fontWeight: 600 }}>{String(row.assetnum || row.arassetid || '-')}</td>
                      <td style={{ padding: '6px 12px', color: '#e2e8f0', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(row.description || '-')}</td>
                      <td style={{ padding: '6px 12px', color: '#fbbf24' }}>{String(row.assetclasshi || row.classstructureid || '-')}</td>
                      <td style={{ padding: '6px 12px', color: '#34d399' }}>{String(row.cxpenyulang || '-')}</td>
                      <td style={{ padding: '6px 12px', color: '#94a3b8' }}>{String(row.siteid || '-')}</td>
                      <td style={{ padding: '6px 12px' }}>
                        <span style={{ 
                          padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                          background: String(row.status) === 'ACTIVE' ? 'rgba(34,197,94,0.15)' : 'rgba(251,191,36,0.15)',
                          color: String(row.status) === 'ACTIVE' ? '#22c55e' : '#fbbf24',
                        }}>{String(row.status || '-')}</span>
                      </td>
                      <td style={{ padding: '6px 12px', color: '#64748b', fontFamily: 'monospace', fontSize: 10 }}>
                        {row.latitudey && row.longitudex ? `${String(row.latitudey).slice(0, 8)}, ${String(row.longitudex).slice(0, 9)}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setStep('select')} className="btn" style={{ padding: '12px 20px', background: '#1e293b', border: '1px solid #334155', color: '#94a3b8' }}>
              ← Kembali
            </button>
            <button onClick={handleImport} disabled={loading || selectedRows.size === 0} className="btn btn-primary" style={{ flex: 1, padding: 12, opacity: selectedRows.size === 0 ? 0.4 : 1 }}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Import size={18} />}
              {loading ? 'Mengimpor...' : `Import ${selectedRows.size} Aset ke Supabase`}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: DONE */}
      {step === 'done' && importResult && (
        <div className="card" style={{ maxWidth: 520, margin: '0 auto', padding: 32, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <CheckCircle2 size={32} color="#22c55e" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>Import Selesai!</h2>
          <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 24 }}>Data dari Maximo berhasil diimpor ke database PLN Jarkom</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
            <div style={{ padding: 16, borderRadius: 10, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#22c55e' }}>{importResult.inserted}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Aset Baru</div>
            </div>
            <div style={{ padding: 16, borderRadius: 10, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#3b82f6' }}>{importResult.updated}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Diperbarui</div>
            </div>
            <div style={{ padding: 16, borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#ef4444' }}>{importResult.errors}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Gagal</div>
            </div>
          </div>

          {importResult.details.length > 0 && (
            <div style={{ textAlign: 'left', marginBottom: 16, padding: 12, borderRadius: 8, background: '#0d1117', border: '1px solid #1e293b', maxHeight: 150, overflowY: 'auto' }}>
              {importResult.details.map((d, i) => (
                <div key={i} style={{ fontSize: 11, color: '#f87171', marginBottom: 4, fontFamily: 'monospace' }}>{d}</div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setStep('select'); setPullResult(null); setImportResult(null); }} className="btn" style={{ flex: 1, padding: 12, background: '#1e293b', border: '1px solid #334155', color: '#94a3b8' }}>
              <RefreshCw size={16} /> Tarik Data Lagi
            </button>
            <button onClick={() => window.location.href = '/data/tiang'} className="btn btn-primary" style={{ flex: 1, padding: 12 }}>
              <Database size={16} /> Lihat Data Aset
            </button>
          </div>
        </div>
      )}
    </>
  );
}
