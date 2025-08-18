import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const fetchStore = createAsyncThunk(
  "auth/stores",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios("/api/stores");
      console.log(response.data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.msg || "Something went wrong"
      );
    }
  }
);

const storeSlice = createSlice({
  name: "stores",
  initialState: {
    stores: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch user
      .addCase(fetchStore.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStore.fulfilled, (state, action) => {
        state.loading = false;
        state.stores = action.payload;
      })
      .addCase(fetchStore.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.stores = null;
      });
  },
});

export default storeSlice.reducer;
