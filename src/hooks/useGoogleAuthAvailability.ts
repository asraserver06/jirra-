import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export type GoogleAuthAvailability = 'loading' | 'enabled' | 'disabled' | 'error';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

export const useGoogleAuthAvailability = (): GoogleAuthAvailability => {
  const [availability, setAvailability] = useState<GoogleAuthAvailability>(
    GOOGLE_CLIENT_ID ? 'loading' : 'disabled'
  );

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setAvailability('disabled');
      return;
    }

    let active = true;
    api.get<{ success: boolean; data?: { enabled?: boolean } }>('/api/auth/google/status')
      .then((response) => {
        if (active) setAvailability(response.data.success && response.data.data?.enabled ? 'enabled' : 'disabled');
      })
      .catch(() => {
        if (active) setAvailability('error');
      });

    return () => {
      active = false;
    };
  }, []);

  return availability;
};
