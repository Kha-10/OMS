import { createSlice } from "@reduxjs/toolkit";

const notificationsSlice = createSlice({
  name: "notifications",
  initialState: {
    isNoti: true,
  },
  reducers: {
    setIsNoti: (state) => {
      state.isNoti = false;
    },
  },
});

export const { setIsNoti } = notificationsSlice.actions;
export default notificationsSlice.reducer;
