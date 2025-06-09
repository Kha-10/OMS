import { ChevronRight } from "lucide-react";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useSidebar } from "@/components/ui/sidebar";

export function NavMain({ items }) {
  const location = useLocation();
  const pathname = location.pathname;

  const { setOpenMobile } = useSidebar();

  useEffect(() => {
    items.forEach((item) => {
      if (item.items?.some((subItem) => subItem.url === pathname)) {
        localStorage.setItem("activeCollapsible", item.title);
      }
    });
  }, [pathname, items]);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) =>
          item.items ? (
            <Collapsible
              key={item.title}
              defaultOpen={
                localStorage.getItem("activeCollapsible") === item.title ||
                item.items.some((subItem) => subItem.url === pathname)
              }
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    onClick={() => {
                      setOpenMobile(false);
                    }}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => {
                      // Determine the query parameters based on the URL
                      const modifiedUrl =
                        subItem.url === "/tenant/products" ||
                        subItem.url === "/tenant/orders"
                          ? `${
                              subItem.url
                            }?page=1&limit=10&sort=createdAt&sortDirection=desc${
                              subItem.url === "/tenant/orders"
                                ? "&filterRangeBy=orderDate"
                                : ""
                            }`
                          : subItem.url;

                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === subItem.url || pathname.startsWith(subItem.url)}
                            className="data-[active=true]:bg-blue-50 data-[active=true]:text-blue-600"
                          >
                            <Link
                              to={modifiedUrl}
                              onClick={() => setOpenMobile(false)}
                            >
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                {(() => {
                  const isActive =
                    pathname === item.url || pathname === "/tenant";
                  return (
                    <Link
                      to={item.url}
                      className={`flex items-center gap-2 w-full px-2 py-1 rounded-md ${
                        isActive
                          ? "bg-blue-50 text-blue-600"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  );
                })()}
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
