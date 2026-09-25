'use client';

import React from 'react';
import { Provider } from 'react-redux';
import { store } from '../../store/index.js';

export function Providers({ children }) {
  return <Provider store={store}>{children}</Provider>;
}
