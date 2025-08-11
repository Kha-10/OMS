import axios from "../helper/axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "@/contexts/authContext";
import { useContext } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, User } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "@/features/tenants/tenantSlice";

function Navbar() {
  const navigate = useNavigate();
  // const { user, dispatch, setLoading } = useContext(AuthContext);
  const dispatch = useDispatch();
  const { recipes } = useSelector((state) => state.recipes);
  const { isNoti } = useSelector((state) => state.notifications);
  const { loading, tenant, error } = useSelector((state) => state.tenants);

  const isExpired = recipes.some((recipe) => recipe.status == "expired");

  const logoutHandler = async () => {
    try {
      // setLoading(true);

      const res = await axios.post("/api/users/logout");

      if (res.status === 200) {
        // dispatch({ type: "LOGOUT" });
        dispatch(logout());
        navigate("/tenant/sign-in");
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <nav className="w-full flex items-center justify-between p-2 bg-slate-50 border border-b fixed top-0 left-0 right-0 z-10">
      {tenant?.businessInfo && (
        <div className="text-xl font-semibold md:invisible">
          {tenant.businessInfo.name}
        </div>
      )}

      <ul className="flex space-x-10">
        {tenant && (
          <div className="flex items-center justify-center">
            <div className="relative inline-block cursor-pointer">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6 text-slate-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                />
              </svg>
              {isExpired && isNoti && (
                <span className="absolute top-0 right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="flex items-center gap-3 bg-transparent hover:bg-transparent outline-none focus-visible:ring-0 focus-visible:ring-offset-0">
                  <span className="text-base text-slate-700 font-normal capitalize">
                    {tenant.username}
                  </span>
                  <Avatar className="w-8 h-8">
                    {/* <AvatarImage src="https://github.com/shadcn.png" /> */}
                    <div className="bg-sky-400 rounded-full w-full h-full flex items-center justify-center">
                      {tenant.username.slice(0, 1).charAt(0).toUpperCase()}
                    </div>
                    {/* <AvatarFallback>{user.username}</AvatarFallback> */}
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mr-7">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logoutHandler}
                  className="cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        {!tenant && (
          <li>
            <a href="/sign-up">Sign up</a>
          </li>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;
