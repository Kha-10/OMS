import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { AuthContextProvider } from "./contexts/authContext.jsx";
import Routes from "./routes/index";
// import { Toaster } from "@/components/ui/toaster";
import { store } from "./store/store";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "react-toastify/dist/ReactToastify.css";
import { Toaster } from "sonner";
import { SocketProvider } from "./contexts/socketContext";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")).render(
  // <React.StrictMode>
  <>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <SocketProvider>
          <AuthContextProvider>
            <Routes />
            <Toaster position="top-center" />
          </AuthContextProvider>
        </SocketProvider>
      </QueryClientProvider>
    </Provider>
  </>
  // </React.StrictMode>
);
