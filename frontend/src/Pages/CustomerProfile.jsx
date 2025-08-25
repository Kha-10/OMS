import { ArrowLeft, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useCustomers from "@/hooks/useCustomers";
import useCustomerActions from "@/hooks/useCustomerActions";
import { showToast } from "@/components/NewToaster";
import { format } from "date-fns";
import StatusBadge from "@/components/StatusBadge";

export default function CustomerProfile() {
  const [copied, setCopied] = useState(false);
  const [whatsAppOpen, setWhatsAppOpen] = useState(false);
  const whatsAppButtonRef = useRef(null);
  const { id } = useParams();

  const { data } = useCustomers({ id });
  const navigate = useNavigate();

  const copyToClipboard = () => {
    navigator.clipboard.writeText("+95 9 892 108660");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        whatsAppButtonRef.current &&
        !whatsAppButtonRef.current.contains(event.target)
      ) {
        setWhatsAppOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const { deleteMutation } = useCustomerActions(null);

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(
      { selectedCustomers: [id] },
      {
        onSuccess: () => {
          navigate("/customers");
        },
      }
    );
    showToast({
      title: "Successfully deleted customers",
      type: "success",
    });
  };
  console.log(data);
  return (
    <div className="max-w-6xl mx-auto p-4 bg-white rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">{data?.name}</h1>
        </div>
        <div className="flex gap-2">
          {/* <div className="relative" ref={whatsAppButtonRef}>
            <Button
              variant="outline"
              className="flex items-center gap-1 bg-gray-50 hover:bg-gray-100"
              onClick={() => setWhatsAppOpen(!whatsAppOpen)}
            >
              WhatsApp
              <ChevronDown className="h-4 w-4" />
            </Button>

            {whatsAppOpen && (
              <div className="absolute right-0 mt-1 w-[220px] bg-white rounded-md shadow-lg border z-10">
                <div className="py-2 text-sm">
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-50">
                    Send order detail
                  </button>
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-50">
                    Send review request
                  </button>
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-50">
                    Send payment reminder
                  </button>
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center">
                    <span className="inline-flex items-center justify-center w-5 h-5 mr-2">
                      +
                    </span>
                    Add custom template
                  </button>
                </div>
              </div>
            )}
          </div> */}
          <Button
            variant="outline"
            className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100"
            type="button"
            onClick={handleDelete}
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="text-gray-500 mb-4">Last order 28 Mar 2025</div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column - 2/3 width */}
        <div className="md:col-span-2 space-y-6">
          {/* Order Summary */}
          <Card className="p-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-gray-500 mb-1">Orders</div>
                <div className="text-2xl font-semibold">
                  {data?.summary?.orderQuantity}
                </div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">Average order value</div>
                <div className="text-2xl font-semibold">
                  {data?.summary?.averageOrderValue}
                </div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">Total spent</div>
                <div className="text-2xl font-semibold">
                  {data?.summary?.totalSpent}
                </div>
              </div>
            </div>
          </Card>

          {/* Accounts Receivable */}
          <Card>
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">Accounts receivable</h2>
              <Button variant="ghost" className="text-blue-600">
                Print
              </Button>
            </div>

            <div className="divide-y">
              {data?.accountsReceivable.length > 0 &&
                data?.accountsReceivable.map((order) => (
                  <OrderItem
                    number={order.orderNumber}
                    status={order.orderStatus}
                    statusColor="bg-green-100 text-green-700"
                    tags={[
                      { label: "UNPAID", icon: "document" },
                      { label: `${order.fulfillmentStatus}`, icon: "truck" },
                    ]}
                    date={order.createdAt}
                    amount={order.pricing.finalTotal}
                  />
                ))}
            </div>
          </Card>

          {/* Recent Orders */}
          <Card>
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Recent orders</h2>
            </div>

            <div className="divide-y">
              {data?.recentOrders.length > 0 &&
                data?.recentOrders.map((order) => (
                  <OrderItem
                    number={order.orderNumber}
                    status={order.orderStatus}
                    statusColor="bg-green-100 text-green-700"
                    tags={[
                      { label: "UNPAID", icon: "document" },
                      { label: `${order.fulfillmentStatus}`, icon: "truck" },
                    ]}
                    date={order.createdAt}
                    amount={order.pricing.finalTotal}
                  />
                ))}
            </div>
          </Card>
        </div>

        {/* Right column - 1/3 width */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">Customer info</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/customers/manage/${id}`)}
              >
                Edit
              </Button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <div className="text-gray-500 mb-1">Phone</div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">{data?.phone}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={copyToClipboard}
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* <div>
                <div className="text-gray-500 mb-1">Tags</div>
                <div className="flex gap-2">
                  <Badge
                    variant="outline"
                    className="bg-gray-100 hover:bg-gray-100"
                  >
                    PM
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-gray-100 hover:bg-gray-100"
                  >
                    LC
                  </Badge>
                </div>
              </div> */}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function OrderItem({ number, status, statusColor, tags, date, amount }) {
  return (
    <div className="p-4 flex items-center justify-between">
      <div>
        <div className="flex items-center gap-4 mb-1">
          <span className="text-blue-600 font-medium">#{number}</span>
          <Badge className={`font-normal ${statusColor}`}>{status}</Badge>

          {tags.map((tag, index) => (
            <div
              key={index}
              className="flex items-center gap-1 text-gray-500 text-sm"
            >
              {tag.icon === "document" && (
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="4"
                    y="2"
                    width="16"
                    height="20"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M8 7H16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M8 12H16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M8 17H12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              )}
              {tag.icon === "truck" && (
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M16 16V4H3V16H16Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 8H20L22 10V16H16V8Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="6"
                    cy="19"
                    r="2"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <circle
                    cx="19"
                    cy="19"
                    r="2"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              )}
              {tag.icon === "package" && (
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 12L20 7.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 12V21"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 12L4 7.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              <StatusBadge status={tag.label} />
            </div>
          ))}
        </div>
        <div className="text-gray-500 mt-2 text-sm">
          {" "}
          {format(date, "dd MMMM yyyy, h:mm a")}
        </div>
      </div>
      <div className="font-semibold">${amount}</div>
    </div>
  );
}
