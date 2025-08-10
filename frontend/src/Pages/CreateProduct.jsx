import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useForm, useFieldArray, useController } from "react-hook-form";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Type,
  Hash,
  Calendar,
  CheckSquare,
  List,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { DevTool } from "@hookform/devtools";
import axios from "@/helper/axios";
import useCategories from "@/hooks/useCategories";
import useCategoriesActions from "@/hooks/useCategoriesActions";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { showToast } from "@/helper/showToast";
import useProducts from "@/hooks/useProducts";

export default function CreateProduct() {
  const [channel, setChannel] = useState("whatsapp");
  const [images, setImages] = useState([]);
  const [deletedImages, setDeletedImages] = useState([]);
  const [totalSize, setTotalSize] = useState(0); // Track combined size in MB
  const MAX_TOTAL_SIZE_MB = 10;
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [inputedValue, setInputedValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);
  const cardRef = useRef(null);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const suggestionsRef = useRef(null);
  const optionsRef = useRef(null);
  const { id } = useParams();

  const form = useForm({
    defaultValues: {
      name: "",
      visibility: "visible",
      categories: [],
      inputValue: "",
      type: "physical",
      price: 0,
      originalPrice: 0,
      description: "",
      trackQuantityEnabled: false,
      inventory: {
        quantity: 0,
      },
      cartMaximumEnabled: false,
      cartMaximum: 0,
      cartMinimumEnabled: false,
      cartMinimum: 0,
      dailyCapacity: false,
      dailyCapacityInventory: {
        quantity: 0,
      },
      sku: "",
      variants: [],
      options: [],
    },
    shouldFocusError: false,
  });

  const { data } = useCategories({});
  const category = data?.data || [];

  const { addMutation } = useCategoriesActions(
    setSelectedCategories,
    selectedCategories
  );
  let { data: product = [], isPending: isLoading } = useProducts({ id });

  if (!id) {
    product = form.formState.defaultValues;
  }
  console.log(product);
  useEffect(() => {
    if (id && product) {
      form.reset(product);
      setImages(product.imgUrls);
      setSelectedCategories(
        Array.isArray(product.categories) ? product.categories : []
      );
    }
  }, [id, product]);

  const scrollToCard = () => {
    if (cardRef.current) {
      cardRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const categories = form.getValues("categories");
  // const inputValue = form.getValues("inputValue");
  const trackQuantity = form.getValues("trackQuantityEnabled");
  const dailyCapacity = form.getValues("dailyCapacity");
  const cartMaximumEnabled = form.getValues("cartMaximumEnabled");
  const cartMinimumEnabled = form.getValues("cartMinimumEnabled");

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
  } = useFieldArray({
    control: form.control,
    name: "options",
  });

  const availableCategories = useMemo(
    () =>
      !!category &&
      category.filter(
        (c) => !selectedCategories?.some((selected) => selected._id === c._id)
      ),
    [categories, selectedCategories]
  );

  const filteredCategories = useMemo(
    () =>
      !!availableCategories &&
      availableCategories.filter((category) =>
        category.name.toLowerCase().includes(inputedValue.toLowerCase())
      ),
    [availableCategories, inputedValue]
  );

  const onRemove = (category) => {
    setSelectedCategories(
      selectedCategories.filter((c) => c._id !== category._id)
    );
  };

  const handleKeyDown = useCallback(
    (e) => {
      if (
        (e.key === "Backspace" || e.key === "Delete") &&
        inputedValue === "" &&
        selectedCategories.length > 0
      ) {
        onRemove(selectedCategories[selectedCategories.length - 1]);
      }
    },
    [inputedValue, onRemove, selectedCategories]
  );

  const handleClickOutside = useCallback((event) => {
    if (
      suggestionsRef.current &&
      !suggestionsRef.current.contains(event.target) &&
      !inputRef.current?.contains(event.target)
    ) {
      setShowSuggestions(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside]);

  const handleCreateNew = () => {
    addMutation.mutate({ name: inputedValue });
    setInputedValue("");
    inputRef.current?.focus();
  };

  useEffect(() => {
    form.setValue(
      "categories",
      selectedCategories?.map((cat) => cat._id)
    );
  }, [selectedCategories]);

  const handleFileChange = (event) => {
    if (event.target.files) {
      const newImages = Array.from(event.target.files).map((file) => {
        const size = (file.size / 1024 / 1024).toFixed(2); // Convert to MB
        return { file, size: parseFloat(size) };
      });
      const validImages = newImages.filter((img) => {
        if (parseFloat(img.size) > 3.75) {
          alert(
            `File "${img.file.name}" exceeds the Maximum size limit of 3.75MB and will not be uploaded.`
          );
          return false;
        }
        return true;
      });

      const newTotalSize =
        totalSize + validImages.reduce((acc, img) => acc + img.size, 0);

      if (newTotalSize > MAX_TOTAL_SIZE_MB) {
        alert(
          `Adding these files would exceed the Maximum size limit of ${MAX_TOTAL_SIZE_MB}MB.`
        );
      } else {
        setImages((prevImages) => [...(prevImages || []), ...validImages]);
        setTotalSize(newTotalSize);
      }
    }
  };

  const removeImage = (index) => {
    const updatedImages = [...images];
    const removedImage = updatedImages[index];

    if (typeof removedImage === "string") {
      setDeletedImages((prevDeleted) => [...prevDeleted, removedImage]);
    } else {
    }
    updatedImages.splice(index, 1); // Remove image from state
    setImages(updatedImages);
  };

  const uploadPhotos = async (productId, images) => {
    for (const fileObj of images) {
      const formData = new FormData();
      formData.append("photo", fileObj.file); // Ensure correct key

      try {
        console.log("productId",productId);
        const response = await axios.post(
          `/api/products/${productId}/upload`, // Correct API URL
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data", // Ensure correct headers
            },
          }
        );
        console.log("Upload response:", response.data);
      } catch (error) {
        console.error("Upload error:", error.response?.data || error.message);
      }
    }
  };

  const onSubmit = async (data) => {
    const toastId = toast.loading(
      id ? "Updating product..." : "Adding product...",
      { position: "top-center" }
    );
    try {
      const newImages = images.filter((img) => img.file instanceof File); // Only new files
      const existingImageUrls = images.filter((img) => typeof img === "string"); // Keep only URLs

      // Prepare the update payload
      data.images = existingImageUrls; // Only send URLs
      if (deletedImages.length > 0) {
        data.deletedImages = deletedImages; // Send deleted images for removal
      }
      console.log(data);
      let res;
      if (id) {
        res = await axios.patch(`/api/products/${id}`, data);
      } else {
        res = await axios.post("/api/products", data);
      }
      if (res.status === 200) {
        showToast(
          toastId,
          id ? "Product updated successfully" : "Product added successfully"
        );
        onError("error");
      }

      // Step 2: Upload Photos (only if there are images)
      console.log('res',res);
      if (newImages.length > 0) {
        await uploadPhotos(res.data._id, newImages);
      }
    } catch (error) {
      console.error("Error handling product:", error.response?.data.msg);
      showToast(toastId, error.response?.data.msg, "error");
    }
  };

  const onError = (errors) => {
    if (errors.options) {
      optionsRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    } else {
      containerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <div ref={containerRef} className="container max-w-3xl py-6 h-full">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link
            to={"/products?page=1&limit=10&sortBy=createdAt&sortDirection=desc"}
            className="inline-flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Product
          </Link>
        </div>
        {/* <Select value={channel} onValueChange={setChannel}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="telegram">Telegram</SelectItem>
            <SelectItem value="messenger">Messenger</SelectItem>
          </SelectContent>
        </Select> */}
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, onError)}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                        placeholder="Name"
                        className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                        {...field}
                        {...form.register("name", {
                          required: "Product name is required",
                        })}
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
                    <FormLabel>Visibility</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 ring-offset-blue-500 focus:ring-transparent">
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="visible">Visible</SelectItem>
                        <SelectItem value="hidden">Hidden</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className=" space-y-2" ref={wrapperRef}>
                <p className="text-sm">
                  Category <span className="text-red-500">*</span>
                </p>
                <div className="relative">
                  <div className="flex items-center w-full rounded-md border border-input bg-background text-sm ring-offset-background gap-2 p-2">
                    <FormField
                      control={form.control}
                      rules={{
                        validate: (value) =>
                          value.length > 0 ||
                          "Product must be in at least one category.",
                      }}
                      name="categories"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormControl>
                            <div className="relative w-full">
                              <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-background p-0 text-sm ring-offset-background">
                                {!!selectedCategories &&
                                  selectedCategories.map((category) => (
                                    <Badge
                                      key={category._id}
                                      variant="secondary"
                                      className="rounded-md gap-1 px-2 py-0.5"
                                    >
                                      {category.name}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          onRemove(category);
                                          setShowSuggestions(true);
                                        }}
                                        className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                      >
                                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                        <span className="sr-only">
                                          Remove {category.name}
                                        </span>
                                      </button>
                                    </Badge>
                                  ))}
                                <Input
                                  {...field}
                                  ref={inputRef}
                                  value={inputedValue}
                                  onChange={(e) => {
                                    setInputedValue(e.target.value);
                                    field.onChange(e);
                                    setShowSuggestions(true);
                                  }}
                                  onFocus={() => setShowSuggestions(true)}
                                  onKeyDown={handleKeyDown}
                                  className="w-[250px] flex-1 border-0 border-transparent bg-transparent p-0 placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                                  placeholder="Select or create categories"
                                />
                              </div>
                              {showSuggestions && (
                                <ul
                                  ref={suggestionsRef}
                                  className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
                                >
                                  {filteredCategories.map((category) => (
                                    <li
                                      key={category._id}
                                      onClick={() => {
                                        setSelectedCategories((prev) => [
                                          ...(prev || []),
                                          category,
                                        ]);
                                        setInputedValue("");
                                        inputRef.current?.focus();
                                      }}
                                      className="cursor-pointer rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                                    >
                                      {category.name}
                                    </li>
                                  ))}
                                  {inputedValue &&
                                    !filteredCategories.some(
                                      (cat) =>
                                        cat.name.toLowerCase() ===
                                        inputedValue.toLowerCase()
                                    ) && (
                                      <li className="cursor-pointer rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          className="w-full justify-start p-0 font-normal"
                                          onClick={handleCreateNew}
                                        >
                                          <Plus className="mr-2 h-4 w-4" />
                                          Create "{inputedValue}"
                                        </Button>
                                      </li>
                                    )}
                                </ul>
                              )}
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  {/* Error Message */}
                  {form.formState.errors.categories && (
                    <span className="text-red-500 text-sm font-medium block mt-2">
                      {form.formState.errors.categories.message}
                    </span>
                  )}
                </div>
              </div>

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder="Select type"
                            onValueChange={field.onChange}
                            value={field.value}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="physical">Physical</SelectItem>
                        <SelectItem value="digital">Digital</SelectItem>
                        <SelectItem value="service">Service</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          {product.trackQuantityEnabled && product.inventory?.quantity < 1 && (
            <Button
              type="button"
              onClick={scrollToCard}
              className="bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Scroll to Inventory
            </Button>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input
                          className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                          type="number"
                          placeholder="0"
                          min="0"
                          step="0.01"
                          value={field.value === undefined ? "" : field.value}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(
                              value === "" ? undefined : parseFloat(value)
                            );
                          }}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="originalPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Original price</FormLabel>
                      <FormControl>
                        <Input
                          className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                          type="number"
                          placeholder="0"
                          min="0"
                          step="0.01"
                          value={field.value === undefined ? "" : field.value}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(
                              value === "" ? undefined : parseFloat(value)
                            );
                          }}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormDescription>
                      Decorate with **bold** ~strike~ _italic_
                    </FormDescription>
                    <FormControl>
                      <Textarea
                        placeholder="Enter product description..."
                        className="min-h-[150px] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div
                  className="flex h-32 cursor-pointer items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50/50"
                  onClick={() =>
                    document.getElementById("file-upload")?.click()
                  }
                >
                  <div className="space-y-2 text-center">
                    <div className="flex justify-center">
                      <svg
                        className="h-12 w-12 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 48 48"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                        />
                      </svg>
                    </div>
                    <div className="text-sm text-gray-500">
                      Drag a file here or click to select one
                    </div>
                    <div className="text-xs text-gray-400">
                      File should not exceed 10mb. Recommended ratio is 1:1.
                    </div>
                  </div>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                />
                <div className="grid grid-cols-4 gap-4">
                  {!!images &&
                    images.map((image, index) => (
                      <div
                        key={index}
                        className="relative aspect-square overflow-hidden rounded-lg"
                      >
                        <img
                          src={
                            image.file ? URL.createObjectURL(image.file) : image
                          }
                          alt={`Uploaded image ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1">
                          {image.size}
                        </div>
                        <button
                          type="button"
                          className="absolute right-1 top-1 rounded-full bg-white p-1 text-gray-500 shadow-sm hover:text-gray-700"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Variants</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="rounded-lg border border-gray-200 p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Variant {index + 1}</h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name={`variants.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input
                              className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                              placeholder="Name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name={`variants.${index}.price`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price</FormLabel>
                            <FormControl>
                              <Input
                                className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                                type="number"
                                placeholder="0"
                                min="0"
                                step="0.01"
                                value={
                                  field.value === undefined ? "" : field.value
                                }
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(
                                    value === "" ? undefined : parseFloat(value)
                                  );
                                }}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`variants.${index}.originalPrice`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Original price</FormLabel>
                            <FormControl>
                              <Input
                                className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                                type="number"
                                placeholder="0"
                                min="0"
                                step="0.01"
                                value={
                                  field.value === undefined ? "" : field.value
                                }
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(
                                    value === "" ? undefined : parseFloat(value)
                                  ); // Crucial
                                }}
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
              ))}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    append({ name: "", price: 0, originalPrice: 0 })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add variant
                </Button>
                <Button type="button" variant="outline" className="w-full">
                  Change variant sequence
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {optionFields.map((field, index) => (
                <div
                  ref={optionsRef}
                  key={field.id}
                  className="rounded-lg border border-gray-200 p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Option {index + 1}</h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name={`options.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                              placeholder="Name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`options.${index}.type`}
                      render={({ field }) => (
                        <FormItem>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 ring-offset-blue-500 focus:ring-transparent">
                                <SelectValue placeholder="Select type">
                                  <div className="flex items-center">
                                    {field.value === "Text" && (
                                      <Type className="mr-2 h-4 w-4" />
                                    )}
                                    {field.value === "Number" && (
                                      <Hash className="mr-2 h-4 w-4" />
                                    )}
                                    {field.value === "Date" && (
                                      <Calendar className="mr-2 h-4 w-4" />
                                    )}
                                    {field.value === "Checkbox" && (
                                      <CheckSquare className="mr-2 h-4 w-4" />
                                    )}
                                    {field.value === "Selection" && (
                                      <List className="mr-2 h-4 w-4" />
                                    )}
                                    {field.value || "Select type"}
                                  </div>
                                </SelectValue>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Text">
                                <div className="flex items-center">
                                  <Type className="mr-2 h-4 w-4" />
                                  Text
                                </div>
                              </SelectItem>
                              <SelectItem value="Number">
                                <div className="flex items-center">
                                  <Hash className="mr-2 h-4 w-4" />
                                  Number
                                </div>
                              </SelectItem>
                              {/* <SelectItem value="Date">
                                <div className="flex items-center">
                                  <Calendar className="mr-2 h-4 w-4" />
                                  Date
                                </div>
                              </SelectItem> */}
                              <SelectItem value="Checkbox">
                                <div className="flex items-center">
                                  <CheckSquare className="mr-2 h-4 w-4" />
                                  Checkbox
                                </div>
                              </SelectItem>
                              <SelectItem value="Selection">
                                <div className="flex items-center">
                                  <List className="mr-2 h-4 w-4" />
                                  Selection
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-center gap-4">
                      <FormField
                        control={form.control}
                        name={`options.${index}.required`}
                        render={({ field }) => (
                          <FormItem className="space-x-2">
                            <div className="flex items-center gap-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="peer data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                                />
                              </FormControl>
                              <FormLabel className=" font-normal">
                                Required
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                      {!["Text", "Number"].includes(
                        form.watch(`options.${index}.type`)
                      ) && (
                        <FormField
                          control={form.control}
                          name={`options.${index}.settings.enableQuantity`}
                          render={({ field }) => (
                            <FormItem className="space-x-2">
                              <div className="flex items-center gap-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    className="peer data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                                  />
                                </FormControl>
                                <FormLabel className=" font-normal">
                                  Enable quantity
                                </FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                    {!["Text", "Number"].includes(
                      form.watch(`options.${index}.type`)
                    ) && (
                      <>
                        <Separator className="my-4" />

                        <div className="space-y-4">
                          {form
                            .watch(`options.${index}.settings.choices`)
                            ?.map((_, choiceIndex) => (
                              <div key={choiceIndex} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-medium">
                                    Choice {choiceIndex + 1}
                                  </h4>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const choices = form.getValues(
                                        `options.${index}.settings.choices`
                                      );
                                      const newChoices = choices.filter(
                                        (_, i) => i !== choiceIndex
                                      );
                                      form.setValue(
                                        `options.${index}.settings.choices`,
                                        newChoices
                                      );
                                    }}
                                    // disabled={
                                    //   form.watch(`options.${index}.choices`)
                                    //     ?.length <= 1
                                    // }
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="flex gap-2">
                                  <FormField
                                    control={form.control}
                                    name={`options.${index}.settings.choices.${choiceIndex}.name`}
                                    render={({ field }) => (
                                      <FormItem className="flex-1">
                                        <FormControl>
                                          <Input
                                            className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 ring-offset-blue-500 focus:ring-transparent"
                                            placeholder="Name"
                                            {...field}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name={`options.${index}.settings.choices.${choiceIndex}.amount`}
                                    defaultValue={0}
                                    render={({ field }) => (
                                      <FormItem className="w-32">
                                        <FormControl>
                                          <Input
                                            className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 ring-offset-blue-500 focus:ring-transparent"
                                            type="number"
                                            placeholder="Amount"
                                            {...field}
                                            value={field.value ?? ""}
                                            onChange={(e) => {
                                              const value =
                                                e.target.value === ""
                                                  ? null
                                                  : e.target.valueAsNumber;
                                              field.onChange(value);
                                            }}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              </div>
                            ))}
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            const choices =
                              form.getValues(
                                `options.${index}.settings.choices`
                              ) || [];
                            form.setValue(`options.${index}.settings.choices`, [
                              ...choices,
                              { name: "", amount: 0 },
                            ]);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add choice
                        </Button>
                      </>
                    )}

                    {form.watch(`options.${index}.type`) === "Checkbox" && (
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name={`options.${index}.settings.inputType`}
                          render={({ field }) => (
                            <FormItem>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 ring-offset-blue-500 focus:ring-transparent">
                                    <SelectValue placeholder="Select validation type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="not_applicable">
                                    Not applicable
                                  </SelectItem>
                                  <SelectItem value="min">
                                    Select at least
                                  </SelectItem>
                                  <SelectItem value="max">
                                    Select at most
                                  </SelectItem>
                                  <SelectItem value="minmax">
                                    Select between
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {form.watch(`options.${index}.settings.inputType`) ===
                          "min" && (
                          <FormField
                            control={form.control}
                            name={`options.${index}.settings.min`}
                            defaultValue={0}
                            shouldUnregister={true}
                            rules={{
                              validate: (value) => {
                                const type = form.getValues(
                                  `options.${index}.settings.inputType`
                                );
                                const choicesLength = form.getValues(
                                  `options.${index}.settings.choices.length`
                                );

                                if (
                                  type === "min" &&
                                  value > choicesLength
                                ) {
                                  return "Min must be less than or equal to number of choices";
                                }

                                return true;
                              },
                            }}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 ring-offset-blue-500 focus:ring-transparent"
                                    type="number"
                                    placeholder="At least"
                                    {...field}
                                    value={field.value ?? ""}
                                    onChange={(e) => {
                                      const value =
                                        e.target.value === ""
                                          ? null
                                          : e.target.valueAsNumber;
                                      field.onChange(value);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {form.watch(`options.${index}.settings.inputType`) ===
                          "max" && (
                          <FormField
                            control={form.control}
                            name={`options.${index}.settings.max`}
                            defaultValue={0}
                            shouldUnregister={true}
                            rules={{
                              validate: (value) => {
                                const type = form.getValues(
                                  `options.${index}.settings.inputType`
                                );
                                const choicesLength = form.getValues(
                                  `options.${index}.settings.choices.length`
                                );

                                if (
                                  type === "max" &&
                                  value > choicesLength
                                ) {
                                  return "Max must be greater than or equal to number of choices";
                                }

                                return true;
                              },
                            }}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 ring-offset-blue-500 focus:ring-transparent"
                                    type="number"
                                    placeholder="At most"
                                    {...field}
                                    value={field.value ?? ""}
                                    onChange={(e) => {
                                      const value =
                                        e.target.value === ""
                                          ? null
                                          : e.target.valueAsNumber;
                                      field.onChange(value);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {form.watch(`options.${index}.settings.inputType`) ===
                          "minmax" && (
                          <div className="flex gap-4">
                            <FormField
                              control={form.control}
                              name={`options.${index}.settings.min`}
                              defaultValue={0}
                              shouldUnregister={true}
                              rules={{
                                validate: (value) => {
                                  const type = form.getValues(
                                    `options.${index}.settings.inputType`
                                  );
                                  console.log(type);
                                  const choicesLength = form.getValues(
                                    `options.${index}.settings.choices.length`
                                  );

                                  if (
                                    type === "minmax" &&
                                    value > choicesLength
                                  ) {
                                    return "Min must be less than or equal to number of choices";
                                  }

                                  return true;
                                },
                              }}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl>
                                    <Input
                                      className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 ring-offset-blue-500 focus:ring-transparent"
                                      type="number"
                                      placeholder="Minimum"
                                      {...field}
                                      value={field.value ?? ""}
                                      onChange={(e) => {
                                        const value =
                                          e.target.value === ""
                                            ? null
                                            : e.target.valueAsNumber;
                                        field.onChange(value);
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`options.${index}.settings.max`}
                              defaultValue={0}
                              shouldUnregister={true}
                              rules={{
                                validate: (value) => {
                                  const type = form.getValues(
                                    `options.${index}.settings.inputType`
                                  );
                                  console.log(type);
                                  const choicesLength = form.getValues(
                                    `options.${index}.settings.choices.length`
                                  );

                                  if (
                                    type === "minmax" &&
                                    value > choicesLength
                                  ) {
                                    return "Max must be greater than or equal to number of choices";
                                  }

                                  return true;
                                },
                              }}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl>
                                    <Input
                                      className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 ring-offset-blue-500 focus:ring-transparent"
                                      type="number"
                                      placeholder="Maximum"
                                      {...field}
                                      value={field.value ?? ""}
                                      onChange={(e) => {
                                        const value =
                                          e.target.value === ""
                                            ? null
                                            : e.target.valueAsNumber;
                                        field.onChange(value);
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    appendOption({
                      type: "Text",
                      required: false,
                      // choices: [{ name: "", amount: 0 }],
                      // validation: {
                      //   type: "not_applicable",
                      //   // max: 0,
                      //   // min: 0,
                      // },
                    })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add option
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card ref={cardRef} className="scroll-mt-20">
            <CardHeader>
              <CardTitle>Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="trackQuantityEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Track quantity
                      </FormLabel>
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

              {trackQuantity && (
                <Input
                  type="number"
                  className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 ring-offset-blue-500 focus:ring-transparent"
                  placeholder="0.00"
                  {...form.register("inventory.quantity", {
                    valueAsNumber: true,
                  })}
                />
              )}

              {/* <FormField
                control={form.control}
                name="dailyCapacity"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Daily capacity
                      </FormLabel>
                      <FormDescription>
                        The maximum number of items you can sell per day
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

              {dailyCapacity && (
                <FormField
                  control={form.control}
                  name="dailyCapacityInventory.quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 ring-offset-blue-500 focus:ring-transparent"
                          placeholder="quantity"
                          type="number"
                          value={field.value === undefined ? "" : field.value}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(
                              value === "" ? undefined : parseFloat(value)
                            ); // Crucial
                          }}
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )} */}

              <FormField
                control={form.control}
                name="cartMaximumEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Maximum order quantity
                      </FormLabel>
                      <FormDescription>
                        The maximum number of items customers can buy per order
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

              {cartMaximumEnabled && (
                <Input
                  type="number"
                  className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 ring-offset-blue-500 focus:ring-transparent"
                  placeholder="0.00"
                  {...form.register("cartMaximum", {
                    valueAsNumber: true,
                  })}
                />
              )}

              <FormField
                control={form.control}
                name="cartMinimumEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Minimum order quantity
                      </FormLabel>
                      <FormDescription>
                        The minimum number of items customers should buy per
                        order
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

              {cartMinimumEnabled && (
                <Input
                  type="number"
                  className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 ring-offset-blue-500 focus:ring-transparent"
                  placeholder="0.00"
                  {...form.register("cartMinimum", {
                    valueAsNumber: true,
                  })}
                />
              )}

              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input
                        className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 ring-offset-blue-500 focus:ring-transparent"
                        placeholder="Enter SKU"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-700"
          >
            {id ? "Update" : "Save"}
          </Button>
        </form>
      </Form>
      {/* <DevTool control={form.control} /> */}
      <ToastContainer />
    </div>
  );
}
