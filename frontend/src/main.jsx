import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { AuthContextProvider } from "./contexts/authContext.jsx";
import Routes from "./routes/index";
import { Toaster } from "@/components/ui/toaster";
import { store } from "./store/store";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "react-toastify/dist/ReactToastify.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")).render(
  // <React.StrictMode>
  <>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthContextProvider>
          <Routes />
          <Toaster />
        </AuthContextProvider>
      </QueryClientProvider>
    </Provider>
  </>
  // </React.StrictMode>
);
