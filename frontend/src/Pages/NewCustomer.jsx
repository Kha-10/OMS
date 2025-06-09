import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm, Controller } from "react-hook-form";
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
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, MapPin } from "lucide-react";
import { useParams } from "react-router-dom";
import { DevTool } from "@hookform/devtools";
import { ToastContainer, toast } from "react-toastify";
import { showToast } from "@/helper/showToast";
import axios from "@/helper/axios";
import useCustomers from "@/hooks/useCustomers";
import { cn } from "@/lib/utils";
import { condoLists } from "@/helper/constant";

const NewCustomer = () => {
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [showCondoError, setShowCondoError] = useState(false);
  const [showUnitError, setShowUnitError] = useState(false);

  const { id } = useParams();

  const { data : customers = [], isPending: isLoading } = useCustomers({ id });

  const form = useForm({
    defaultValues: {
      name: "",
      phoneNumber: "",
      address: "",
      condoName: "",
      condoUnit: "",
    },
  });

  const watchAddress = form.watch("address");
  const watchCondo = form.watch("condoName");
  const watchUnit = form.watch("condoUnit");

  const saveAddress = () => {
    setShowCondoError(!watchCondo);
    setShowUnitError(!watchUnit);

    if (watchCondo && watchUnit) {
      form.setValue("address", `${watchCondo}, Unit ${watchUnit}`, {
        shouldValidate: true,
      });
      setAddressDialogOpen(false);
    }
  };

  useEffect(() => {
    if (id) {
      form.setValue("name", customers.name);
      form.setValue("phoneNumber", customers.phoneNumber);
      form.setValue("condoName", customers.condoName);
      form.setValue("condoUnit", customers.condoUnit);
      form.setValue("address", customers.address);
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
                <div className="bg-white p-4 border rounded-lg space-y-3">
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
                            {...field}
                            placeholder="Name"
                            autoComplete="off"
                            {...form.register("name", {
                              required: "Customer name is required",
                            })}
                            className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Phone Number <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Phone Number"
                            autoComplete="off"
                            {...form.register("phoneNumber", {
                              required: "Customer phone Number is required",
                            })}
                            className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <Label
                      htmlFor="address"
                      className={cn(
                        form.formState.errors.address && "text-destructive"
                      )}
                    >
                      Address <span className="text-red-500">*</span>
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setAddressDialogOpen(true)}
                      className="w-full justify-start text-gray-500 font-normal"
                    >
                      <MapPin className="mr-2 h-5 w-5 text-gray-400" />
                      {watchAddress ? watchAddress : "Enter address"}
                    </Button>
                    <input
                      type="hidden"
                      {...form.register("address", {
                        required: "Address is required",
                      })}
                    />
                    {form.formState.errors.address && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.address.message}
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full sm:w-auto bg-blue-500 hover:bg-blue-700"
                >
                  Save
                </Button>
                <Dialog
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
                </Dialog>
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
