import React, { useEffect, useState, useCallback } from 'react';
import {
  Users, CheckCircle2, XCircle, Clock, Eye, RefreshCw,
  FileText, ChevronDown, ChevronUp, AlertCircle, ExternalLink
} from 'lucide-react';
import { supabase } from '@/utils/supabase/client';

const STATUS_STYLES = {
  not_submitted: { label: 'Not Submitted', color: 'text-white/30', bg: 'bg-white/5' },
  pending:       { label: 'Pending',        color: 'text-amber-400',  bg: 'bg-amber-400/10' },
  under_review:  { label: 'Under Review',   color: 'text-blue-400',   bg: 'bg-blue-400/10' },
  verified:      { label: 'Verified',       color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  rejected:      { label: 'Rejected',       color: 'text-red-400',    bg: 'bg-red-400/10' },
};

const FILTERS = ['all', 'pending', 'under_review', 'verified', 'rejected'];

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.not_submitted;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${s.bg} ${s.color}`}>
      {s.label}
    </span>
  );
}

function DocLink({ path, label }) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!path) return <span className="text-xs text-white/20">—</span>;

  const getUrl = async () => {
    setLoading(true);
    const { data } = await supabase.storage
      .from('verification-documents')
      .createSignedUrl(path, 60 * 10); // 10-min signed URL
    if (data?.signedUrl) {
      setUrl(data.signedUrl);
      window.open(data.signedUrl, '_blank');
    }
    setLoading(false);
  };

  return (
    <button
      onClick={getUrl}
      disabled={loading}
      className="flex items-center gap-1.5 text-xs text-[#7fb7c9] hover:underline disabled:opacity-50"
    >
      <FileText className="w-3.5 h-3.5" />
      {loading ? 'Loading...' : label}
      <ExternalLink className="w-3 h-3" />
    </button>
  );
}

function ReviewModal({ record, onClose, onUpdate }) {
  const [notes, setNotes] = useState(record.reviewer_notes ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const act = async (newStatus) => {
    setError('');
    setLoading(true);
    const { error: err } = await supabase
      .from('user_verifications')
      .update({
        status: newStatus,
        reviewer_notes: notes.trim() || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', record.id);
    setLoading(false);
    if (err) { setError(err.message); return; }
    onUpdate();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#141820] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-1 text-2xl font-light text-white" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
          Review Verification
        </h2>
        <p className="mb-5 text-sm text-white/40">{record.email}</p>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/8 bg-white/4 p-3">
            <p className="text-[10px] tracking-widest text-white/30">RSA ID NUMBER</p>
            <p className="mt-1 font-mono text-sm text-white">{record.id_number ?? '—'}</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/4 p-3">
            <p className="text-[10px] tracking-widest text-white/30">SUBMITTED</p>
            <p className="mt-1 text-sm text-white">
              {record.submitted_at ? new Date(record.submitted_at).toLocaleDateString() : '—'}
            </p>
          </div>
        </div>

        <div className="mb-4 space-y-2">
          <p className="text-[10px] tracking-widest text-white/30">DOCUMENTS</p>
          <div className="flex gap-4">
            <DocLink path={record.id_document_url} label="ID Document" />
            <DocLink path={record.utility_bill_url} label="Utility Bill" />
          </div>
        </div>

        <div className="mb-5">
          <label className="mb-1.5 block text-[10px] font-bold tracking-widest text-white/30">REVIEWER NOTES (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Add a note for this decision..."
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#396978]/40 resize-none"
          />
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => act('rejected')}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 py-3 text-sm font-bold text-red-400 transition-colors hover:bg-red-400/20 disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" /> Reject
          </button>
          <button
            onClick={() => act('under_review')}
            disabled={loading || record.status === 'under_review'}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-blue-400/30 bg-blue-400/10 py-3 text-sm font-bold text-blue-400 transition-colors hover:bg-blue-400/20 disabled:opacity-50"
          >
            <Clock className="w-4 h-4" /> Mark Under Review
          </button>
          <button
            onClick={() => act('verified')}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500/20 border border-emerald-400/30 py-3 text-sm font-bold text-emerald-400 transition-colors hover:bg-emerald-500/30 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" /> Approve
          </button>
        </div>

        <button onClick={onClose} className="mt-4 w-full text-center text-xs text-white/20 hover:text-white/40">
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function AdminVerifications() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selected, setSelected] = useState(null);
  const [sort, setSort] = useState({ col: 'submitted_at', dir: 'desc' });

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    // Join with auth.users email via a Postgres view isn't available directly,
    // so we fetch verifications and then batch-fetch emails via RPC or store email on submit
    const query = supabase
      .from('user_verifications')
      .select('*')
      .order(sort.col, { ascending: sort.dir === 'asc' });

    if (filter !== 'all') query.eq('status', filter);

    const { data } = await query;
    setRecords(data ?? []);
    setLoading(false);
  }, [filter, sort]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const toggleSort = (col) => {
    setSort((s) => s.col === col ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'desc' });
  };

  const SortIcon = ({ col }) =>
    sort.col === col
      ? sort.dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
      : <ChevronDown className="w-3 h-3 opacity-20" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-light text-white" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Verifications</h1>
          <p className="mt-1 text-sm text-white/40">{records.length} record{records.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={fetchRecords}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/50 hover:text-white transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize transition-colors ${
              filter === f
                ? 'bg-[#396978]/20 text-[#7fb7c9]'
                : 'text-white/30 hover:text-white/60 border border-white/8'
            }`}
          >
            {f === 'all' ? 'All' : f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/8">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 bg-[#0a0c0e]">
                {[
                  { label: 'User ID', col: 'user_id' },
                  { label: 'ID Number', col: 'id_number' },
                  { label: 'Status', col: 'status' },
                  { label: 'Submitted', col: 'submitted_at' },
                  { label: 'Documents', col: null },
                  { label: 'Actions', col: null },
                ].map(({ label, col }) => (
                  <th
                    key={label}
                    onClick={col ? () => toggleSort(col) : undefined}
                    className={`px-4 py-3 text-left text-[10px] font-bold tracking-widest text-white/30 ${col ? 'cursor-pointer hover:text-white/60 select-none' : ''}`}
                  >
                    <span className="flex items-center gap-1">
                      {label}
                      {col && <SortIcon col={col} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-white/20 text-sm">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Loading...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-white/20 text-sm">No records found.</td>
                </tr>
              ) : records.map((r) => (
                <tr key={r.id} className="border-b border-white/5 bg-[#141820] hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-white/40">{r.user_id.slice(0, 8)}…</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-white/70">{r.id_number ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-white/40">
                    {r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1.5">
                      <DocLink path={r.id_document_url} label="ID Doc" />
                      <DocLink path={r.utility_bill_url} label="Utility Bill" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelected(r)}
                      className="flex items-center gap-1.5 rounded-lg border border-[#396978]/30 bg-[#396978]/10 px-3 py-1.5 text-xs font-bold text-[#7fb7c9] transition-colors hover:bg-[#396978]/20"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <ReviewModal
          record={selected}
          onClose={() => setSelected(null)}
          onUpdate={fetchRecords}
        />
      )}
    </div>
  );
}
