'use client';

import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '../../store/index.js';
import { fetchCurrentUser } from '../../features/auth/authSlice.js';
import { getAccessToken } from '../../lib/api-client.js';

export function Providers({ children }) {
  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      store.dispatch(fetchCurrentUser());
    }
  }, []);

  return <Provider store={store}>{children}</Provider>;
}
