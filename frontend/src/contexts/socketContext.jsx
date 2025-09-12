import { createContext } from "react";
import { useSelector } from "react-redux";
import socket from "@/helper/io";
import useOrders from "@/hooks/useOrders";
import { useEffect } from "react";
import { showToast } from "@/components/NewToaster";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { stores } = useSelector((state) => state.stores);
  const storeId = stores?.[0]?._id;

  const { refetch } = useOrders({});
  useEffect(() => {
    if (!storeId) return;

    socket.emit("join_store", storeId);

    socket.on("new-order", (order) => {
      console.log("New order received:", order);
      showToast({
        title: "New order received!",
        type: "success",
        description: `Order # ${order.orderNumber} (${order.customerName})`,
      });
      refetch();
    });

    return () => {
      socket.off("new-order");
    };
  }, [storeId]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};
