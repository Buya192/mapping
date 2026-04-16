import React from 'react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
  width?: string;
}

interface AssetTableProps<T> {
  title?: string;
  columns: Column<T>[];
  data: T[];
  /** optional export handler */
  onExport?: () => void;
}

export default function AssetTable<T extends Record<string, any>>({ title, columns, data, onExport }: AssetTableProps<T>) {
  return (
    <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden shadow-lg">
      {title && (
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900/50 border-b border-slate-700">
          <h2 className="text-sm font-semibold text-slate-200">{title}</h2>
          {onExport && (
            <button
              onClick={onExport}
              className="text-xs px-2 py-1 bg-indigo-600/30 text-indigo-200 rounded hover:bg-indigo-600/50 transition"
            >
              Export CSV
            </button>
          )}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left text-slate-300">
          <thead className="bg-slate-900/50 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
            <tr>
              {columns.map((col, i) => (
                <th key={i} className={`px-4 py-3 ${col.className || ''}`} style={{ width: col.width }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {data.map((item, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-slate-800/40 transition-colors">
                {columns.map((col, colIdx) => {
                  const value = typeof col.accessor === 'function' ? col.accessor(item) : item[col.accessor as string];
                  return (
                    <td key={colIdx} className={`px-4 py-3 ${col.className || ''}`}>
                      {value ?? '-'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
