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

  const excludedPrefixes = ['/checkout', `/${tenant?.name}/orders`];

  const isExcluded = excludedPrefixes.some(prefix => pathnames.startsWith(prefix));
  
  const showSidebar = !isExcluded;
  

//   if (loading) {
//     return <InitialLoading />;
//   }

  return tenant ? (
    <div className="flex h-screen">
      {showSidebar && (
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {showSidebar && (
          <Nav onOpenSidebar={() => setSidebarOpen(true)} />
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div
            className={`${
              !showSidebar
                ? "w-full mx-auto"
                : "max-w-7xl mx-auto py-6 sm:px-6 lg:px-8"
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