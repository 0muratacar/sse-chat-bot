import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface OptimisticMessage {
  id: string;
  content: string;
  role: 'user';
  failed?: boolean;
}

interface ChatState {
  activeChatId: string | null;
  streamingBuffer: string;
  isStreaming: boolean;
  optimisticMessages: OptimisticMessage[];
}

const initialState: ChatState = {
  activeChatId: null,
  streamingBuffer: '',
  isStreaming: false,
  optimisticMessages: [],
};

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveChat: (state, action: PayloadAction<string | null>) => {
      state.activeChatId = action.payload;
      state.optimisticMessages = [];
    },
    addOptimisticMessage: (state, action: PayloadAction<{ id: string; content: string }>) => {
      state.optimisticMessages.push({
        id: action.payload.id,
        content: action.payload.content,
        role: 'user',
      });
    },
    markMessageFailed: (state, action: PayloadAction<string>) => {
      const msg = state.optimisticMessages.find((m) => m.id === action.payload);
      if (msg) msg.failed = true;
    },
    clearOptimisticMessages: (state) => {
      state.optimisticMessages = [];
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

export const {
  setActiveChat,
  addOptimisticMessage,
  markMessageFailed,
  clearOptimisticMessages,
  startStreaming,
  appendToBuffer,
  finishStreaming,
  clearBuffer,
} = chatSlice.actions;
