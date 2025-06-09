import React, { useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { DevTool } from "@hookform/devtools";
import axios from "@/helper/axios";
import { showToast } from "@/helper/showToast";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Promotions = () => {
  const form = useForm({
    defaultValues: {
      freeDeliveryEnabled: false,
    },
  });

  useEffect(() => {
    const getFreeDeliveryState = async () => {
      const res = await axios.get("/api/adminSettings");
      if (res.status === 200) {
        form.setValue("freeDeliveryEnabled", res.data.freeDeliveryEnabled);
      }
    };
    getFreeDeliveryState();
  }, []);

  const onSubmit = async (data) => {
    const toastId = toast.loading(
      data.freeDeliveryEnabled
        ? "Switching on free delivery for all locations..."
        : "Switching off free delivery for all locations...",
      { position: "top-center" }
    );
    try {
      const res = await axios.patch("/api/adminSettings", data);
      if (res.status === 200) {
        if (data.freeDeliveryEnabled) {
          showToast(toastId, "Free delivery switched on successfully");
        } else {
          showToast(toastId, "Free delivery switched off successfully");
        }
      }
    } catch (error) {
      console.log(error);
      showToast(
        toastId,
        `Something went wrong ${
          data.freeDeliveryEnabled ? "Something went wrong switching on" : "Something went wrong switching off"
        }`,
        "error"
      );
    }
  };

  return (
    <div className="max-w-screen-lg mx-auto flex items-center flex-wrap gap-6 mt-3">
      <div className="w-full h-screen bg-white px-10 py-6 rounded-lg">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full space-y-6"
          >
            <div>
              <h3 className="mb-4 text-lg font-medium">Promotions</h3>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="freeDeliveryEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Free Delivery
                        </FormLabel>
                        <FormDescription>
                          Set delivery fee to free for all locations.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <Button className="bg-orange-400 hover:bg-orange-400" type="submit">
              Submit
            </Button>
          </form>
        </Form>
      </div>
      <ToastContainer />
      <DevTool control={form.control} />
    </div>
  );
};

export default Promotions;
