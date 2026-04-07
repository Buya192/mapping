'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, CheckCircle2, AlertCircle, FileArchive, RefreshCw, FolderOpen, Database, Clock, Layers } from 'lucide-react';

type ImportRow = {
  id: number;
  filename: string;
  file_size: number | null;
  imported_at: string;
  status: string;
  error_message: string | null;
};

type LayerRow = {
  layer_id: number;
  layer_name: string;
  geometry_type: string;
  feature_count: number;
  property_keys: string[];
  zip_filename: string;
};

function formatBytes(bytes: number): string {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

const STATUS_COLOR: Record<string, string> = {
  done: '#22c55e',
  processing: '#eab308',
  error: '#ef4444',
  pending: '#64748b',
};

export default function UploadPage() {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [importingServer, setImportingServer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [imports, setImports] = useState<ImportRow[]>([]);
  const [layers, setLayers] = useState<LayerRow[]>([]);
  const [loadingDB, setLoadingDB] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchDB = useCallback(async () => {
    setLoadingDB(true);
    try {
      const [imp, lay] = await Promise.all([
        fetch('/api/argis?action=imports&source=db').then(r => r.json()),
        fetch('/api/argis?action=layers&source=db').then(r => r.json()),
      ]);
      setImports(imp.imports ?? []);
      setLayers(lay.layers ?? []);
    } catch {
      // silent
    } finally {
      setLoadingDB(false);
    }
  }, []);

  useEffect(() => { fetchDB(); }, [fetchDB]);

  // Import the server-side ZIP into the database
  const handleImportServer = useCallback(async () => {
    setImportingServer(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/argis', { method: 'PUT' });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? 'Import gagal');
      setSuccessMsg('File ZIP server berhasil diimpor ke database.');
      await fetchDB();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import gagal');
    } finally {
      setImportingServer(false);
    }
  }, [fetchDB]);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setError('Hanya file .zip yang diizinkan');
      return;
    }
    setUploading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/argis', { method: 'POST', body: form });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? 'Upload gagal');
      setSuccessMsg(`File "${file.name}" berhasil diupload dan diimpor ke database.`);
      await fetchDB();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload gagal');
    } finally {
      setUploading(false);
    }
  }, [fetchDB]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div style={{ paddingBottom: 40, maxWidth: 960, margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">Upload & Import Data</h1>
        <p className="page-subtitle">Upload file ZIP GeoJSON dan impor ke database Neon PostgreSQL</p>
      </div>

      {/* Actions row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {/* Upload zone */}
        <div
          style={{
            flex: 2, minWidth: 280,
            border: `2px dashed ${dragging ? '#3b82f6' : 'var(--border-color)'}`,
            borderRadius: 12,
            background: dragging ? 'rgba(59,130,246,0.06)' : 'var(--bg-card)',
            transition: 'all 0.2s',
            cursor: 'pointer',
            padding: '28px 24px',
            textAlign: 'center',
          }}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input ref={inputRef} type="file" accept=".zip" style={{ display: 'none' }} onChange={onInputChange} />
          {uploading ? (
            <>
              <RefreshCw size={36} style={{ margin: '0 auto 12px', color: '#3b82f6', animation: 'spin 1s linear infinite' }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>Mengupload dan mengimpor...</p>
              <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Menyimpan ke database Neon</p>
            </>
          ) : (
            <>
              <FileArchive size={36} style={{ margin: '0 auto 12px', color: dragging ? '#3b82f6' : '#64748b' }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>
                {dragging ? 'Lepas untuk upload' : 'Drag & drop file ZIP'}
              </p>
              <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>atau klik untuk pilih file</p>
              <p style={{ fontSize: 11, color: '#475569', marginTop: 8 }}>Mendukung: .zip berisi .geojson, .json</p>
            </>
          )}
        </div>

        {/* Import server ZIP */}
        <div className="card" style={{ flex: 1, minWidth: 220, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 12, padding: '24px', textAlign: 'center' }}>
          <Database size={32} style={{ color: '#3b82f6' }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>Import ZIP Server</p>
            <p style={{ fontSize: 11, color: '#64748b' }}>Import file ZIP yang sudah ada di server ke database</p>
          </div>
          <button
            className="btn btn-primary"
            style={{ fontSize: 13, padding: '10px 20px', gap: 8, width: '100%' }}
            onClick={handleImportServer}
            disabled={importingServer}
          >
            {importingServer
              ? <><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Mengimpor...</>
              : <><Upload size={13} /> Import ke Database</>}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="card" style={{ borderColor: 'rgba(239,68,68,0.3)', marginBottom: 14, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, color: '#ef4444' }}>
          <AlertCircle size={15} /><span style={{ fontSize: 13 }}>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="card" style={{ borderColor: 'rgba(34,197,94,0.3)', marginBottom: 14, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, color: '#22c55e' }}>
          <CheckCircle2 size={15} /><span style={{ fontSize: 13 }}>{successMsg}</span>
        </div>
      )}

      {/* Import history */}
      <div className="chart-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div className="card-title" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={14} /> Riwayat Import
          </div>
          <button onClick={fetchDB} className="btn btn-secondary" style={{ fontSize: 12, padding: '6px 12px', gap: 6 }} disabled={loadingDB}>
            <RefreshCw size={12} style={loadingDB ? { animation: 'spin 1s linear infinite' } : {}} /> Refresh
          </button>
        </div>

        {loadingDB ? (
          <div style={{ color: '#64748b', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Memuat dari database...
          </div>
        ) : imports.length === 0 ? (
          <p style={{ fontSize: 13, color: '#64748b' }}>Belum ada import. Upload atau import ZIP dari server.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {imports.map(imp => (
              <div key={imp.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
                <FileArchive size={16} style={{ color: '#3b82f6', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#f1f5f9', fontWeight: 500, flex: 1, wordBreak: 'break-all' }}>{imp.filename}</span>
                <span style={{ fontSize: 11, color: '#64748b' }}>{formatBytes(imp.file_size ?? 0)}</span>
                <span style={{ fontSize: 11, color: '#64748b' }}>{formatDate(imp.imported_at)}</span>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 12,
                  color: STATUS_COLOR[imp.status] ?? '#94a3b8',
                  background: `${STATUS_COLOR[imp.status] ?? '#94a3b8'}22`,
                }}>
                  {imp.status}
                </span>
                {imp.error_message && (
                  <span style={{ fontSize: 11, color: '#ef4444', width: '100%' }}>{imp.error_message}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Layers in database */}
      <div className="chart-card">
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Layers size={14} /> Layer Tersimpan di Database ({layers.length})
        </div>
        {loadingDB ? (
          <div style={{ color: '#64748b', fontSize: 13 }}>Memuat...</div>
        ) : layers.length === 0 ? (
          <p style={{ fontSize: 13, color: '#64748b' }}>Belum ada layer. Import ZIP terlebih dahulu.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {layers.map(l => (
              <div key={l.layer_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', background: 'rgba(59,130,246,0.06)', borderRadius: 8, border: '1px solid rgba(59,130,246,0.15)', flexWrap: 'wrap' }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: '#3b82f6', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#f1f5f9', fontWeight: 500, flex: 1 }}>{l.layer_name}</span>
                <span style={{ fontSize: 11, color: '#64748b' }}>{l.feature_count.toLocaleString()} fitur</span>
                <span style={{ fontSize: 11, color: '#8b5cf6', background: 'rgba(139,92,246,0.15)', padding: '2px 8px', borderRadius: 12 }}>
                  {l.geometry_type}
                </span>
                <span style={{ fontSize: 11, color: '#06b6d4', background: 'rgba(6,182,212,0.1)', padding: '2px 8px', borderRadius: 12 }}>
                  {l.property_keys?.length ?? 0} kolom
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
