import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { DevTool } from "@hookform/devtools";
import axios from "@/helper/axios";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "sonner";
import NewToaster from "@/components/NewToaster";
import { Label } from "@/components/ui/label";
import { fetchTenant } from "@/features/tenants/tenantSlice";

const Profile = () => {
  const {
    tenant: { user },
  } = useSelector((state) => state.tenants);
  const dispatch = useDispatch();

  const form = useForm({
    defaultValues: {
      username: "",
      email: "",
      phoneLocal: "+66",
      countryCode: "",
    },
  });

  useEffect(() => {
    if (user) {
      form.setValue("username", user.username);
      form.setValue("email", user.email);
      form.setValue("phoneLocal", user.phoneLocal);
      form.setValue("countryCode", user.countryCode);
    }
  }, [user]);

  const handleRequest = async (data) => {
    return await axios.patch(`/api/users/update`, data);
  };

  const onSubmit = async (data) => {
    const loadingToastId = toast.custom(
      () => (
        <NewToaster title={"Updating User Information..."} type="loading" />
      ),
      {
        duration: Infinity,
      }
    );
    try {
      const res = await handleRequest(data);

      if (res.status === 200) {
        if (user) {
          dispatch(fetchTenant());
          toast.dismiss(loadingToastId);
          toast.custom(() => (
            <NewToaster title="Customer updated successfully" type="success" />
          ));
        } else {
          toast.dismiss(loadingToastId);
          toast.custom(() => (
            <NewToaster title="Customer added successfully" type="success" />
          ));
        }
      }
    } catch (error) {
      console.error("Error handling customer:", error.response?.data.msg);
      toast.dismiss(loadingToastId);
      toast.custom(() => (
        <NewToaster
          title={
            error.response?.data?.msg ||
            error.response?.data?.error ||
            error.message ||
            "Something went wrong"
          }
          type="error"
        />
      ));
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1">
        {/* Main Content */}
        <main className="p-6">
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="flex items-center space-x-2">
              <div
                onClick={() => window.history.back()}
                className="inline-flex items-center"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Customer
              </div>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="bg-white p-4 space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Name <span className="text-red-500 space-y-2">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Customer name"
                            {...field}
                            {...form.register("name", {
                              required: "Customer name is required",
                            })}
                            onChange={(e) => {
                              field.onChange(e);
                            }}
                            className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="space-y-2">Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="customer@example.com"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                            }}
                            readOnly
                            disabled
                            className="cursor-not-allowed opacity-70 bg-gray-200 text-gray-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Phone number</Label>
                    <div className="flex gap-2">
                      <FormField
                        control={form.control}
                        name="countryCode"
                        render={({ field }) => (
                          <FormItem>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-11 w-20 rounded-xl border-gray-200 sm:h-12 sm:w-24 focus:ring-2 focus:ring-blue-500 focus-visible:ring-offset-0">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="+66">+66</SelectItem>
                                <SelectItem value="+95">+95</SelectItem>
                                <SelectItem value="+33">+33</SelectItem>
                                <SelectItem value="+49">+49</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phoneLocal"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                type="tel"
                                placeholder="555-000-0000"
                                className="h-11 rounded-xl border-gray-200 text-sm sm:h-12 sm:text-base w-full focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full sm:w-auto bg-blue-500 hover:bg-blue-700"
                >
                  Save
                </Button>
              </form>
            </Form>
          </div>
        </main>
      </div>
      {/* <DevTool control={form.control} /> */}
    </div>
  );
};

export default Profile;
