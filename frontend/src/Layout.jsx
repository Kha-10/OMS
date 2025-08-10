import { Sidebar } from "@/components/Sidebar";
import { useState } from "react";
import { Outlet } from "react-router-dom";
// import InitialLoading from "./components/InitialLoading";
import Nav from "./components/Nav";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";

export default function RootLayout() {
  const { loading, tenant, error } = useSelector((state) => state.tenants);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const pathnames = location.pathname;

  const excludedPrefixes = ["/checkout", `/addToCart`];

  const includedPrefixes = [
    "/",
    `/orders`,
    "/categories",
    "/products",
    "/customers",
  ];

  const isExcluded = excludedPrefixes.some((prefix) =>
    pathnames.startsWith(prefix)
  );

  const isIncluded = includedPrefixes.some((prefix) => {
    if (prefix === "/") {
      return pathnames === "/";
    }
    return pathnames.startsWith(prefix);
  });


  const showSidebar = !isExcluded && isIncluded;

  //   if (loading) {
  //     return <InitialLoading />;
  //   }

  return tenant ? (
    <div className="flex min-h-screen">
      {showSidebar && (
        <div className="fixed left-0 top-0 bottom-0 z-10">
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </div>
      )}
      <div className={`flex-1 ${showSidebar ? "lg:ml-64" : ""}`}>
        {showSidebar && <Nav onOpenSidebar={() => setSidebarOpen(true)} />}

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div
            className={`${
              !showSidebar
                ? "w-full mx-auto"
                : "max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 overflow-y-auto min-h-screen"
            }`}
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  ) : (
    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
        {/* Show only content when tenant does not exist */}
      </div>
    </main>
  );
}
