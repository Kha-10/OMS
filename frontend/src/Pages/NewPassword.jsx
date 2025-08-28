import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Lock, CheckCircle, Eye, EyeOff, LoaderCircle } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { showToast } from "@/components/NewToaster";
import axios from "@/helper/axios";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 6 characters");
//   .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
//   .regex(/[a-z]/, "Password must contain at least one lowercase letter")
//   .regex(/\d/, "Password must contain at least one number");

const formSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

const NewPassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { token } = useParams();
  console.log("token", token);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (values) => {
    try {
      setIsLoading(true);
      const res = await axios.post(
        `/api/users/reset-password/${token}`,
        values
      );
      if (res.status === 200) {
        setIsSuccess(true);
      }
    } catch (error) {
      console.log("Error during reset:", error);
      showToast({
        title: error?.response?.data?.msg,
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Invalid token state
  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-[var(--card-shadow)]">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-destructive">
              Invalid Reset Link
            </CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/reset-password">Request New Reset Link</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-[var(--card-shadow)] border-border">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              {isSuccess ? (
                <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
              ) : (
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
              )}
            </div>
            <CardTitle className="text-2xl font-semibold">
              {isSuccess ? "Password updated" : "Set new password"}
            </CardTitle>
            <CardDescription>
              {isSuccess
                ? "Your password has been successfully updated. You can now sign in with your new password."
                : "Choose a strong password for your account."}
            </CardDescription>
          </CardHeader>

          {!isSuccess && (
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>New password</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter new password"
                              className="pr-10 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                              disabled={isLoading}
                              {...field}
                            />
                          </FormControl>
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Confirm new password</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Confirm new password"
                              className="pr-10 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                              disabled={isLoading}
                              {...field}
                            />
                          </FormControl>
                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    variant="stripe"
                    className="w-full h-11 text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <LoaderCircle size={16} className="animate-spin" />
                    ) : (
                      "Update password"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          )}

          {isSuccess && (
            <CardContent className="pt-0">
              <Button
                variant="stripe"
                className="w-full text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500"
                asChild
              >
                <Link to="/sign-in">Sign in now</Link>
              </Button>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export default NewPassword;
