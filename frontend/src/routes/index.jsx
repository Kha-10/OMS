import React, { useEffect } from "react";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import TenantDashboard from "@/Pages/TenantDashboard";
import Orders from "@/Pages/Orders.jsx";
import ProductsPage from "@/Pages/ProductsPage";
import CreateProduct from "@/Pages/CreateProduct";
import SignInForm from "@/Pages/SignInForm.jsx";
import CategoryPage from "@/Pages/Category";
import NewCategory from "@/Pages/NewCategory";
import Unauthorized from "@/components/Unauthorized";
import ResetPassword from "@/Pages/ResetPassword";
import ExpiredPage from "@/Pages/ExpiredPage";
import { useDispatch, useSelector } from "react-redux";
import { fetchTenant } from "@/features/tenants/tenantSlice";
import { fetchStore } from "@/features/stores/storeSlice";
import Layout from "@/Layout";
import CustomerPage from "@/Pages/CustomerPage";
import NewCustomer from "@/Pages/NewCustomer";
import CustomerProfile from "@/Pages/CustomerProfile";
import OrderDetailsPage from "@/Pages/OrderDetailsPage.jsx";
import OrderReceipt from "@/Pages/OrderReceipt";
import AddToCart from "@/Pages/AddtoCart";
import NotFound from "@/Pages/NotFound";
import Invoice from "@/Pages/Invoice";
import Onboarding from "@/Pages/Onboarding";

function index() {
  // const { user } = useContext(AuthContext);
  const dispatch = useDispatch();
  const { tenant, loading } = useSelector((state) => state.tenants);
  const { stores } = useSelector((state) => state.stores);

  useEffect(() => {
    dispatch(fetchTenant());
    dispatch(fetchStore());
  }, [dispatch]);

  const router = createBrowserRouter([
    // {
    //   path: "/",
    //   element: <Navigate to="/" />,
    // },
    {
      path: "/reset-password/:token",
      element: <ResetPassword />,
    },
    {
      path: "/reset-password",
      element: <ResetPassword />,
    },
    {
      path: "/expired-link",
      element: <ExpiredPage />,
    },
    {
      path: "/",
      element: <Layout />,
      children: [
        {
          path: "/",
          element: tenant ? (
            <TenantDashboard stores={stores} />
          ) : (
            <Navigate to={"/sign-in"} />
          ),
          // <ProtectedRoute allowedRoles={["tenant"]} redirectPath="/sign-in">
          //   <Home />
          // </ProtectedRoute>
        },
        // {
        //   path: "/tenant/reset-password",
        //   element: <ResetPassword/>,
        // },
        {
          path: "/orders",
          element: tenant ? <Orders /> : <Navigate to={"/sign-in"} />,
        },
        {
          path: "/addToCart",
          element: tenant ? <AddToCart /> : <Navigate to={"/sign-in"} />,
        },
        {
          path: "/addToCart/:id",
          element: tenant ? <AddToCart /> : <Navigate to={"/sign-in"} />,
        },
        {
          path: "/orders/:id",
          element: tenant ? <OrderDetailsPage /> : <Navigate to={"/sign-in"} />,
        },
        {
          path: "/invoice/:id",
          element: tenant ? <Invoice /> : <Navigate to={"/sign-in"} />,
        },
        {
          path: "/:tennantName/orders/:id",
          element: tenant ? <OrderReceipt /> : <Navigate to={"/sign-in"} />,
        },
        // {
        //   path: "/checkout",
        //   // element: tenant ? <CheckoutForm /> : <Navigate to={"/sign-in"} />,
        //   element: tenant ? <AddToCart /> : <Navigate to={"/sign-in"} />,
        // },
        // {
        //   path: "/checkout/:id",
        //   element: tenant ? <CheckoutForm /> : <Navigate to={"/sign-in"} />,
        // },
        {
          path: "/products",
          element: tenant ? <ProductsPage /> : <Navigate to={"/sign-in"} />,
        },
        {
          path: "/products/new",
          element: tenant ? <CreateProduct /> : <Navigate to={"/sign-in"} />,
        },
        {
          path: "/products/:id",
          element: tenant ? <CreateProduct /> : <Navigate to={"/sign-in"} />,
        },
        {
          path: "/categories",
          element: tenant ? <CategoryPage /> : <Navigate to={"/sign-in"} />,
        },
        {
          path: "/categories/new",
          element: tenant ? <NewCategory /> : <Navigate to={"/sign-in"} />,
        },
        {
          path: "/categories/:id",
          element: tenant ? <NewCategory /> : <Navigate to={"/sign-in"} />,
        },
        {
          path: "/customers",
          element: tenant ? <CustomerPage /> : <Navigate to={"/sign-in"} />,
        },
        {
          path: "/customers/manage",
          element: tenant ? <NewCustomer /> : <Navigate to={"/sign-in"} />,
        },
        {
          path: "/customers/manage/:id",
          element: tenant ? <NewCustomer /> : <Navigate to={"/sign-in"} />,
        },
        {
          path: "/customers/:id",
          element: tenant ? <CustomerProfile /> : <Navigate to={"/sign-in"} />,
        },
        {
          path: "/sign-in",
          element:
            !tenant || tenant?.onboarding_step < 7 ? (
              <SignInForm />
            ) : (
              <Navigate to={"/"} />
            ),
        },
        {
          path: "/sign-up",
          element:
            !tenant || tenant?.onboarding_step < 7 ? (
              <Onboarding
                stepper={tenant?.onboarding_step || 1}
                dbEmail={tenant?.email || ""}
                dbStoreId={stores?.[0]?._id}
                storeName={stores?.[0]?.name}
              />
            ) : (
              <Navigate to={"/"} />
            ),
        },
        {
          path: "forbidden",
          element: <Unauthorized />,
        },
        {
          path: "*",
          // element: <ErrorMessage />,
          element: tenant ? <NotFound /> : <Navigate to={"/sign-in"} />,
        },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}

export default index;
