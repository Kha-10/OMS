import { configureStore } from '@reduxjs/toolkit'
import recipesReducer from '../features/recipe/recipeSlice';
import notificationsReducer from '../features/recipe/notificationSlice'
import superadminReducer from '../features/superadmin/superadminSlice';
import authReducer from "../features/tenants/tenantSlice"

export const store = configureStore({
  reducer: {
    recipes: recipesReducer,
    notifications : notificationsReducer,
    superadmins : superadminReducer,
    tenants : authReducer,
  },
  middleware: (getDefaultMiddleware) =>
  getDefaultMiddleware({
    thunk: true, // Enable thunk for handling async actions
  }),
})