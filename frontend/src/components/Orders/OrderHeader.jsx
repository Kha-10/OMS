import React from "react";
import { Link } from "react-router-dom";

export default function OrderHeader({ storeId }) {
  return (
    <div className="flex items-center justify-between max-w-[378px] sm:max-w-2xl lg:max-w-7xl min-w-full">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold">Orders</h1>
      </div>
      <div className="flex items-center gap-2">
        <Link
          to={`/stores/${storeId}/addToCart`}
          className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-700 rounded-lg font-medium"
        >
          Add orders
        </Link>
      </div>
    </div>
  );
}
