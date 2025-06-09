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
function SignUpForm() {
  const [errors, setErrors] = useState(null);
  let navigate = useNavigate();

  const { dispatch, setLoading } = useContext(AuthContext);

  const form = useForm({
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setErrors(null);
      let res = await axios.post("/api/users/register", data, {
        withCredentials: true,
      });
      if (res.status == 200) {
        dispatch({ type: "REGISTER", payload: res.data.user });
        navigate("/");
      }
    } catch (error) {
      console.log("Error submitting the form", error);
      setErrors(error.response.data.errors);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 max-w-[400px] mx-auto">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-5 bg-white p-5 rounded-lg shadow-sm border border-slate-200"
        >
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Username"
                    autoComplete="username"
                    className="w-full"
                    {...field}
                    {...form.register("username", {
                      required: "Username is required",
                    })}
                  />
                </FormControl>
                <FormMessage>
                  {!!(errors && errors.username) && (
                    <span>{errors.username.msg}</span>
                  )}
                </FormMessage>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Email"
                    className="w-full"
                    {...field}
                    {...form.register("email", {
                      required: "Email is required",
                    })}
                  />
                </FormControl>
                <FormMessage>
                  {!!(errors && errors.email) && (
                    <span>{errors.email.msg}</span>
                  )}
                </FormMessage>
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
                    className="w-full"
                    {...field}
                    {...form.register("password", {
                      required: "Password is required",
                    })}
                  />
                </FormControl>
                <FormMessage>
                  {!!(errors && errors.password) && (
                    <span>{errors.password.msg}</span>
                  )}
                </FormMessage>
              </FormItem>
            )}
          />
          <div className="w-full flex items-center justify-between">
            <Button className="bg-orange-500 text-white">Register</Button>
            <span className="text-sm text-gray-400">
              Already have an account?
              <Link to={"/sign-in"} className=" text-orange-400 ml-1">
                Sign in
              </Link>
            </span>
          </div>
        </form>
      </Form>
      <DevTool control={form.control} />
    </div>
  );
}

export default SignUpForm;
