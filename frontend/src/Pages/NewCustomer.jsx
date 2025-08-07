import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm, } from "react-hook-form";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { ArrowLeft, MapPin } from "lucide-react";
import { useParams } from "react-router-dom";
import { DevTool } from "@hookform/devtools";
import { ToastContainer, toast } from "react-toastify";
import { showToast } from "@/helper/showToast";
import axios from "@/helper/axios";
import useCustomers from "@/hooks/useCustomers";

const NewCustomer = () => {
  const { id } = useParams();

  const { data: customers = [], isPending: isLoading } = useCustomers({ id });

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      deliveryAddress: {
        street: "",
        apartment: "",
        city: "",
        zipCode: "",
      },
    },
  });
 
  useEffect(() => {
    if (id) {
      form.setValue("name", customers.name);
      form.setValue("email", customers.email);
      form.setValue("phone", customers.phone);
      form.setValue("deliveryAddress.street", customers?.deliveryAddress?.street);
      form.setValue("deliveryAddress.apartment", customers?.deliveryAddress?.apartment);
      form.setValue("deliveryAddress.city", customers?.deliveryAddress?.city);
      form.setValue("deliveryAddress.zipCode", customers?.deliveryAddress?.zipCode);
    }
  }, [customers]);

  const handleRequest = async (data) => {
    if (id) {
      return await axios.patch(`/api/customers/${id}`, data);
    } else {
      return await axios.post("/api/customers", data);
    }
  };

  const onSubmit = async (data) => {
    const toastId = toast.loading(
      id ? "Updating customer..." : "Adding customer...",
      { position: "top-center" }
    );
    try {
      const res = await handleRequest(data);

      if (res.status === 200) {
        if (id) {
          showToast(toastId, "Customer updated successfully");
        } else {
          showToast(toastId, "Customer added successfully");
        }
      }
    } catch (error) {
      console.error("Error handling customer:", error.response?.data.msg);
      showToast(toastId, error.response?.data.msg, "error");
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
                <div className="bg-white p-4 border rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Name <span className="text-red-500">*</span>
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
                              // handleManualCustomerInput();
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
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="customer@example.com"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              // handleManualCustomerInput();
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
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Phone <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="+1 (555) 123-4567"
                            {...field}
                            {...form.register("phone", {
                              required: "Phone number is required",
                            })}
                            onChange={(e) => {
                              field.onChange(e);
                              // handleManualCustomerInput();
                            }}
                            className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-4 md:col-span-3">
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Delivery Address
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="deliveryAddress.street"
                          render={({ field }) => (
                            <FormItem className="w-full">
                              <FormLabel>Street</FormLabel>
                              <FormControl>
                                <Input
                                  className="w-full focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                                  placeholder="123 Main St"
                                  {...field}
                                  // {...form.register("deliveryAddress.street", {
                                  //   required: "street is required",
                                  // })}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="deliveryAddress.city"
                          render={({ field }) => (
                            <FormItem className="w-full">
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input
                                  className="w-full focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                                  placeholder="New York"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="deliveryAddress.apartment"
                          render={({ field }) => (
                            <FormItem className="w-full">
                              <FormLabel>Apartment</FormLabel>
                              <FormControl>
                                <Input
                                  className="w-full focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                                  placeholder="Apartment,unit number"
                                  {...field}
                                  {...form.register(
                                    "deliveryAddress.apartment",
                                    {
                                      required: "Apartment unit is required",
                                    }
                                  )}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="deliveryAddress.zipCode"
                          render={({ field }) => (
                            <FormItem className="w-full">
                              <FormLabel>ZIP Code</FormLabel>
                              <FormControl>
                                <Input
                                  className="w-full focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                                  placeholder="10001"
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
                </div>

                <Button
                  type="submit"
                  className="w-full sm:w-auto bg-blue-500 hover:bg-blue-700"
                >
                  Save
                </Button>
                {/* <Dialog
                  open={addressDialogOpen}
                  onOpenChange={setAddressDialogOpen}
                >
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Enter Address</DialogTitle>
                      <DialogDescription className="sr-only hidden"></DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="condoName"
                          className={cn(showCondoError && "text-destructive")}
                        >
                          Select Condo <span className="text-red-500">*</span>
                        </Label>
                        <Controller
                          name="condoName"
                          control={form.control}
                          rules={{ required: "Condo name is required" }}
                          render={({ field }) => (
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl className="w-full">
                                <SelectTrigger
                                  className={cn(
                                    "border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-0",
                                    { "border-destructive": showUnitError }
                                  )}
                                >
                                  <SelectValue placeholder="Select Condo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <ScrollArea className="max-h-60 overflow-y-auto">
                                  {condoLists.length &&
                                    condoLists.map((condo, i) => (
                                      <div key={i}>
                                        <SelectItem value={condo}>
                                          {condo}
                                        </SelectItem>
                                      </div>
                                    ))}
                                </ScrollArea>
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {showCondoError && (
                          <p className="text-sm text-destructive">
                            Condo name is required
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="condoUnit"
                        className={cn(showUnitError && "text-destructive")}
                      >
                        Unit <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="condoUnit"
                        placeholder="Enter unit number"
                        className={cn(
                          "border border-gray-200 rounded-lg focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0",
                          { "border-destructive": showUnitError }
                        )}
                        value={form.getValues("condoUnit")}
                        onChange={(e) => {
                          form.setValue("condoUnit", e.target.value);
                          if (e.target.value) setShowUnitError(false);
                        }}
                      />
                      {showUnitError && (
                        <p className="text-sm text-destructive">
                          Unit is required
                        </p>
                      )}
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button" variant="outline">
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button
                        type="button"
                        onClick={saveAddress}
                        className="bg-blue-500 hover:bg-blue-700"
                      >
                        Save Address
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog> */}
              </form>
            </Form>
          </div>
        </main>
      </div>
      <ToastContainer />
      {/* <DevTool control={form.control} /> */}
    </div>
  );
};

export default NewCustomer;
