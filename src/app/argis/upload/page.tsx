'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, CheckCircle2, AlertCircle, FileArchive, RefreshCw, FolderOpen } from 'lucide-react';

type FileInfo = {
  path: string;
  size: number;
  ext: string;
};

type UploadResult = {
  zipFile: string;
  totalFiles: number;
  geojsonLayers: { name: string; featureCount: number; geometryType: string }[];
  structure: FileInfo[];
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

const EXT_COLORS: Record<string, string> = {
  '.geojson': '#22c55e',
  '.json': '#3b82f6',
  '.gpkg': '#8b5cf6',
  '.shp': '#f97316',
  '.csv': '#06b6d4',
  '.kml': '#eab308',
  '.kmz': '#ec4899',
  '.prj': '#94a3b8',
  '.dbf': '#94a3b8',
  '.shx': '#94a3b8',
};

export default function UploadPage() {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentInfo, setCurrentInfo] = useState<UploadResult | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchCurrentInfo = useCallback(async () => {
    setLoadingInfo(true);
    try {
      const r = await fetch('/api/argis?action=list');
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setCurrentInfo(d);
    } catch (e) {
      // silently ignore
    } finally {
      setLoadingInfo(false);
    }
  }, []);

  useState(() => {
    fetchCurrentInfo();
  });

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setError('Hanya file .zip yang diizinkan');
      return;
    }
    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/argis', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Upload gagal');

      // Fetch updated info
      const infoRes = await fetch('/api/argis?action=list');
      const info = await infoRes.json();
      setResult(info);
      setCurrentInfo(info);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload gagal');
    } finally {
      setUploading(false);
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div style={{ paddingBottom: 40, maxWidth: 900, margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">Upload File ZIP</h1>
        <p className="page-subtitle">Upload file ZIP berisi data GeoJSON / GeoPackage untuk dipetakan</p>
      </div>

      {/* Upload zone */}
      <div
        className="chart-card"
        style={{
          marginBottom: 20,
          border: `2px dashed ${dragging ? '#3b82f6' : 'var(--border-color)'}`,
          background: dragging ? 'rgba(59,130,246,0.06)' : undefined,
          transition: 'all 0.2s',
          cursor: 'pointer',
        }}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".zip"
          style={{ display: 'none' }}
          onChange={onInputChange}
        />
        <div style={{ textAlign: 'center', padding: '32px 20px' }}>
          {uploading ? (
            <>
              <RefreshCw size={40} style={{ margin: '0 auto 16px', color: '#3b82f6', animation: 'spin 1s linear infinite' }} />
              <p style={{ fontSize: 16, fontWeight: 600, color: '#f1f5f9' }}>Mengupload dan memproses file...</p>
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>Mengekstrak dan membaca GeoJSON...</p>
            </>
          ) : (
            <>
              <FileArchive size={40} style={{ margin: '0 auto 16px', color: dragging ? '#3b82f6' : '#64748b' }} />
              <p style={{ fontSize: 16, fontWeight: 600, color: '#f1f5f9' }}>
                {dragging ? 'Lepas untuk upload' : 'Drag & drop file ZIP di sini'}
              </p>
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>atau klik untuk pilih file</p>
              <p style={{ fontSize: 11, color: '#475569', marginTop: 10 }}>
                Mendukung: .zip berisi .geojson, .json, .gpkg
              </p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="card" style={{ borderColor: 'rgba(239,68,68,0.3)', marginBottom: 16, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10, color: '#ef4444' }}>
          <AlertCircle size={16} /><span style={{ fontSize: 13 }}>{error}</span>
        </div>
      )}

      {result && (
        <div className="card" style={{ borderColor: 'rgba(34,197,94,0.3)', marginBottom: 20, padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, color: '#22c55e' }}>
            <CheckCircle2 size={18} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Upload berhasil! File diproses.</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '10px 14px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total File</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9' }}>{result.totalFiles}</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '10px 14px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Layer GeoJSON</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#22c55e' }}>{result.geojsonLayers?.length ?? 0}</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '10px 14px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nama File</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#3b82f6', wordBreak: 'break-all' }}>{result.zipFile}</div>
            </div>
          </div>
        </div>
      )}

      {/* Current ZIP structure */}
      <div className="chart-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div className="card-title" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FolderOpen size={14} /> Struktur ZIP Aktif
          </div>
          <button
            onClick={fetchCurrentInfo}
            className="btn btn-secondary"
            style={{ fontSize: 12, padding: '6px 12px', gap: 6 }}
            disabled={loadingInfo}
          >
            <RefreshCw size={12} style={loadingInfo ? { animation: 'spin 1s linear infinite' } : {}} />
            Refresh
          </button>
        </div>

        {loadingInfo && (
          <div style={{ color: '#64748b', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
            <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Memuat...
          </div>
        )}

        {currentInfo && !loadingInfo && (
          <>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
              <strong style={{ color: '#94a3b8' }}>{currentInfo.zipFile}</strong> &mdash; {currentInfo.totalFiles} file total, {currentInfo.geojsonLayers?.length ?? 0} layer GeoJSON
            </div>

            {/* GeoJSON layers */}
            {(currentInfo.geojsonLayers ?? []).length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Layer GeoJSON</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {currentInfo.geojsonLayers.map(l => (
                    <div key={l.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(59,130,246,0.07)', borderRadius: 8, border: '1px solid rgba(59,130,246,0.15)' }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: '#3b82f6', flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: '#f1f5f9', fontWeight: 500, flex: 1 }}>{l.name}</span>
                      <span style={{ fontSize: 11, color: '#64748b' }}>{l.featureCount} fitur</span>
                      <span style={{ fontSize: 11, color: '#8b5cf6', background: 'rgba(139,92,246,0.15)', padding: '2px 8px', borderRadius: 12 }}>{l.geometryType}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All files */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Semua File</div>
              <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {(currentInfo.structure ?? []).map(f => (
                  <div key={f.path} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 6, fontSize: 12 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 2, background: EXT_COLORS[f.ext] ?? '#64748b', flexShrink: 0 }} />
                    <span style={{ flex: 1, color: '#94a3b8', fontFamily: 'monospace', fontSize: 11, wordBreak: 'break-all' }}>{f.path}</span>
                    <span style={{ color: '#475569', whiteSpace: 'nowrap', fontSize: 11 }}>{formatBytes(f.size)}</span>
                    <span style={{ color: EXT_COLORS[f.ext] ?? '#64748b', fontSize: 10, padding: '1px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: 4 }}>{f.ext || 'file'}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {!currentInfo && !loadingInfo && (
          <div style={{ fontSize: 13, color: '#64748b', padding: '12px 0' }}>
            Belum ada file ZIP yang dimuat. Upload file ZIP di atas.
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
