import React from "react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function ProductsHeader({header,buttonText,context}) {
  const navigate = useNavigate();
  const [orderItems, setOrderItems] = useState([
    { name: "Burger", quantity: 1 },
    { name: "Fries", quantity: 2 },
    { name: "Coke", quantity: 1 },
  ]);
  const restaurantPage = "thevintift"; // Replace with actual Messenger page username

  // Generate Messenger link with dynamic order list
  const generateMessengerLink = () => {
    const orderMessage = orderItems
      .map((item) => `- ${item.name} x${item.quantity}`)
      .join("%0A"); // %0A is newline
    return `https://m.me/${restaurantPage}?text=Hello!%20I%20would%20like%20to%20order%3A%0A${orderMessage}`;
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold">{header}</h1>
      </div>
      <div className="flex items-center gap-2">
        {/* <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">
          Import
        </button> */}
        {/* <a
          href={generateMessengerLink()}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            padding: "10px 20px",
            backgroundColor: "#0084FF",
            color: "#fff",
            borderRadius: "5px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Order via Messenger
        </a>
        <a
          href={`https://business.facebook.com/latest/inbox/all/?nav_ref=manage_page_ap_plus_inbox_message_button&asset_id=100827985829848&mailbox_id=&selected_item_id=100024462432456&thread_type=FB_MESSAGE`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: "10px 20px",
            backgroundColor: "#0084FF",
            color: "#fff",
            borderRadius: "5px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Open Messenger
        </a> */}
        <button
          onClick={() => navigate(`/${buttonText}/${context}`)}
          className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-700 rounded-lg font-medium"
        >
          Add {buttonText}
        </button>
      </div>
    </div>
  );
}
