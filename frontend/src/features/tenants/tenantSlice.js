import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../helper/axios';

// Thunk for fetching the user from the API
export const fetchTenant = createAsyncThunk(
  'auth/fetchTenants',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios('/api/users/me');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.msg || 'Something went wrong');
    }
  }
);

// Thunk for logging in the user
export const loginTenant = createAsyncThunk(
  'auth/loginTenant',
  async (data, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/users/login', data, {
        withCredentials: true,
      });
      console.log(response.data); // For debugging purposes
      return response.data.user; // Assuming superAdmin info is returned
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to log in');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    tenant: JSON.parse(localStorage.getItem('tenant')) || null,
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.tenant = null;
      localStorage.removeItem('tenant'); // Consistently use 'user'
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch user
      .addCase(fetchTenant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTenant.fulfilled, (state, action) => {
        state.loading = false;
        state.tenant = action.payload;
        localStorage.setItem('tenant', JSON.stringify(action.payload)); // Consistent key
      })
      .addCase(fetchTenant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.tenant = null;
        localStorage.removeItem('tenant');
      })

      // Login user
      .addCase(loginTenant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginTenant.fulfilled, (state, action) => {
        state.loading = false;
        state.tenant = action.payload;
        localStorage.setItem('tenant', JSON.stringify(action.payload)); // Consistently use 'user'
      })
      .addCase(loginTenant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.tenant = null;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;