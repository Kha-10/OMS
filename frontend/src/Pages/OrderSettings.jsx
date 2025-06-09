import { useState } from "react";
import delivery from "@/assets/delivery.svg";
import promotion from "@/assets/promotion.svg";
import { useNavigate } from "react-router-dom";

function OrderSettings() {
  const navigate = useNavigate();
  return (
    <div className="max-w-screen-lg h-full mx-auto flex items-start gap-5 mt-5">
      <button
        type="button"
        onClick={() => navigate("/Order_Settings/Delivery_Settings")}
        className="bg-white border border-slate-200 rounded-lg w-[300px] space-y-8 p-3"
      >
        <p className="text-base font-semibold text-left">Delivery zone</p>
        <img src={delivery} alt="delivery icon" className="w-28" />
        <p className="text-sm text-wrap text-left text-slate-400">
          Set your delivery zone and its price
        </p>
      </button>
      <button
        type="button"
        onClick={() => navigate("/Order_Settings/Promotions")}
        className="bg-white border border-slate-200 rounded-lg w-[300px] space-y-8 p-3"
      >
        <p className="text-base font-semibold text-left">Promotions</p>
        <img src={promotion} alt="delivery icon" className="w-28" />
        <p className="text-sm text-wrap text-left text-slate-400">
          Create your promotion
        </p>
      </button>
    </div>
  );
}

export default OrderSettings;