import React from "react";

export default function OrderHeader({header = "Orders",buttonText = "Add order"}) {

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold">{header}</h1>
      </div>
      <div className="flex items-center gap-2">
        <button
          className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-700 rounded-lg font-medium"
        >
          Add {buttonText}
        </button>
      </div>
    </div>
  );
}