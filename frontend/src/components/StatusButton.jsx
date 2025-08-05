import React from "react";
import { Button } from "./ui/button";

const StatusButton = ({status}) => {
  return (
    <Button
      variant="outline"
      className="bg-gray-200 hover:bg-gray-200 text-gray-700 border-gray-300 w-full sm:w-auto"
    >
      {status} <ChevronDown className="ml-2 h-4 w-4" />
    </Button>
  );
};

export default StatusButton;
