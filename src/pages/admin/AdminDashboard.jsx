import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Users, Clock, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/utils/supabase/client';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ pending: 0, verified: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('user_verifications')
        .select('status');
      if (data) {
        setStats({
          total: data.length,
          pending: data.filter(r => r.status === 'pending' || r.status === 'under_review').length,
          verified: data.filter(r => r.status === 'verified').length,
          rejected: data.filter(r => r.status === 'rejected').length,
        });
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const cards = [
    { label: 'Total Submitted', value: stats.total, icon: Users, color: 'text-[#7fb7c9]', bg: 'bg-[#396978]/15' },
    { label: 'Pending Review', value: stats.pending, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { label: 'Verified', value: stats.verified, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-light text-white" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Admin Dashboard</h1>
        <p className="mt-1 text-sm text-white/40">Overview of user verifications</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-white/30 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin" /> Loading...
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {cards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-white/8 bg-[#141820] p-5">
              <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center mb-4`}>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <p className="text-2xl font-semibold text-white">{card.value}</p>
              <p className="mt-1 text-xs text-white/40">{card.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
