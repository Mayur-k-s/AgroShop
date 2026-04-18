import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileText, Download, Search, ChevronRight, ChevronDown,
  Calendar, Loader2, AlertCircle, Folder, FolderOpen, FileBarChart2, X
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */
const fmt = (v) => Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/** Groups an array of "YYYY-MM-DD" strings into { year: { month: [dates] } } */
function groupDates(dates) {
  const tree = {};
  dates.forEach((d) => {
    const [y, m] = d.split('-');
    if (!tree[y]) tree[y] = {};
    if (!tree[y][m]) tree[y][m] = [];
    tree[y][m].push(d);
  });
  return tree;
}

function formatDisplayDate(isoDate) {
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ─────────────────────────────────────────────────────────────
   Printable Report Content
───────────────────────────────────────────────────────────── */
const PrintableReport = ({ report, searchTerm }) => {
  const filteredSales = !searchTerm
    ? report.sales
    : report.sales.map((sale) => ({
        ...sale,
        items: sale.items.filter(
          (it) =>
            it.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(it.qty).includes(searchTerm) ||
            String(sale.sale_id).includes(searchTerm)
        ),
      })).filter((s) => s.items.length > 0 || String(s.sale_id).includes(searchTerm));

  const filteredExpenses = !searchTerm
    ? report.expenses
    : report.expenses.filter(
        (e) =>
          e.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.note.toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(e.amount).includes(searchTerm)
      );

  return (
    <div id="report-printable" className="space-y-0">

      {/* ══════════════════════════════════════════════════════════
          HEADER — Logo + Shop Name + Date
      ══════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-br from-emerald-600 via-green-600 to-emerald-700 rounded-t-2xl px-8 py-8 text-white text-center print:rounded-none">
        {/* Plant Logo */}
        <div className="flex justify-center mb-3">
          <div className="bg-white/20 p-4 rounded-2xl border border-white/30 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-9"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/>
            </svg>
          </div>
        </div>

        {/* Shop Name */}
        <h1 className="text-3xl font-bold tracking-wide">Raju Agro</h1>
        <p className="text-emerald-200 text-sm mt-1 font-medium tracking-widest uppercase">Farmer's Trusted Partner</p>

        {/* Divider */}
        <div className="border-t border-white/20 my-4 mx-8" />

        {/* Report Date */}
        <p className="text-4xl font-bold">{formatDisplayDate(report.date)}</p>

      </div>

      {/* ══════════════════════════════════════════════════════════
          ITEMS SOLD TABLE
      ══════════════════════════════════════════════════════════ */}
      <div className="bg-white border-x border-gray-200">
        {/* Section Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-dashed border-gray-300 bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-emerald-500 rounded-full" />
            <h2 className="font-bold text-gray-900 text-base tracking-wide uppercase">
              Items Sold
            </h2>
            <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
              {report.summary.bill_count} {report.summary.bill_count === 1 ? 'Bill' : 'Bills'}
            </span>
          </div>
          {searchTerm && filteredSales.length !== report.sales.length && (
            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
              Filtered
            </span>
          )}
        </div>

        {filteredSales.length === 0 ? (
          <p className="text-center text-gray-400 py-12 text-sm">No sales match your search.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[640px]">
              <thead>
                <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                  <th className="px-5 py-3 text-left font-bold">Bill #</th>
                  <th className="px-5 py-3 text-left font-bold">Time</th>
                  <th className="px-5 py-3 text-left font-bold">Product</th>
                  <th className="px-5 py-3 text-center font-bold">Qty</th>
                  <th className="px-5 py-3 text-center font-bold">Unit</th>
                  <th className="px-5 py-3 text-right font-bold">Rate (₹)</th>
                  <th className="px-5 py-3 text-right font-bold">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale, sIdx) => (
                  <>
                    {/* Item rows */}
                    {sale.items.map((item, iIdx) => (
                      <tr
                        key={`${sale.sale_id}-${iIdx}`}
                        className={`border-b border-gray-50 hover:bg-emerald-50/30 transition-colors ${sIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}
                      >
                        {iIdx === 0 && (
                          <>
                            <td rowSpan={sale.items.length} className="px-5 py-3 align-top border-r border-gray-100">
                              <span className={`inline-flex flex-col items-center gap-0.5`}>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${sale.is_loan ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                  #{sale.sale_id}
                                </span>
                                {sale.is_loan && (
                                  <span className="text-[9px] text-red-500 font-bold">LOAN</span>
                                )}
                              </span>
                            </td>
                            <td rowSpan={sale.items.length} className="px-5 py-3 align-top font-mono text-gray-600 text-xs border-r border-gray-100 whitespace-nowrap">
                              {sale.time}
                            </td>
                          </>
                        )}
                        <td className="px-5 py-3">
                          <p className="font-semibold text-gray-900">{item.product}</p>
                          {item.variant && <p className="text-[11px] text-gray-400 mt-0.5">{item.variant}</p>}
                        </td>
                        <td className="px-5 py-3 text-center font-mono font-bold text-gray-800">{item.qty}</td>
                        <td className="px-5 py-3 text-center">
                          <span className={`text-[11px] px-2 py-0.5 rounded font-bold ${item.is_loose ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                            {item.unit}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-gray-700">{fmt(item.rate)}</td>
                        <td className="px-5 py-3 text-right font-bold text-emerald-700 font-mono">{fmt(item.total)}</td>
                      </tr>
                    ))}
                    {/* Bill subtotal */}
                    <tr className="border-b-2 border-dashed border-gray-200 bg-gray-100/60">
                      <td colSpan={6} className="px-5 py-2 text-right text-xs font-bold text-gray-500 italic">
                        Bill #{sale.sale_id} subtotal
                      </td>
                      <td className="px-5 py-2 text-right font-bold text-gray-800 font-mono text-sm">
                        ₹ {fmt(sale.bill_total)}
                      </td>
                    </tr>
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>


      {/* ══════════════════════════════════════════════════════════
          EXPENSES LIST
      ══════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-gray-200 rounded-b-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b-2 border-dashed border-gray-200 bg-gray-50">
          <div className="w-1 h-5 bg-red-400 rounded-full" />
          <h2 className="font-bold text-gray-900 text-base tracking-wide uppercase">Expenses Breakdown</h2>
          <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
            {filteredExpenses.length} {filteredExpenses.length === 1 ? 'Entry' : 'Entries'}
          </span>
        </div>

        {filteredExpenses.length === 0 ? (
          <p className="text-center text-gray-400 py-10 text-sm">No expenses recorded for this day.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                  <th className="px-6 py-3 text-left font-bold w-10">#</th>
                  <th className="px-6 py-3 text-left font-bold">Category</th>
                  <th className="px-6 py-3 text-left font-bold">Note / Description</th>
                  <th className="px-6 py-3 text-right font-bold">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((exp, idx) => (
                  <tr key={exp.id} className={`border-b border-gray-50 hover:bg-red-50/30 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                    <td className="px-6 py-3.5 text-gray-400 text-xs font-bold">{idx + 1}.</td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg">
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-gray-500">{exp.note || <span className="italic text-gray-300">—</span>}</td>
                    <td className="px-6 py-3.5 text-right font-bold text-red-600 font-mono">− {fmt(exp.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-red-50 border-t-2 border-red-200">
                  <td colSpan={3} className="px-6 py-3 text-right font-bold text-red-800 text-xs uppercase tracking-wider">
                    Total Expenses
                  </td>
                  <td className="px-6 py-3 text-right font-bold text-red-800 text-base font-mono">
                    − ₹ {fmt(report.summary.total_expenses)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Report Footer — visible in PDF since we use html2canvas, not print CSS */}
        <div className="flex justify-between items-center text-xs text-gray-400 border-t border-dashed border-gray-200 px-6 py-4 bg-gray-50 rounded-b-2xl">
          <span className="font-bold text-gray-500">Raju Agro · Daily Report</span>
          <span>{formatDisplayDate(report.date)}</span>
          <span>Generated: {new Date().toLocaleString('en-IN')}</span>
        </div>
      </div>

    </div>
  );
};


export default function ReportsPage({ apiFetch }) {
  const [dates, setDates]         = useState([]);
  const [tree, setTree]           = useState({});
  const [openYears, setOpenYears] = useState({});
  const [openMonths, setOpenMonths] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [report, setReport]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [datesLoading, setDatesLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError]         = useState('');
  const [downloading, setDownloading] = useState(false);
  const reportRef = useRef(null);

  // ── Load all available dates on mount ──
  useEffect(() => {
    (async () => {
      setDatesLoading(true);
      const data = await apiFetch('/api/report-dates/');
      if (data && data.dates) {
        setDates(data.dates);
        const t = groupDates(data.dates);
        setTree(t);
        const latestYear = Object.keys(t).sort().reverse()[0];
        if (latestYear) {
          setOpenYears({ [latestYear]: true });
          const latestMonth = Object.keys(t[latestYear]).sort().reverse()[0];
          if (latestMonth) setOpenMonths({ [`${latestYear}-${latestMonth}`]: true });
        }
        const today = new Date().toISOString().split('T')[0];
        const autoDate = data.dates.includes(today) ? today : data.dates[0];
        if (autoDate) loadReport(autoDate);
      }
      setDatesLoading(false);
    })();
  }, []);

  const loadReport = useCallback(async (date) => {
    setSelectedDate(date);
    setLoading(true);
    setError('');
    setSearchTerm('');
    const data = await apiFetch(`/api/daily-report/?date=${date}`);
    if (data && data.date) {
      setReport(data);
    } else {
      setError('Could not load report. Please check your backend connection.');
      setReport(null);
    }
    setLoading(false);
  }, [apiFetch]);


  // ── SHARED: build row HTML strings ──────────────────────────────────────────
  const buildReportRows = () => {
    if (!report) return { salesRows: '', expenseRows: '', noSales: true, noExp: true };
    const fmtN = (v) => Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    let salesRows = '';
    report.sales.forEach((sale) => {
      sale.items.forEach((item, idx) => {
        salesRows += `<tr>
          ${idx === 0 ? `
            <td rowspan="${sale.items.length}" style="padding:10px 12px;vertical-align:top;border-right:1px solid #e5e7eb;">
              <span style="background:${sale.is_loan ? '#fee2e2' : '#d1fae5'};color:${sale.is_loan ? '#b91c1c' : '#065f46'};padding:2px 8px;border-radius:99px;font-size:11px;font-weight:700;">#${sale.sale_id}</span>
              ${sale.is_loan ? '<div style="font-size:10px;color:#ef4444;font-weight:700;margin-top:2px;">LOAN</div>' : ''}
            </td>
            <td rowspan="${sale.items.length}" style="padding:10px 12px;vertical-align:top;font-family:monospace;font-size:12px;color:#6b7280;border-right:1px solid #e5e7eb;white-space:nowrap;">${sale.time}</td>
          ` : ''}
          <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;">
            <div style="font-weight:600;color:#111;">${item.product}</div>
            ${item.variant ? `<div style="font-size:11px;color:#9ca3af;">${item.variant}</div>` : ''}
          </td>
          <td style="padding:10px 12px;text-align:center;font-family:monospace;font-weight:700;border-bottom:1px solid #f3f4f6;">${item.qty}</td>
          <td style="padding:10px 12px;text-align:center;border-bottom:1px solid #f3f4f6;">
            <span style="background:${item.is_loose ? '#fff7ed' : '#eff6ff'};color:${item.is_loose ? '#c2410c' : '#1d4ed8'};padding:2px 7px;border-radius:4px;font-size:11px;font-weight:700;">${item.unit}</span>
          </td>
          <td style="padding:10px 12px;text-align:right;font-family:monospace;color:#374151;border-bottom:1px solid #f3f4f6;">₹${fmtN(item.rate)}</td>
          <td style="padding:10px 12px;text-align:right;font-family:monospace;font-weight:700;color:#059669;border-bottom:1px solid #f3f4f6;">₹${fmtN(item.total)}</td>
        </tr>`;
      });
      salesRows += `<tr style="background:#f9fafb;">
        <td colspan="6" style="padding:7px 12px;text-align:right;font-size:12px;font-style:italic;color:#6b7280;border-top:1px dashed #d1d5db;">Bill #${sale.sale_id} subtotal</td>
        <td style="padding:7px 12px;text-align:right;font-family:monospace;font-weight:700;color:#111;border-top:1px dashed #d1d5db;">₹ ${fmtN(sale.bill_total)}</td>
      </tr>`;
    });

    const expenseRows = report.expenses.map((exp, idx) => `
      <tr style="background:${idx % 2 === 0 ? '#fff' : '#fafafa'};">
        <td style="padding:10px 16px;color:#9ca3af;font-weight:700;font-size:12px;">${idx + 1}.</td>
        <td style="padding:10px 16px;"><span style="background:#f3f4f6;color:#374151;padding:3px 10px;border-radius:6px;font-size:12px;font-weight:700;">${exp.category}</span></td>
        <td style="padding:10px 16px;color:#6b7280;">${exp.note || '<span style="color:#d1d5db;font-style:italic;">—</span>'}</td>
        <td style="padding:10px 16px;text-align:right;font-family:monospace;font-weight:700;color:#dc2626;">− ${fmtN(exp.amount)}</td>
      </tr>
    `).join('');

    return { salesRows, expenseRows, noSales: report.sales.length === 0, noExp: report.expenses.length === 0 };
  };

  const sharedStyles = `* { margin:0; padding:0; box-sizing:border-box; } body { font-family: 'Segoe UI', Arial, sans-serif; background:#fff; color:#111; } table { width:100%; border-collapse:collapse; } @media print { @page { size:A4; margin:12mm; } body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }`;

  const buildHeaderHTML = (subtitle) => {
    const fmtDate = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    return `<div style="background:linear-gradient(135deg,#059669,#10b981);padding:36px 40px;text-align:center;color:#fff;">
  <div style="display:inline-block;background:rgba(255,255,255,0.2);padding:14px;border-radius:16px;margin-bottom:12px;border:1px solid rgba(255,255,255,0.3);">
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-9"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/>
    </svg>
  </div>
  <div style="font-size:28px;font-weight:800;letter-spacing:0.5px;">Raju Agro</div>
  <div style="font-size:12px;color:rgba(255,255,255,0.8);letter-spacing:3px;text-transform:uppercase;margin-top:4px;">Farmer's Trusted Partner</div>
  <div style="border-top:1px solid rgba(255,255,255,0.2);margin:20px 60px;"></div>
  <div style="font-size:16px;font-weight:700;color:rgba(255,255,255,0.85);letter-spacing:1px;text-transform:uppercase;">${subtitle}</div>
  <div style="font-size:32px;font-weight:800;margin-top:6px;">${fmtDate(report.date)}</div>
</div>`;
  };

  const buildItemsExpensesHTML = ({ salesRows, expenseRows, noSales, noExp }) => {
    const fmtN = (v) => Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const s = report.summary;
    return `
<div style="border:1px solid #e5e7eb;border-top:none;">
  <div style="padding:14px 20px;background:#f9fafb;border-bottom:2px dashed #d1d5db;display:flex;align-items:center;gap:10px;">
    <div style="width:4px;height:20px;background:#059669;border-radius:4px;"></div>
    <span style="font-weight:800;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#111;">Items Sold</span>
    <span style="background:#d1fae5;color:#065f46;padding:2px 10px;border-radius:99px;font-size:11px;font-weight:700;margin-left:4px;">${s.bill_count} ${s.bill_count === 1 ? 'Bill' : 'Bills'}</span>
  </div>
  ${noSales ? '<p style="text-align:center;padding:40px;color:#9ca3af;font-size:13px;">No sales recorded for this day.</p>' : `
  <table>
    <thead><tr style="background:#f9fafb;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #e5e7eb;">
      <th style="padding:10px 12px;text-align:left;font-weight:700;">Bill #</th>
      <th style="padding:10px 12px;text-align:left;font-weight:700;">Time</th>
      <th style="padding:10px 12px;text-align:left;font-weight:700;">Product</th>
      <th style="padding:10px 12px;text-align:center;font-weight:700;">Qty</th>
      <th style="padding:10px 12px;text-align:center;font-weight:700;">Unit</th>
      <th style="padding:10px 12px;text-align:right;font-weight:700;">Rate (₹)</th>
      <th style="padding:10px 12px;text-align:right;font-weight:700;">Amount (₹)</th>
    </tr></thead>
    <tbody>${salesRows}</tbody>
  </table>`}
</div>
<div style="border:1px solid #e5e7eb;border-top:none;">
  <div style="padding:14px 20px;background:#f9fafb;border-bottom:2px dashed #e5e7eb;display:flex;align-items:center;gap:10px;">
    <div style="width:4px;height:20px;background:#f87171;border-radius:4px;"></div>
    <span style="font-weight:800;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#111;">Expenses Breakdown</span>
    <span style="background:#fee2e2;color:#b91c1c;padding:2px 10px;border-radius:99px;font-size:11px;font-weight:700;margin-left:4px;">${report.expenses.length} ${report.expenses.length === 1 ? 'Entry' : 'Entries'}</span>
  </div>
  ${noExp ? '<p style="text-align:center;padding:30px;color:#9ca3af;font-size:13px;">No expenses recorded for this day.</p>' : `
  <table>
    <thead><tr style="background:#f9fafb;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #e5e7eb;">
      <th style="padding:10px 16px;text-align:left;font-weight:700;width:40px;">#</th>
      <th style="padding:10px 16px;text-align:left;font-weight:700;">Category</th>
      <th style="padding:10px 16px;text-align:left;font-weight:700;">Note / Description</th>
      <th style="padding:10px 16px;text-align:right;font-weight:700;">Amount (₹)</th>
    </tr></thead>
    <tbody>${expenseRows}</tbody>
  </table>`}
</div>`;
  };

  const buildFinancialSummaryHTML = () => {
    const s = report.summary;
    const fmtN = (v) => Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const netPos = s.net >= 0;
    return `
<div style="background:#f9fafb;border:1px solid #e5e7eb;border-top:none;padding:20px 24px;">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
    <div style="width:4px;height:20px;background:#3b82f6;border-radius:4px;"></div>
    <span style="font-weight:800;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#111;">Financial Summary</span>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:14px;">
    <div style="background:#fff;border:1px solid #d1fae5;border-radius:12px;padding:16px;display:flex;align-items:center;gap:12px;">
      <div style="background:#ecfdf5;padding:10px;border-radius:10px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg></div>
      <div><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#9ca3af;">Revenue</div><div style="font-size:18px;font-weight:800;color:#059669;font-family:monospace;">₹ ${fmtN(s.revenue)}</div><div style="font-size:11px;color:#9ca3af;">${s.bill_count} bills</div></div>
    </div>
    <div style="background:#fff;border:1px solid #bbf7d0;border-radius:12px;padding:16px;display:flex;align-items:center;gap:12px;">
      <div style="background:#f0fdf4;padding:10px;border-radius:10px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
      <div><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#9ca3af;">Profit</div><div style="font-size:18px;font-weight:800;color:#16a34a;font-family:monospace;">₹ ${fmtN(s.profit)}</div><div style="font-size:11px;color:#9ca3af;">After cost of goods</div></div>
    </div>
    <div style="background:#fff;border:1px solid #fecaca;border-radius:12px;padding:16px;display:flex;align-items:center;gap:12px;">
      <div style="background:#fef2f2;padding:10px;border-radius:10px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div>
      <div><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#9ca3af;">Expenses</div><div style="font-size:18px;font-weight:800;color:#ef4444;font-family:monospace;">₹ ${fmtN(s.total_expenses)}</div><div style="font-size:11px;color:#9ca3af;">${report.expenses.length} entries</div></div>
    </div>
  </div>
</div>`;
  };

  const openPopup = (filename, bodyHTML) => {
    const fmtDate = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const footer = `<div style="padding:12px 20px;border-top:1px dashed #e5e7eb;display:flex;justify-content:space-between;font-size:11px;color:#9ca3af;background:#f9fafb;border-radius:0 0 12px 12px;"><span style="font-weight:700;color:#6b7280;">Raju Agro · ${filename.includes('analaysis') ? 'Business Analysis' : 'Daily Report'}</span><span>${fmtDate(report.date)}</span><span>Generated: ${new Date().toLocaleString('en-IN')}</span></div>`;
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${filename}</title><style>* { margin:0; padding:0; box-sizing:border-box; } body { font-family: 'Segoe UI', Arial, sans-serif; background:#fff; color:#111; margin:10mm; } table { width:100%; border-collapse:collapse; } @media print { @page { size:A4; margin:0; } body { margin:12mm; -webkit-print-color-adjust:exact; print-color-adjust:exact; } }</style></head><body>${bodyHTML}${footer}<script>window.onload=function(){window.print();}<\/script></body></html>`;
    const popup = window.open('', '_blank', 'width=900,height=750');
    if (!popup) { alert('Please allow popups for this site.'); return; }
    popup.document.open(); popup.document.write(html); popup.document.close();
  };

  // ── Download PDF: items + expenses only ──────────────────────────────────────
  const handleDownload = () => {
    if (!report) return;
    const rows = buildReportRows();
    openPopup(
      `RajuAgroReport-${report.date}`,
      buildHeaderHTML('Daily Report') + buildItemsExpensesHTML(rows)
    );
  };

  // ── Analysis PDF: items + expenses + financial summary ────────────────────────
  const handleAnalysis = () => {
    if (!report) return;
    const rows = buildReportRows();
    openPopup(
      `RajuAgroAnalysis-${report.date}`,
      buildHeaderHTML('Business Analysis') + buildItemsExpensesHTML(rows) + buildFinancialSummaryHTML()
    );
  };


  const toggleYear  = (y)   => setOpenYears((p)  => ({ ...p, [y]: !p[y] }));
  const toggleMonth = (key) => setOpenMonths((p) => ({ ...p, [key]: !p[key] }));

  return (
    <>
      <div id="reports-print-root">

        {/* ── Top Bar ── (no-print wrapper handled by parent) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 no-print">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText size={22} className="text-emerald-600" />
              Daily Reports
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">Browse & download your daily business reports</p>
          </div>

          {/* Search + Download + Analysis */}
          {report && (
            <div className="flex gap-2 items-center flex-wrap">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search items, qty, bill…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 shadow-sm w-52"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X size={14} />
                  </button>
                )}
              </div>
              {/* Download PDF — items + expenses only */}
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-bold rounded-xl shadow-[0_4px_14px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.4)] transition-all active:scale-95"
              >
                <Download size={16} />
                Download PDF
              </button>
              {/* Analysis — items + expenses + financial summary */}
              <button
                onClick={handleAnalysis}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-bold rounded-xl shadow-[0_4px_14px_rgba(99,102,241,0.3)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.4)] transition-all active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                Analysis
              </button>
            </div>
          )}
        </div>

        {/* ── Main Layout ── */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Left: Folder Tree ── */}
          <aside className="no-print w-full lg:w-64 xl:w-72 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                  <Folder size={14} /> Report Archive
                </p>
              </div>
              <div className="p-2 max-h-[70vh] overflow-y-auto">
                {datesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 size={20} className="animate-spin text-emerald-500" />
                  </div>
                ) : Object.keys(tree).length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">No reports yet.<br />Make a sale first!</p>
                ) : (
                  Object.keys(tree).sort().reverse().map((year) => (
                    <div key={year}>
                      {/* Year row */}
                      <button
                        onClick={() => toggleYear(year)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-bold text-gray-800 hover:bg-gray-50 rounded-xl transition-colors"
                      >
                        {openYears[year]
                          ? <ChevronDown size={15} className="text-emerald-600" />
                          : <ChevronRight size={15} className="text-gray-400" />}
                        {openYears[year]
                          ? <FolderOpen size={16} className="text-emerald-500" />
                          : <Folder size={16} className="text-gray-400" />}
                        <span>{year}</span>
                        <span className="ml-auto text-xs text-gray-400 font-normal">
                          {dates.filter((d) => d.startsWith(year)).length}d
                        </span>
                      </button>

                      {/* Month rows */}
                      {openYears[year] && Object.keys(tree[year]).sort().reverse().map((month) => {
                        const monthKey = `${year}-${month}`;
                        const monthName = MONTH_NAMES[parseInt(month, 10) - 1];
                        return (
                          <div key={monthKey} className="ml-4">
                            <button
                              onClick={() => toggleMonth(monthKey)}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
                            >
                              {openMonths[monthKey]
                                ? <ChevronDown size={13} className="text-emerald-500" />
                                : <ChevronRight size={13} className="text-gray-400" />}
                              <Calendar size={13} className="text-gray-400" />
                              <span>{monthName}</span>
                              <span className="ml-auto text-gray-400">{tree[year][month].length}</span>
                            </button>

                            {/* Date rows */}
                            {openMonths[monthKey] && (
                              <div className="ml-4 space-y-0.5 my-1">
                                {tree[year][month].sort().reverse().map((date) => {
                                  const d = new Date(date + 'T00:00:00');
                                  const isSelected = selectedDate === date;
                                  return (
                                    <button
                                      key={date}
                                      onClick={() => loadReport(date)}
                                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded-xl transition-all ${
                                        isSelected
                                          ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200'
                                          : 'text-gray-600 hover:bg-gray-100'
                                      }`}
                                    >
                                      <FileText size={12} className={isSelected ? 'text-emerald-600' : 'text-gray-400'} />
                                      {d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Load Today button */}
              <div className="p-3 border-t border-gray-100">
                <button
                  onClick={() => loadReport(new Date().toISOString().split('T')[0])}
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors"
                >
                  <Calendar size={13} /> Today's Report
                </button>
              </div>
            </div>
          </aside>

          {/* ── Right: Report Content ── */}
          <div className="flex-1 min-w-0" ref={reportRef}>
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <Loader2 size={32} className="animate-spin text-emerald-500" />
                <p className="text-gray-400 text-sm">Loading report…</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3 text-red-500">
                <AlertCircle size={32} />
                <p className="text-sm font-bold">{error}</p>
              </div>
            ) : !report ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4 text-gray-400">
                <div className="p-6 bg-gray-100 rounded-full">
                  <FileBarChart2 size={40} className="text-gray-300" />
                </div>
                <p className="text-sm font-bold">Select a date from the folder tree</p>
                <p className="text-xs">or click "Today's Report" to get started</p>
              </div>
            ) : (
              <PrintableReport report={report} searchTerm={searchTerm} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
