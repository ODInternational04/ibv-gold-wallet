import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/utils/supabase/client';
import { useAuth } from '@/lib/AuthContext';

export function useRole() {
  const { user, isLoadingAuth } = useAuth();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = useCallback(async () => {
    if (isLoadingAuth) return; // wait for auth to settle before checking role
    if (!user) { setRole(null); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();
    setRole(data?.role ?? 'user');
    setLoading(false);
  }, [user, isLoadingAuth]);

  useEffect(() => { fetchRole(); }, [fetchRole]);

  return { role, isAdmin: role === 'admin', loading: loading || isLoadingAuth };
}
