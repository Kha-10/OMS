import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import ProductSearch from "@/components/ProductSearch";
import { Link, useParams } from "react-router-dom";
import { DevTool } from "@hookform/devtools";
import { ToastContainer, toast } from "react-toastify";
import { showToast } from "@/helper/showToast";
import axios from "@/helper/axios";
import useProducts from "@/hooks/useProducts";
import useCategories from "@/hooks/useCategories";
import { useSelector } from "react-redux";

export default function NewCategory() {
  const [selectedProducts, setSelectedProducts] = useState([]);
  const { id } = useParams();
  const { data } = useProducts({});
  const products = data?.data || [];
  let { data: categories = [] } = useCategories({ id });
  const { stores } = useSelector((state) => state.stores);
  const storeId = stores?.[0]?._id;

  const form = useForm({
    defaultValues: {
      name: "",
      visibility: "visible",
      description: "",
    },
  });

  useEffect(() => {
    form.reset(categories);
    if (categories?.products?.length > 0) {
      setSelectedProducts(categories.products);
    }
  }, [categories]);

  const handleRequest = async (data) => {
    if (id) {
      return await axios.patch(`/api/stores/${storeId}/categories/${id}`, data);
    } else {
      return await axios.post(`/api/stores/${storeId}/categories`, data);
    }
  };

  const onSubmit = async (data) => {
    const toastId = toast.loading(
      id ? "Updating category..." : "Adding category...",
      { position: "top-center" }
    );
    try {
      if (selectedProducts.length > 0) {
        data.products = selectedProducts;
      } else data.products = [];
      const res = await handleRequest(data);

      if (res.status === 200) {
        if (id) {
          showToast(toastId, "Category updated successfully");
        } else {
          showToast(toastId, "Category added successfully");
        }
      }
    } catch (error) {
      console.log(error);
      console.error("Error handling category:", error.response?.data.msg);
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
              <Link to={"/categories"} className="inline-flex items-center">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Category
              </Link>
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
                            {...form.register("name", {
                              required: "Category name is required",
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
                    name="visibility"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel></FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 ring-offset-blue-500 focus:ring-transparent">
                              <SelectValue placeholder="Select visibility" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="visible">Visible</SelectItem>
                              <SelectItem value="hidden">Hidden</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Description"
                            className="h-24 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                            maxLength={100}
                          />
                        </FormControl>
                        <p className="text-sm text-muted-foreground">
                          Description must be less than 100 characters
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="bg-white p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Products</h2>
                    <Badge variant="secondary">
                      TOTAL {selectedProducts?.length}
                    </Badge>
                  </div>
                  <ProductSearch
                    products={products}
                    selectedProducts={selectedProducts}
                    setSelectedProducts={setSelectedProducts}
                  />
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
      <ToastContainer />
      <DevTool control={form.control} />
    </div>
  );
}
