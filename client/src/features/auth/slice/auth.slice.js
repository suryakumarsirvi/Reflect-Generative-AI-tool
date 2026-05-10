import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  accessToken: null,
};

const AuthSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
    },

    clearUser: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
    },

    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const { setUser, clearUser, setLoading } = AuthSlice.actions;
export default AuthSlice.reducer;
