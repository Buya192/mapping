'use client';
import React from 'react';
import { Search, ChevronLeft, ChevronRight, Download } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  width?: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface ModernTableProps {
  title: string;
  description?: string;
  columns: Column[];
  data: any[];
  loading?: boolean;
  onSearch?: (query: string) => void;
  onExport?: () => void;
  searchPlaceholder?: string;
  pageSize?: number;
}

export function ModernTable({
  title,
  description,
  columns,
  data,
  loading = false,
  onSearch,
  onExport,
  searchPlaceholder = 'Cari...',
  pageSize = 20,
}: ModernTableProps) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [searchQuery, setSearchQuery] = React.useState('');

  const totalPages = Math.ceil(data.length / pageSize);
  const start = (currentPage - 1) * pageSize;
  const paginatedData = data.slice(start, start + pageSize);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    onSearch?.(query);
  };

  return (
    <div style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Header */}
      {title && (
        <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', padding: '24px 20px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>{title}</h1>
          {description && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{description}</p>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative', maxWidth: '300px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '36px',
                paddingRight: '12px',
                paddingTop: '8px',
                paddingBottom: '8px',
              }}
            />
          </div>

          <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
            {loading ? 'Loading...' : `${data.length} records`}
          </div>

          {onExport && (
            <button
              onClick={onExport}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Download size={14} /> Export
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border)' }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontWeight: 600,
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    color: 'var(--text-secondary)',
                    width: col.width,
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skeleton-${i}`} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  {columns.map((col) => (
                    <td key={col.key} style={{ padding: '12px' }}>
                      <div style={{ height: '16px', background: 'var(--bg-tertiary)', borderRadius: '4px', animation: 'pulse 2s infinite' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length > 0 ? (
              paginatedData.map((row, idx) => (
                <tr
                  key={idx}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    background: idx % 2 === 0 ? 'transparent' : 'rgba(88, 166, 255, 0.02)',
                  }}
                >
                  {columns.map((col) => (
                    <td key={col.key} style={{ padding: '12px', fontSize: '14px' }}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} style={{ padding: '32px 12px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Tidak ada data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Halaman {currentPage} dari {totalPages}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="btn btn-sm btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: currentPage === 1 ? 0.5 : 1 }}
            >
              <ChevronLeft size={14} /> Prev
            </button>

            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              let page = i + 1;
              if (totalPages > 5 && currentPage > 3) {
                page = currentPage - 2 + i;
              }
              if (page > totalPages) return null;

              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '4px',
                    border: '1px solid var(--border)',
                    background: currentPage === page ? 'var(--accent-indigo)' : 'var(--bg-tertiary)',
                    color: currentPage === page ? 'white' : 'var(--text-primary)',
                    cursor: 'pointer',
                    fontWeight: 500,
                    fontSize: '12px',
                  }}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="btn btn-sm btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: currentPage === totalPages ? 0.5 : 1 }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
