import React from 'react';

const Table = ({
  headers = [], // array of { key, label, sortable }
  data = [],
  renderRow,
  loading = false,
  emptyMessage = 'No items found.',
  className = ''
}) => {
  return (
    <div className={`w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 ${className}`}>
      <table className="w-full border-collapse text-left text-sm text-slate-500 dark:text-darkMuted">
        <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 border-b border-slate-200 dark:border-slate-850 z-10">
          <tr>
            {headers.map((h, idx) => (
              <th
                key={h.key || idx}
                scope="col"
                className="px-6 py-3.5 font-semibold text-slate-700 dark:text-darkText uppercase tracking-wider text-xs"
              >
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-850 bg-white dark:bg-darkSurface">
          {loading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <tr key={idx} className="animate-pulse">
                {headers.map((_, hIdx) => (
                  <td key={hIdx} className="px-6 py-4">
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4"></div>
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-6 py-12 text-center text-slate-400 dark:text-darkMuted">
                <div className="flex flex-col items-center justify-center gap-2">
                  <span className="text-xl">📭</span>
                  <p>{emptyMessage}</p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={row._id || row.id || idx}
                className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
              >
                {renderRow(row, idx)}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
