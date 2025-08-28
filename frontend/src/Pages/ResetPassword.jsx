import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "@/helper/axios";
import { showToast } from "@/components/NewToaster";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Mail, CheckCircle,LoaderCircle } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const ResetPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values) => {
    try {
      setIsLoading(true);
      const res = await axios.post("/api/users/forgot-password", values);
      if (res.status === 200) {
        showToast({
          title: "Reset link sent",
          type: "info",
          description: "Check your email for password reset instructions.",
        });
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link
          to="/sign-in"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>

        <Card className="shadow-[var(--card-shadow)] border-border">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              {isSuccess ? (
                <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                </div>
              ) : (
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
              )}
            </div>
            <CardTitle className="text-2xl font-semibold">
              {isSuccess ? "Check your email" : "Reset your password"}
            </CardTitle>
            <CardDescription>
              {isSuccess
                ? "We've sent a password reset link to your email address."
                : "Enter your email address and we'll send you a link to reset your password."}
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
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email address</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Enter your email"
                            disabled={isLoading}
                            className="h-11 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                            {...field}
                          />
                        </FormControl>
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
                      "Send reset link"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          )}

          {isSuccess && (
            <CardContent className="pt-0">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  Didn't receive the email? Check your spam folder or{" "}
                  <button
                    onClick={() => {
                      setIsSuccess(false);
                      form.reset();
                    }}
                    className="text-blue-500 hover:underline"
                  >
                    try again
                  </button>
                </p>
              </div>
            </CardContent>
          )}
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Remember your password?{" "}
          <Link
            to="/sign-in"
            className="hover:underline font-medium text-blue-500"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
