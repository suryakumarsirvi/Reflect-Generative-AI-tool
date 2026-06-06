import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  chats: [],
  currentChatId: null,
  messages: [],
  isLoading: false,
  isStreaming: false,
  goProModalOpen: false,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setGoProModalOpen: (state, action) => {
      state.goProModalOpen = action.payload;
    },
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
      const msg = {
        sources: [],
        visuals: [],
        thoughtTrace: "",
        ...action.payload
      };
      state.messages.push(msg);
    },
    updateLastMessage: (state, action) => {
      if (state.messages.length > 0) {
        const lastMsg = state.messages[state.messages.length - 1];
        lastMsg.content = (lastMsg.content || "") + action.payload;
      }
    },
    updateLastMessageThought: (state, action) => {
      if (state.messages.length > 0) {
        const lastMsg = state.messages[state.messages.length - 1];
        lastMsg.thoughtTrace = (lastMsg.thoughtTrace || "") + action.payload;
      }
    },
    setLastMessageSources: (state, action) => {
      if (state.messages.length > 0) {
        const lastMsg = state.messages[state.messages.length - 1];
        lastMsg.sources = action.payload;
      }
    },
    setLastMessageVisuals: (state, action) => {
      if (state.messages.length > 0) {
        const lastMsg = state.messages[state.messages.length - 1];
        lastMsg.visuals = action.payload;
      }
    },
    truncateMessagesAfterIndex: (state, action) => {
      state.messages = state.messages.slice(0, action.payload);
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
    deleteChatSuccess: (state, action) => {
      state.chats = state.chats.filter((c) => c._id !== action.payload);
      if (state.currentChatId === action.payload) {
        state.currentChatId = null;
        state.messages = [];
      }
    },
  },
});

export const {
  setGoProModalOpen,
  setChats,
  setCurrentChatId,
  setMessages,
  addMessage,
  updateLastMessage,
  updateLastMessageThought,
  setLastMessageSources,
  setLastMessageVisuals,
  truncateMessagesAfterIndex,
  setIsLoading,
  setIsStreaming,
  updateChatInList,
  deleteChatSuccess,
} = chatSlice.actions;

export default chatSlice.reducer;
