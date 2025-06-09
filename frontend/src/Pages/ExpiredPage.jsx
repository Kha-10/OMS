import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Clock, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "@/helper/axios";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";

export default function ExpiredPage() {
  const [countdown, setCountdown] = useState(null);
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      email: "",
    },
  });

  const navigate = useNavigate();

  const cooldownDuration = 300;

  useEffect(() => {
    const storedCountdown = localStorage.getItem("resetLinkCountdown");

    if (storedCountdown) {
      const timeLeft = Number(storedCountdown) - Date.now();
      if (timeLeft > 0) {
        setCountdown(Math.floor(timeLeft / 1000));
      } else {
        localStorage.removeItem("resetLinkCountdown");
      }
    }
    let timer;
    if (countdown !== null && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prevCountdown) => {
          if (prevCountdown === null || prevCountdown <= 1) {
            clearInterval(timer);
            setCountdown(cooldownDuration);
            localStorage.removeItem("resetLinkCountdown");
            return null;
          }
          return prevCountdown - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const onSubmit = async (data) => {
    try {
      const response = await axios.post("/api/request-new-reset-link", {
        email: data.email,
      });
      toast({
        className:
          "top-0 right-0 flex fixed md:max-w-[420px] md:top-4 md:right-4",
        title: "New link requested",
        description: "Check your email for a new password reset link.",
        duration: 5000,
      });
      setCountdown(cooldownDuration);
      const expirationTime = Date.now() + cooldownDuration * 1000;
      localStorage.setItem("resetLinkCountdown", expirationTime);
    } catch (error) {
      if (error.response.status == 400) {
        setCountdown(null);
        console.log(error);
        toast({
          className:
            "top-0 right-0 flex fixed md:max-w-[420px] md:top-4 md:right-4 text-red-500",
          title: error.response.data.message,
        });
      } else {
        console.log(error);
        if (error.response.data.message == "User not found") {
          toast({
            className:
              "top-0 right-0 flex fixed md:max-w-[420px] md:top-4 md:right-4 text-red-500",
            title: error.response.data.message,
          });
        } else {
          navigate("/used-link");
        }
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-orange-600 text-center">
            Password Reset Link Expired
          </CardTitle>
          <CardDescription className="text-center">
            Your password reset link has expired for security reasons.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center text-orange-500">
            <AlertCircle className="w-12 h-12" />
          </div>
          <p className="text-center text-gray-600">
            For your security, password reset links are only valid for a limited
            time.
          </p>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                rules={{ required: "Email is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your email"
                        {...field}
                        className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the email associated with your account.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {countdown !== null && (
                <div className="flex items-center justify-center space-x-2 text-gray-500">
                  <Clock className="w-5 h-5" />
                  <span>
                    You can request a new link in: {formatTime(countdown)}
                  </span>
                </div>
              )}
              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                // disabled={countdown !== null && countdown > 0}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Request New Link
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
