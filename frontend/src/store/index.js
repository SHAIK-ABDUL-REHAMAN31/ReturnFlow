import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice.js';
import returnsReducer from '../features/returns/returnsSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    returns: returnsReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});
