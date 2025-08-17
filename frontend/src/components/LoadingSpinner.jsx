import React from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import Loading from "../assets/loading.lottie";

export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-screen bg-white">
      <DotLottieReact src={Loading} loop autoplay  className="w-32 h-32" />
    </div>
  );
}
