import { toast } from "react-toastify";

export const showToast = (toastId, message, type = "success") => {
  toast.update(toastId, {
    render: message,
    type,
    isLoading: false,
    autoClose: 3000,
    closeOnClick: true,
    draggable: true,
    position: "top-center",
  });
};

export const successToast = (message) => {
  console.log('gg');
  toast.success(message, {
    position: "top-center",
    autoClose: 3000,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

export const errorToast = (message) => {
  toast.error(message || "Something went wrong", {
    position: "top-center",
    autoClose: 4000,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};
