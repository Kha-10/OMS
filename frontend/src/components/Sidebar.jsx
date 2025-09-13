import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  Home,
  Package,
  ShoppingCart,
  Users,
  ExternalLink,
  X,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSelector } from "react-redux";
import useOrders from "@/hooks/useOrders";

// const apps = [
//   {
//     title: "Discounts",
//     to: "/discounts",
//     icon: <Tag className="h-5 w-5" />,
//     badge: "PREMIUM",
//   },
//   {
//     title: "Reviews",
//     to: "/reviews",
//     icon: <MessageSquare className="h-5 w-5" />,
//     badge: "PREMIUM",
//   },
//   {
//     title: "Analytics",
//     to: "/analytics",
//     icon: <BarChart className="h-5 w-5" />,
//     badge: "PREMIUM",
//   },
//   {
//     title: "Pages",
//     to: "/pages",
//     icon: <FileText className="h-5 w-5" />,
//     badge: "PREMIUM",
//   },
//   {
//     title: "Booking",
//     to: "/booking",
//     icon: <Calendar className="h-5 w-5" />,
//     badge: "PREMIUM",
//   },
//   {
//     title: "WhatsApp Business",
//     to: "/whatsapp",
//     icon: <Phone className="h-5 w-5" />,
//     badge: "BUSINESS",
//   },
//   {
//     title: "Marketing",
//     to: "/marketing",
//     icon: <Megaphone className="h-5 w-5" />,
//   },
// ];

function NavItem({ item, onItemClick, pendingOrders }) {
  const location = useLocation();
  const pathname = location.pathname;
  const navigate = useNavigate();

  const normalizedItemTo = item.to.split("?")[0];
  const pathnameWithoutQuery = pathname.split("?")[0];

  const matchNested = item.title !== "Dashboard";

  let isActive = false;

  if (item.submenu) {
    isActive =
      item.submenu.some((subitem) =>
        pathnameWithoutQuery.startsWith(subitem.to.split("?")[0])
      ) || pathnameWithoutQuery.startsWith(normalizedItemTo + "/");
  } else if (matchNested) {
    isActive =
      pathnameWithoutQuery === normalizedItemTo ||
      pathnameWithoutQuery.startsWith(normalizedItemTo + "/");
  } else {
    isActive = pathnameWithoutQuery === normalizedItemTo;
  }

  const [isOpen, setIsOpen] = useState(isActive);

  useEffect(() => {
    setIsOpen(isActive);
  }, [isActive]);

  const handleClick = (to) => {
    navigate(to);
    onItemClick();
  };

  if (item.submenu) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-100 rounded-lg transition-colors">
          <div className="flex items-center gap-3">
            <div className={cn("text-gray-500", isActive && "text-blue-600")}>
              {item.icon}
            </div>
            <span
              className={cn(
                "text-gray-700",
                isActive && "text-blue-600 font-medium"
              )}
            >
              {item.title}
            </span>
          </div>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-500" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="ml-4 border-l border-gray-200 pl-4 py-1">
            {item.submenu.map((subitem) => {
              const basePath = subitem.to.split("?")[0];
              return (
                <button
                  key={subitem.to}
                  onClick={() => {
                    handleClick(subitem.to);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center justify-between transition-colors",
                    pathname.startsWith(basePath)
                      ? "bg-gray-100 text-blue-600 font-medium"
                      : ""
                  )}
                >
                  {subitem.title}{" "}
                  {item.title === "Orders" && subitem.title === "All" ? (
                    <Badge variant="destructive">{pendingOrders?.length}</Badge>
                  ) : (
                    ""
                  )}
                </button>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <button
      onClick={() => handleClick(item.to)}
      className={cn(
        "flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-100 rounded-lg transition-colors",
        isActive && "bg-gray-100"
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn("text-gray-500", isActive && "text-blue-600")}>
          {item.icon}
        </div>
        <span
          className={cn(
            "text-gray-700",
            isActive && "text-blue-600 font-medium"
          )}
        >
          {item.title}
        </span>
      </div>
      {item.badge && (
        <Badge
          variant="outline"
          className="bg-gray-100 text-xs font-medium border-gray-200 text-gray-600"
        >
          {item.badge}
        </Badge>
      )}
    </button>
  );
}

export function Sidebar({ open, onClose }) {
  const { tenant } = useSelector((state) => state.tenants);
  const { storeId } = useParams();
  const { data } = useOrders({});
  const ordersData = data?.data;

  const pendingOrders = ordersData?.filter(
    (order) => order.orderStatus === "Pending"
  );

  const navigation = [
    {
      title: "Dashboard",
      to: `/stores/${storeId}`,
      icon: <Home className="h-5 w-5" />,
    },
    {
      title: "Orders",
      to: `/stores/${storeId}/orders`,
      icon: <ShoppingCart className="h-5 w-5" />,
      submenu: [
        { title: "All", to: `/stores/${storeId}/orders` },
        // { title: "Summary", to: "/orders/summary" },
      ],
    },
    {
      title: "Products",
      to: `/stores/${storeId}/products`,
      icon: <Package className="h-5 w-5" />,
      submenu: [
        {
          title: "All",
          to: `/stores/${storeId}/products?page=1&limit=10&sortBy=createdAt&sortDirection=desc`,
        },
        {
          title: "Category",
          to: `/stores/${storeId}/categories`,
        },
      ],
    },
    {
      title: "Customers",
      to: `/stores/${storeId}/customers?page=1&limit=10&sortBy=createdAt&sortDirection=desc`,
      icon: <Users className="h-5 w-5" />,
    },
    // {
    //   title: "Design",
    //   to: "/design",
    //   icon: <Paintbrush className="h-5 w-5" />,
    // },
    // {
    //   title: "Settings",
    //   to: "/settings",
    //   icon: <Settings className="h-5 w-5" />,
    // },
  ];
  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-white min-h-screen transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:w-64",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full flex flex-col">
          <div className="p-4 flex items-center justify-between border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <a
                  href={`https://sellpoint.nexoradigital.site/${tenant?.store?.store?.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 font-medium text-blue-500"
                >
                  {tenant?.store?.store?.name}
                  <ExternalLink size={16} className="text-blue-500" />
                </a>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="flex-1 overflow-y-auto p-2">
            {navigation.map((item) => (
              <NavItem
                key={item.to}
                item={item}
                onItemClick={onClose}
                pendingOrders={pendingOrders}
              />
            ))}
          </nav>
          {/* <div className="p-4 border-t border-gray-200">
            <div className="text-sm font-medium text-gray-500 mb-2 px-2">
              Apps
            </div>
            <nav className="space-y-1">
              {apps.map((item) => (
                <NavItem key={item.to} item={item} onItemClick={onClose} />
              ))}
            </nav>
          </div> */}
        </div>
      </div>
    </>
  );
}
