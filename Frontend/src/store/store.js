import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../authSlice';
import problemReducer from './problemSlice'; // <-- Import the new reducer

export const store = configureStore({
    reducer: {
        auth: authReducer,
        problem: problemReducer, // <-- Add the new reducer
    }
});