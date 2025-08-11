import {
  ShoppingCart,
  DollarSign,
  ListChecks,
  Plus,
  Boxes,
} from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import useAnalytics from "@/hooks/useAnalytics";
import { useNavigate } from "react-router-dom";

function TenantDashboard() {
  const { data } = useAnalytics();
  const navigate = useNavigate();
  console.log("data", data);
  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
        <StatsCard title="Orders" value={data?.orders} icon={ShoppingCart} />
        <StatsCard title="Low stock" value={data?.lowStockCount} icon={Boxes} />
        <StatsCard title="Sales" value={data?.revenue} icon={DollarSign} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Orders</h2>
            <button
              className="text-blue-600 hover:text-blue-700 font-medium"
              onClick={() => navigate("/addToCart")}
            >
              <Plus size={20} className="text-blue-600" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingCart size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="font-medium">
                  {data?.pendingOrders} pending orders
                </p>
                <p className="text-sm text-gray-500">Last 7 days</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="font-medium">
                  {data?.unpaidOrders} unpaid orders
                </p>
                <p className="text-sm text-gray-500">Last 7 days</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <ListChecks size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="font-medium">
                  {data?.completedOrders} Completed orders
                </p>
                <p className="text-sm text-gray-500">Last 7 days</p>
              </div>
            </div>
          </div>
        </div>
        {/* 
            <ItemList /> */}
      </div>
    </main>
  );
}

export default TenantDashboard;
