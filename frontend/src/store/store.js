import { configureStore } from "@reduxjs/toolkit";
import recipesReducer from "../features/recipe/recipeSlice";
import notificationsReducer from "../features/recipe/notificationSlice";
import superadminReducer from "../features/superadmin/superadminSlice";
import authReducer from "../features/tenants/tenantSlice";
import storeReducer from "../features/stores/storeSlice";

export const store = configureStore({
  reducer: {
    recipes: recipesReducer,
    notifications: notificationsReducer,
    superadmins: superadminReducer,
    tenants: authReducer,
    stores: storeReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: true, // Enable thunk for handling async actions
    }),
});
