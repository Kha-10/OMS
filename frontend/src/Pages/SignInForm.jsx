import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { DevTool } from "@hookform/devtools";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginTenant } from "@/features/tenants/tenantSlice";
import { fetchStore } from "@/features/stores/storeSlice";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import logo from "@/assets/logo2.png";
import { toast } from "sonner";
import NewToaster from "@/components/NewToaster";

const formSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);

  let navigate = useNavigate();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { loading } = useSelector((state) => state.tenants);

  const dispatch = useDispatch();

  const onSubmit = async (data) => {
    try {
      const user = await dispatch(loginTenant(data)).unwrap();
      if (user) {
        dispatch(fetchStore());
      }
      navigate("/");
    } catch (error) {
      console.log("Error during login:", error);
      toast.custom(() => <NewToaster title={error} type="error" />);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow rounded-xl border-none">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center">
            <img
              src={logo}
              alt="Company Logo"
              className="h-[100px] max-w-[200px]"
            />
          </div>
          <CardTitle className="text-2xl font-semibold text-foreground">
            Welcome back
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Sign in to your dashboard
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          autoComplete="off"
                          placeholder="Enter your password"
                          className="h-11 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="text-right">
                <a href="/sign-up" className="text-sm text-blue-500">
                  Don't have an account? Sign up
                </a>
              </div>

              <Button
                disabled={loading}
                type="submit"
                className="w-full h-11 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500"
              >
                {loading ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  "Sign in"
                )}
              </Button>

              <div className="text-center">
                <a href="/reset-password" className="text-sm text-blue-500">
                  Forgot your password?
                </a>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default SignInForm;
