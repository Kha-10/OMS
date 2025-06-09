import * as React from "react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";

export function TeamSwitcher({ teams }) {
  const [activeTeam, setActiveTeam] = React.useState(teams[0]);
  const navigate = useNavigate();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div onClick={()=> navigate('/')}>
          <div>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div>
                <img src={activeTeam.logo} alt="logo" className="size-8" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {activeTeam.name}
                </span>
                <span className="truncate text-xs">{activeTeam.plan}</span>
              </div>
            </SidebarMenuButton>
          </div>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
