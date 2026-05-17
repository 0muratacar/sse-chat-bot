import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Lang = 'en' | 'tr';

interface LangState {
  lang: Lang;
}

const initialState: LangState = {
  lang: 'tr',
};

export const langSlice = createSlice({
  name: 'lang',
  initialState,
  reducers: {
    setLang: (state, action: PayloadAction<Lang>) => {
      state.lang = action.payload;
    },
  },
});

export const { setLang } = langSlice.actions;
