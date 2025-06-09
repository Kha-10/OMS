import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "@/helper/axios";
import { DevTool } from "@hookform/devtools";

export default function ResetPassword() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const checkToken = async () => {
      try {
        const response = await axios.get(`/api/validate-reset-token/${token}`);
        console.log(response);
      } catch (error) {
        console.log(error);
        if (error.response.status == 400) {
          navigate("/expired-link");
        }else {
            
        }
      }
    };

    if (token) {
      checkToken();
    }
  }, [token, navigate]);

  const onSubmit = async (data) => {
    delete data.confirmPassword;
    data.token = token;
    try {
      const response = await axios.post("/api/reset-password", data);
      console.log(response);
      if (response.status == 200) {
        navigate("/tenant/sign-in");
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8 mb-4 border border-gray-200"
          >
            <h2 className="text-2xl font-bold mb-6 text-orange-600 text-center">
              Reset Password
            </h2>

            <FormField
              control={form.control}
              name="password"
              rules={{ required: "New password is required" }}
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel className="block text-gray-700 text-sm font-bold mb-2">
                    New Password
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        autoComplete="off"
                        className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 pr-10"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              rules={{
                required: "Please confirm your password",
                validate: (value) =>
                  value === form.getValues("password") ||
                  "Passwords do not match",
              }}
              render={({ field }) => (
                <FormItem className="mb-6">
                  <FormLabel className="block text-gray-700 text-sm font-bold mb-2">
                    Confirm New Password
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="off"
                        className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 pr-10"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-center">
              <Button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
              >
                Reset Password
              </Button>
            </div>
          </form>
        </Form>
      </div>
      <DevTool control={form.control} />
    </div>
  );
}
