import { configureStore } from "@reduxjs/toolkit";
import AuthReducer from "../features/auth/slice/auth.slice.js";
import ChatReducer from "../features/main/store/chat.slice.js";

export const store = configureStore({
    reducer: {
        auth: AuthReducer,
        chat: ChatReducer,
    }
})