import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/utils/supabase/client';
import { useAuth } from '@/lib/AuthContext';

export function useVerification() {
  const { user } = useAuth();
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchVerification = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('user_verifications')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    setVerification(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchVerification();
  }, [fetchVerification]);

  const isVerified   = verification?.status === 'verified';
  const isPending    = verification?.status === 'pending' || verification?.status === 'under_review';
  const isRejected   = verification?.status === 'rejected';
  const isSubmitted  = verification !== null && verification?.status !== 'not_submitted';

  return { verification, loading, isVerified, isPending, isRejected, isSubmitted, refetch: fetchVerification };
}
