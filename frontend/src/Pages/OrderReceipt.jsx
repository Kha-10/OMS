import { Edit, Printer, Download, CreditCard } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import useOrders from "@/hooks/useOrders";
import { useSelector } from "react-redux";
import { format, parseISO } from "date-fns";

export default function OrderReceipt() {
  const { id } = useParams();
  const { tenant } = useSelector((state) => state.tenants);

  const { data: order = [], isPending: isLoading } = useOrders({ id });

  console.log(order);
  console.log(tenant);
  return (
    <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
      <div className="w-full max-w-lg mx-auto bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-xl overflow-hidden">
        <div className="p-6">
          <div className="flex justify-end space-x-4 mb-6">
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
              <Edit className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
              <Printer className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
              <Download className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
              <CreditCard className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-8">
            <div className="inline-block px-3 py-1 bg-red-50 text-red-500 text-sm font-medium rounded-lg mb-6 shadow-sm">
              {order.status}
            </div>

            <h1 className="text-3xl font-bold mb-1">{tenant.name}</h1>
            <Link
              href="https://take.app/molly"
              className="text-blue-500 hover:underline"
            >
              take.app/molly
            </Link>
            <p className="text-gray-700 mt-1">+66 62 947 4106</p>
          </div>

          <div className="border-t border-gray-200 pt-4 mb-6">
            <div className="grid grid-cols-2 gap-1 mb-1">
              <span className="text-gray-500">Invoice No</span>
              <span className="font-medium">#{order.invoiceNumber}</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <span className="text-gray-500">Order date</span>
              <span className="font-medium">
                {" "}
                {order?.date
                  ? format(parseISO(order.date), "dd MMMM yyyy, h:mm a")
                  : ""}
              </span>
            </div>
          </div>

          <div className="mb-6 bg-gray-50 p-4 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Items</h2>
            {order.items.length > 0 &&
              order.items.map((item) => (
                <div className="mb-6" key={item._id}>
                  <div className="flex justify-between mb-1">
                    <div>
                      <Link to={`/products/${item._id}`} className="text-blue-500 hover:underline">
                        {item.name}{" "}
                        {item.selectedVariant.length > 0 && (
                          <span>{item.selectedVariant[0].name}</span>
                        )}
                      </Link>
                      <span className="ml-2 px-1.5 py-0.5 bg-white text-gray-700 text-xs rounded-md shadow-sm">
                        G3
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-start mt-2">
                    <div className="flex-1">
                      <div className="flex items-start">
                        <span className="text-gray-700 mr-2">
                          {item.quantity} x
                        </span>
                        <ul className="text-gray-700">
                          {item?.selectedOptions?.length > 0 &&
                            item.selectedOptions.map((addon, i) => (
                              <div key={i}>
                                <li className="flex items-start">
                                  <span className="mr-1">•</span>
                                  <span>{addon.selectedOptionName} :</span>
                                </li>
                                <li className="ml-4">
                                  {addon.name} {addon.amount} (1)
                                </li>
                              </div>
                            ))}
                          {item?.selectedNumberOption?.length > 0 &&
                            item?.selectedNumberOption.map((opt, i) => (
                              <div key={i}>
                                <li className="flex items-start">
                                  <span className="mr-1">•</span>
                                  <span>{opt.name} :</span>
                                </li>
                                <li className="ml-4">{opt.amount}</li>
                              </div>
                            ))}
                        </ul>
                      </div>
                    </div>
                    <div className="text-right font-medium">
                      {item.quantity * item.price}
                    </div>
                  </div>
                </div>
              ))}

            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between mb-2">
                <span>Items total ({order.items.length})</span>
                <span className="font-medium">{order.totalAmount}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 mb-6 px-4">
            <div className="flex justify-between mb-2">
              <span>Subtotal</span>
              <span className="font-medium">{order.totalAmount}</span>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 mb-6 bg-blue-50 p-4 rounded-lg shadow-sm">
            <div className="flex justify-between mb-2">
              <span className="font-semibold">Total</span>
              <span className="font-semibold">{order.totalAmount}</span>
            </div>
          </div>

          <div className="pt-4 bg-gray-50 p-4 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Order Details</h2>

            <div className="mb-4 bg-white p-3 rounded-lg shadow-sm">
              <h3 className="text-gray-500 mb-1">Customer</h3>
              <p className="font-medium">{order.customer.name} / {order.customer.phoneNumber}</p>
            </div>

            <div className="bg-white p-3 rounded-lg shadow-sm">
              <h3 className="text-gray-500 mb-1">Service</h3>
              <p className="font-medium">{order.servicePrice}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
