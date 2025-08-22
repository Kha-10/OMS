import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "@/helper/axios";

export const discardCart = createAsyncThunk("cart/discard", async (storeId) => {
  const cartId = sessionStorage.getItem("adminCartId");
  if (!cartId) {
    return;
  }
  const res = await axios.delete(
    `/api/stores/${storeId}/orders/${cartId}/discard`
  );

  if (res.status === 200) {
    sessionStorage.removeItem("adminCartId");
    sessionStorage.removeItem("idempotencyKey");
  }
  return res.data;
});

const cartSlice = createSlice({
  name: "carts",
  initialState: {
    isDiscarding: false,
    discardSuccess: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(discardCart.pending, (state) => {
        state.isDiscarding = true;
        state.discardSuccess = false;
      })
      .addCase(discardCart.fulfilled, (state) => {
        state.isDiscarding = false;
        state.discardSuccess = true;
      })
      .addCase(discardCart.rejected, (state) => {
        state.isDiscarding = false;
      });
  },
});

export default cartSlice.reducer;
