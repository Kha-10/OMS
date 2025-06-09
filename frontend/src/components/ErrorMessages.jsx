import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  ArrowLeft,
  FileQuestion,
  WifiOff,
  UserX,
  Lock,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function ErrorMessage({
  title,
  message,
  code = "404",
  action = {
    label: "Return to Dashboard",
    to: "/",
  },
}) {
  const icons = {
    404: <FileQuestion className="h-10 w-10 text-muted-foreground" />,
    500: <AlertCircle className="h-10 w-10 text-destructive" />,
    offline: <WifiOff className="h-10 w-10 text-muted-foreground" />,
    400: <UserX className="h-10 w-10 text-warning" />,
    403: <Lock className="h-10 w-10 text-warning" />,
  };

  const defaultMessages = {
    404: {
      title: "Page not found",
      message: "Sorry, we couldn't find the page you're looking for.",
    },
    500: {
      title: "Something went wrong",
      message: "Sorry, an unexpected error occurred.",
    },
    offline: {
      title: "You're offline",
      message: "Sorry, it seems you've lost your internet connection.",
    },
    400: {
      title: "Unauthorized",
      message: "Please log in to access this page.",
    },
    403: {
      title: "Access Denied",
      message: "Sorry, you don't have permission to access this page.",
    },
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 text-center">
      <div className="rounded-full bg-muted p-4">{icons[code]}</div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tighter">
          {title || defaultMessages[code].title}
        </h1>
        <p className="text-muted-foreground">
          {message || defaultMessages[code].message}
        </p>
      </div>
      {action.label && action.to && (
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go back
          </Button>
          <Button asChild className=" bg-blue-500 hover:bg-blue-700">
            <Link to={action.to}>{action.label}</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
