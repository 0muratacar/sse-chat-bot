import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from './api/baseApi';
import { authSlice } from './slices/authSlice';
import { chatSlice } from './slices/chatSlice';
import { langSlice } from './slices/langSlice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
      auth: authSlice.reducer,
      chat: chatSlice.reducer,
      lang: langSlice.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
