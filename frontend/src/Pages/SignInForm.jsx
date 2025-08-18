import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { DevTool } from "@hookform/devtools";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "../helper/axios";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { AuthContext } from "@/contexts/authContext";
import { useDispatch, useSelector } from "react-redux";
import { loginTenant } from "@/features/tenants/tenantSlice";
import { fetchStore } from "@/features/stores/storeSlice";

function SignInForm() {
  let navigate = useNavigate();
  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });
  // const { dispatch, setLoading, error, setError } = useContext(AuthContext);
  const { error } = useSelector((state) => state.tenants);
  console.log(error);
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
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="space-y-3 w-[400px] mx-auto">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5 bg-white p-5 rounded-lg shadow-sm border border-slate-200"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Email"
                      className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                      autoComplete="email"
                      {...field}
                      {...form.register("email", {
                        required: "Email is required",
                      })}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      placeholder="*********"
                      className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                      {...field}
                      {...form.register("password", {
                        required: "Password is required",
                      })}
                    />
                  </FormControl>
                  <FormMessage>{!!error && <span>{error}</span>}</FormMessage>
                </FormItem>
              )}
            />
            <div className="w-full flex items-center justify-between">
              <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                Login
              </Button>
              <span className="text-sm text-gray-400">
                Don't have an account?
                <Link to={"/sign-up"} className=" text-blue-400 ml-1">
                  Sign up
                </Link>
              </span>
            </div>
          </form>
        </Form>
        <DevTool control={form.control} />
      </div>
    </div>
  );
}

export default SignInForm;
