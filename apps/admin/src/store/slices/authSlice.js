import { createSlice } from '@reduxjs/toolkit';
const initialState = {
    token: null,
};
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setToken(state, action) {
            state.token = action.payload;
        },
        clearToken(state) {
            state.token = null;
        },
    },
});
export const { setToken, clearToken } = authSlice.actions;
export const selectIsAuthenticated = (state) => Boolean(state.auth.token);
export default authSlice.reducer;
