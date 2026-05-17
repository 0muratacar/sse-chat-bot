import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ChatState {
  activeChatId: string | null;
  streamingBuffer: string;
  isStreaming: boolean;
}

const initialState: ChatState = {
  activeChatId: null,
  streamingBuffer: '',
  isStreaming: false,
};

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveChat: (state, action: PayloadAction<string | null>) => {
      state.activeChatId = action.payload;
    },
    startStreaming: (state) => {
      state.isStreaming = true;
      state.streamingBuffer = '';
    },
    appendToBuffer: (state, action: PayloadAction<string>) => {
      state.streamingBuffer += action.payload;
    },
    finishStreaming: (state) => {
      state.isStreaming = false;
    },
    clearBuffer: (state) => {
      state.streamingBuffer = '';
    },
  },
});

export const { setActiveChat, startStreaming, appendToBuffer, finishStreaming, clearBuffer } = chatSlice.actions;
