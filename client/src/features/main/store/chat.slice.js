import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  chats: [],
  currentChatId: null,
  messages: [],
  isLoading: false,
  isStreaming: false,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setChats: (state, action) => {
      state.chats = action.payload;
    },
    setCurrentChatId: (state, action) => {
      state.currentChatId = action.payload;
    },
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    updateLastMessage: (state, action) => {
      if (state.messages.length > 0) {
        state.messages[state.messages.length - 1].content += action.payload;
      }
    },
    setIsLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setIsStreaming: (state, action) => {
      state.isStreaming = action.payload;
    },
    updateChatInList: (state, action) => {
      const index = state.chats.findIndex((c) => c._id === action.payload._id);
      if (index !== -1) {
        state.chats[index] = { ...state.chats[index], ...action.payload };
      } else {
        state.chats.unshift(action.payload);
      }
    },
  },
});

export const {
  setChats,
  setCurrentChatId,
  setMessages,
  addMessage,
  updateLastMessage,
  setIsLoading,
  setIsStreaming,
  updateChatInList,
} = chatSlice.actions;

export default chatSlice.reducer;
