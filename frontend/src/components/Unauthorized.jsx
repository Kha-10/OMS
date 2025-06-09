import React from "react";
import { Link } from "react-router-dom";
import forbidden from "@/assets/forbidden.svg";

const Unauthorized = () => {
  return (
    <div className="w-full h-full mx-auto">
      <div className="space-y-8 w-full h-[90vh] bg-white flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold">403</h1>
        <img src={forbidden} alt="notfound" className="w-[400px]" />
        <div className=" text-center">
          <h3 className="text-xl font-bold mb-5">Access Denied</h3>
          <Link to={"/SuperAdmin"} className="bg-orange-400 text-white py-2 px-4 rounded">
            Go back
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
