import React from "react";
import { toast } from "sonner";
import { CircleCheck, Loader, XIcon, XCircle } from "lucide-react";

// 1. Fully custom Toast component
export default function NewToaster({ id, title, type = "loading" }) {
  const borderColor =
    type === "success"
      ? "border-l-4 border-green-400"
      : type === "error"
      ? "border-l-4 border-red-400"
      : "border-l-4 border-gray-400";

  const iconColor =
    type === "success"
      ? "text-green-400"
      : type === "error"
      ? "text-red-400"
      : "text-gray-400";
  // Icon based on type
  const Icon =
    type === "success" ? CircleCheck : type === "error" ? XCircle : Loader;

  return (
    <div
      className={`flex rounded-lg bg-white shadow-lg ring-1 ring-black/5 w-full md:max-w-[500px] lg:max-w-[600px] items-center p-4 ${borderColor}`}
    >
      <div className="flex flex-1 items-center gap-3">
        {" "}
        <Icon className={`h-6 w-6 ${iconColor}`} />
        <div className="w-full">
          <p className="text-sm font-medium text-gray-900">{title}</p>
        </div>
      </div>
      <button
        onClick={() => toast.dismiss(id)}
        className="ml-4 shrink-0 rounded p-1 hover:bg-gray-100 flex items-center justify-center"
      >
        <XIcon className="h-3 w-3 text-gray-500" />
      </button>
    </div>
  );
}

export function showToast({ title, type = "loading" }) {
  console.log("title",title);
  return toast.custom((id) => <NewToaster id={id} title={title} type={type} />);
}
