import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import podcastReducer from './slices/podcastSlice';
import playerReducer from './slices/playerSlice';
import downloadReducer from './slices/downloadSlice';
import notificationReducer from './slices/notificationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    podcast: podcastReducer,
    player: playerReducer,
    download: downloadReducer,
    notification: notificationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
