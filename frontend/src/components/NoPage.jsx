import React from "react";
import { Link } from "react-router-dom";
import pageNotFound from "@/assets/pageNotFound.svg";

const NoPage = () => {
  return (
    <div className="w-full h-full mx-auto">
      <div className="space-y-8 w-full h-[90vh] bg-white flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold">Page Not Found</h1>
        <img src={pageNotFound} alt="notfound" className="w-[500px]" />
        <Link to={"/"} className="bg-orange-400 text-white py-2 px-4 rounded">
          Go back
        </Link>
      </div>
    </div>
  );
};

export default NoPage;
