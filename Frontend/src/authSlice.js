import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import axiosClient from './utils/axiosClient';

export const registerUser = createAsyncThunk(
    'auth/register',
    async(userData, {rejectWithValue}) => {
        try{
            const response = await axiosClient.post('/user/register',userData);  //axios auto convert data into json format
            /*const response = {
             *  data: {
             *          user: reply //from backend
             *          message: "Registered Successfully..."
             *      }
             *  status_code: .... similarly lot of fields
             * }
             */
            return response.data.user;
        } catch(error){
            return rejectWithValue(error);    //handles errors came from backend
        }
    }
);

export const loginUser = createAsyncThunk(
    'auth/login',
    async(credentials, {rejectWithValue}) => {
        try{
            const response = await axiosClient.post('/user/login',credentials);  //axios auto convert data into json format
            return response.data.user;
        } catch(error){
            return rejectWithValue(error);    //handles errors came from backend
        }
    }
);

export const checkAuth = createAsyncThunk(
    'auth/check',
    async(_, {rejectWithValue}) => {
        try{
            const {data} = await axiosClient.get('/user/check');  //axios auto convert data into json format
            return data.user;
        } catch(error){
            return rejectWithValue(error);    //handles errors came from backend
        }
    }
);

export const logoutUser = createAsyncThunk(
    'auth/logout',
    async(_, {rejectWithValue}) => {
        try{
            await axiosClient.post('/user/logout');  //axios auto convert data into json format
            return null;
        } catch(error){
            return rejectWithValue(error);    //handles errors came from backend
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null
    },
    reducers: {
    },
    extraReducers: (builder) => {
        builder
        //Register cases
        .addCase(registerUser.pending, (state)=> {
            state.loading = true;
            state.error = null;
        })
        .addCase(registerUser.fulfilled, (state, action)=>{
            state.loading = false;
            state.isAuthenticated = !!action.payload;   //contains user info.. give 'true' val.. 
            //if user obj came.. and that is empty means null val.. then it will first give true then false at end.. due to 2 not operations..
            //to handle this edge case use are doing this..
            state.user = action.payload;
        })
        .addCase(registerUser.rejected, (state, action)=> {
            state.loading = false;
            state.error = action.payload?.message || 'Something went wrong...';
            state.isAuthenticated = false;
            state.user = null;
        })

        //Login cases
        .addCase(loginUser.pending, (state)=> {
            state.loading = true;
            state.error = null;
        })
        .addCase(loginUser.fulfilled, (state, action)=>{
            state.loading = false;
            state.isAuthenticated = !!action.payload;   
            state.user = action.payload;
        })
        .addCase(loginUser.rejected, (state, action)=> {
            state.loading = false;
            state.error = action.payload?.message || 'Something went wrong...';
            state.isAuthenticated = false;
            state.user = null;
        })

        //Auth cases
        .addCase(checkAuth.pending, (state)=> {
            state.loading = true;
            state.error = null;
        })
        .addCase(checkAuth.fulfilled, (state, action)=>{
            state.loading = false;
            state.isAuthenticated = !!action.payload;   
            state.user = action.payload;
        })
        .addCase(checkAuth.rejected, (state, action)=> {
            state.loading = false;
            state.error = action.payload?.message || 'Something went wrong...';
            state.isAuthenticated = false;
            state.user = null;
        })

        //Logout cases
        .addCase(logoutUser.pending, (state)=> {
            state.loading = true;
            state.error = null;
        })
        .addCase(logoutUser.fulfilled, (state)=>{
            state.loading = false;
            state.error = null;
            state.isAuthenticated = false;   
            state.user = null;
        })
        .addCase(logoutUser.rejected, (state, action)=> {
            state.loading = false;
            state.error = action.payload?.message || 'Something went wrong...';
            state.isAuthenticated = false;
            state.user = null;
        })
    }

});

export default authSlice.reducer;