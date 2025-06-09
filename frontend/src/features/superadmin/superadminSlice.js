import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../helper/axios";

// Async thunk for fetching current user
export const fetchSuperAdmin = createAsyncThunk(
  "auth/fetchSuperAdmin",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios("/api/superAdmin/me");
      return response.data; 
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.msg || "Failed to fetch user"
      );
    }
  }
);

// Async thunk for logging in
export const loginSuperAdmin = createAsyncThunk(
  "auth/loginSuperAdmin",
  async (data, { rejectWithValue }) => {
    try {
      const response = await axios.post("/api/superAdmin/login", data, {
        withCredentials: true,
      });
      return response.data.superAdmin;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Failed to log in");
    }
  }
);

const superAdminAuthSlice = createSlice({
  name: "superAdmin",
  initialState: {
    superAdmin: JSON.parse(localStorage.getItem('superAdmin')) || null,
    superAdminLoading: false,
    superAdminError: null,
  },
  reducers: {
    logout: (state) => {
      state.superAdmin = null;
      localStorage.removeItem("superAdmin");
    },
  },
  extraReducers: (builder) => {
    // Fetch user
    builder
      .addCase(fetchSuperAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSuperAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.superAdmin = action.payload;
        localStorage.setItem("superAdmin", JSON.stringify(action.payload));
      })
      .addCase(fetchSuperAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.superAdmin = null;
        localStorage.removeItem("superAdmin");
      })
      // Login user
      .addCase(loginSuperAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginSuperAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.superAdmin = action.payload;
        localStorage.setItem("superAdmin", JSON.stringify(action.payload));
      })
      .addCase(loginSuperAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.superAdmin = null;
      });
  },
});

export const { logout } = superAdminAuthSlice.actions;
export default superAdminAuthSlice.reducer;