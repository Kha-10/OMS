import { Eye, ShoppingCart, DollarSign } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";

function TenantDashboard() {
  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
        <StatsCard title="Views" value="10" icon={Eye} />
        <StatsCard title="Orders" value="2" icon={ShoppingCart} />
        <StatsCard title="Sales" value="฿0.00" icon={DollarSign} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Orders</h2>
            <button className="text-blue-600 hover:text-blue-700 font-medium">
              View all
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingCart size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="font-medium">2 pending orders</p>
                <p className="text-sm text-gray-500">Last 30 days</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="font-medium">2 unpaid orders</p>
                <p className="text-sm text-gray-500">Last 30 days</p>
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
