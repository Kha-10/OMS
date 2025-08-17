import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Thunk for fetching the user from the API
export const fetchTenant = createAsyncThunk(
  "auth/fetchTenants",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios("/api/users/me");
      console.log("response", response);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.msg || "Something went wrong"
      );
    }
  }
);

// Thunk for logging in the user
export const loginTenant = createAsyncThunk(
  "auth/loginTenant",
  async (data, { rejectWithValue }) => {
    try {
      const response = await axios.post("/api/users/login", data, {
        withCredentials: true,
      });
      console.log("login", response.data); // For debugging purposes
      return response.data; // Assuming superAdmin info is returned
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Failed to log in");
    }
  }
);

export const logoutTenant = createAsyncThunk(
  "auth/logoutTenant",
  async (_, { rejectWithValue }) => {
    try {
      await axios.post("/api/users/logout", null, {
        withCredentials: true, // if you need cookies sent
      });
      // No payload needed on success
      return { success: true };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Failed to logout");
    }
  }
);

export const registerTenant = createAsyncThunk(
  "auth/registerTenant",
  async (data, { rejectWithValue }) => {
    try {
      const res = await axios.post("/api/users/register", data, {
        withCredentials: true, // if you need cookies sent
      });
      // No payload needed on success
      return res.data;
    } catch (error) {
      console.log("registerTenant", error);
      return rejectWithValue(
        error.response?.data?.error ||
          error.response?.data?.errors ||
          "Failed to register"
      );
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    tenant: null,
    loading: false,
    error: null,
  },
  reducers: {},
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
        // localStorage.setItem("tenant", JSON.stringify(action.payload)); // Consistent key
      })
      .addCase(fetchTenant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.tenant = null;
        // localStorage.removeItem("tenant");
      })

      // Login user
      .addCase(loginTenant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginTenant.fulfilled, (state, action) => {
        state.loading = false;
        state.tenant = action.payload;
        // localStorage.setItem("tenant", JSON.stringify(action.payload)); // Consistently use 'user'
      })
      .addCase(loginTenant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.tenant = null;
      })

      .addCase(logoutTenant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logoutTenant.fulfilled, (state) => {
        state.loading = false;
        state.tenant = null;
        // localStorage.removeItem("tenant");
      })
      .addCase(logoutTenant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(registerTenant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerTenant.fulfilled, (state, action) => {
        state.loading = false;
        state.tenant = action.payload;
        // localStorage.removeItem("tenant");
      })
      .addCase(registerTenant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// export const { logout } = authSlice.actions;
export default authSlice.reducer;
