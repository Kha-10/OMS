import { cn } from "@/lib/utils";

export default function StatusBadge ({ status }) {
  const getStatusStyles = () => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-500";
      case "Pending":
        return "bg-gray-100 text-gray-500";
      case "Confirmed":
        return "bg-yellow-100 text-yellow-500";
      case "Cancelled":
        return "bg-red-100 text-red-500";
      case "Paid":
        return "bg-green-100 text-green-500";
      case "Unpaid":
        return "bg-red-100 text-red-500";
      case "Confirming Payment":
        return "bg-blue-100 text-blue-500";
      case "Partially Paid":
        return "bg-yellow-100 text-yellow-500";
      case "Refunded":
        return "bg-orange-100 text-orange-500";
      case "Fulfilled":
        return "bg-green-100 text-green-500";
      case "Unfulfilled":
        return "bg-red-100 text-red-500";
      case "Ready":
        return "bg-blue-100 text-blue-500";
      case "Out For Delivery":
        return "bg-orange-100 text-orange-500";
      default:
        return "bg-gray-100 text-gray-500";
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
        getStatusStyles()
      )}
    >
      {status}
    </span>
  );
}