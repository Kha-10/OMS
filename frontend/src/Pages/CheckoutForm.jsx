import { useState, useEffect, useRef, useMemo } from "react";
import {
  ChevronDown,
  Home,
  X,
  Search,
  Trash2,
  Minus,
  Plus,
  User,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogDescription,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm, Controller } from "react-hook-form";
import useCustomers from "@/hooks/useCustomers";
import useProducts from "@/hooks/useProducts";
import useOrders from "@/hooks/useOrders";
import { CustomDialogContent } from "@/components/ui/customDialog";
import { errorToast, showToast } from "@/helper/showToast";
import { ToastContainer, toast } from "react-toastify";
import { cn } from "@/lib/utils";
import { condoLists } from "@/helper/constant";
import axios from "@/helper/axios";
import { useParams } from "react-router-dom";

export default function CheckoutForm() {
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selection, setSelection] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [quantity, setQuantity] = useState(0);
  const [selectedNumberOption, setSelectedNumberOption] = useState({
    amount: null,
  });
  const [selectedTextOption, setSelectedTextOption] = useState({
    context: "",
  });
  const [numberError, setNumberError] = useState(false);
  const [textError, setTextError] = useState(false);
  const [selectionError, setSelectionError] = useState(false);
  const [checkboxError, setCheckboxError] = useState(false);
  const [showOptionError, setShowOptionError] = useState(false);

  const [isCustomerNameFocused, setIsCustomerNameFocused] = useState(false);

  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [showCondoError, setShowCondoError] = useState(false);
  const [showUnitError, setShowUnitError] = useState(false);

  const { id } = useParams();

  const { data } = useCustomers({});
  const customers = data?.data ?? [];
  const { data: fetchedProducts } = useProducts({});
  const products = fetchedProducts?.data ?? [];
  const { data: orders = [] } = useOrders({ id });
  console.log(orders);

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      customerName: "",
      customerPhone: "",
      servicePrice: 0,
      customerId: "",
      //   deliveryMethod: "kg",
      address: "",
      condoName: "",
      condoUnit: "",
      remark: "",
      adjustment: 0,
      orderItemsfromDb: [],
    },
    shouldFocusError: false,
  });

  // Watch form values
  const servicePrice = watch("servicePrice");
  const customerName = watch("customerName");
  const adjustmentPrice = watch("adjustment");

  const watchAddress = watch("address");
  const watchCondo = watch("condoName");
  const watchUnit = watch("condoUnit");

  useEffect(() => {
    if (id) {
      setValue("customerName", orders.customer?.name);
      setValue("customerPhone", orders.customer?.phoneNumber);
      setValue("servicePrice", orders.servicePrice);
      setValue("customerId", orders.customer?._id);
      setValue("address", orders.customer?.address);
      setValue("condoName", orders.customer?.condoName);
      setValue("condoUnit", orders.customer?.condoUnit);
      setValue("remark", orders.remark);
      setValue("adjustment", orders.adjustment);
      setValue("orderItemsfromDb", orders?.items);
      setSelectedItems(orders?.items);
    }
  }, [orders]);

  const saveAddress = () => {
    setShowCondoError(!watchCondo);
    setShowUnitError(!watchUnit);

    if (watchCondo && watchUnit) {
      setValue("address", `${watchCondo}, Unit ${watchUnit}`, {
        shouldValidate: true,
      });
      setAddressDialogOpen(false);
    }
  };

  const filteredCustomersByName = customerName
    ? customers.filter((customer) =>
        customer.name.toLowerCase().includes(customerName.toLowerCase())
      )
    : customers;

  const containerRef = useRef(null);
  const addressRef = useRef(null);

  const itemsPrice = selectedItems?.reduce(
    (total, item) => total + (item.price * (item.quantity || 1) || 0),
    0
  );

  const othersPrice = 0.0;

  // Calculate subtotal and total
  const [subtotal, setSubtotal] = useState(itemsPrice);
  const [total, setTotal] = useState(itemsPrice);

  // Update totals when prices change
  useEffect(() => {
    const servicePriceNumber = servicePrice
      ? Number.parseFloat(servicePrice)
      : 0;

    const adjustmentPriceNumber = adjustmentPrice
      ? Number.parseFloat(adjustmentPrice)
      : 0;

    const newSubtotal =
      itemsPrice + othersPrice + servicePriceNumber + adjustmentPriceNumber;

    setSubtotal(newSubtotal);
    setTotal(newSubtotal);
  }, [servicePrice, itemsPrice, othersPrice, adjustmentPrice]);

  const onError = (errors) => {
    if (errors.address) {
      addressRef.current.scrollIntoView({
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

  const handleAddItem = () => {
    setIsAddItemDialogOpen(true);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    if (product.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
    }
    setQuantity(1);
    setIsProductDetailOpen(true);
  };

  const handleAddToCart = () => {
    const options = selectedProduct?.options || [];

    let formHasError = false;
    const errors = {
      number: false,
      text: false,
      selection: false,
      checkbox: false,
    };
    const invalidCheckboxes = [];

    options.forEach((opt) => {
      if (opt.type === "Number" && opt.required) {
        if (
          selectedNumberOption?.amount === null ||
          selectedNumberOption?.amount === ""
        ) {
          errors.number = true;
          formHasError = true;
        }
      }

      if (opt.type === "Text" && opt.required) {
        if (!selectedTextOption?.context?.trim()) {
          errors.text = true;
          formHasError = true;
        }
      }

      if (opt.type === "Selection" && opt.required) {
        if (!selection || Object.keys(selection).length === 0) {
          errors.selection = true;
          formHasError = true;
        }
      }

      if (opt.type === "Checkbox" && opt.required) {
        const selectedForGroup = selectedOptions.filter(
          (item) => item.selectedOptionName === opt.name
        );

        const min = opt.validation?.atLeastMin ?? 1;
        const max = opt.validation?.atLeastMax;
        const betweenMin = opt.validation?.betweenMin;
        const betweenMax = opt.validation?.betweenMax;

        if (selectedForGroup.length < min) {
          formHasError = true;
          errors.checkbox = true;
          invalidCheckboxes.push(`Select at least ${min} for "${opt.name}"`);
        }

        if (max && selectedForGroup.length > max) {
          formHasError = true;
          errors.checkbox = true;
          invalidCheckboxes.push(
            `You can select at most ${max} for "${opt.name}"`
          );
        }

        if (betweenMax !== undefined) {
          if (
            selectedForGroup.length < betweenMin ||
            selectedForGroup.length > betweenMax
          ) {
            formHasError = true;
            errors.checkbox = true;
            invalidCheckboxes.push(
              `You must select between ${betweenMin} and ${betweenMax} for "${opt.name}"`
            );
          }
        } else if (betweenMin && selectedForGroup.length < betweenMin) {
          formHasError = true;
          errors.checkbox = true;
          invalidCheckboxes.push(
            `You must select at least ${betweenMin} for "${opt.name}"`
          );
        }
      }
    });

    if (formHasError) {
      setNumberError(errors.number);
      setTextError(errors.text);
      setSelectionError(errors.selection);
      setCheckboxError(errors.checkbox);
      setShowOptionError(true);
      return;
    }

    setNumberError(false);
    setTextError(false);
    setSelectionError(false);
    setCheckboxError(false);
    setShowOptionError(false);

    const itemToAdd = {
      ...selectedProduct,
      ...(selectedVariant && { selectedVariant }),
      ...(selection && { selection }),
      quantity,
      ...(selectedNumberOption?.amount && { selectedNumberOption }),
      ...(selectedTextOption?.context && { selectedTextOption }),
      ...(selectedOptions?.length > 0 && { selectedOptions }),
      price:
        (selectedVariant?.price ?? selectedProduct.price ?? 0) +
        (selection?.amount ?? 0) +
        (selectedOptions?.reduce((acc, opt) => acc + (opt.amount ?? 0), 0) ??
          0),
    };

    const areSelectedOptionsEqual = (opts1 = [], opts2 = []) => {
      if (!opts1?.length && !opts2?.length) return true;
      if (opts1?.length !== opts2?.length) return false;

      const sorted1 = [...opts1].sort((a, b) => a._id.localeCompare(b._id));
      const sorted2 = [...opts2].sort((a, b) => a._id.localeCompare(b._id));

      return sorted1.every((opt1, i) => {
        const opt2 = sorted2[i];
        return (
          opt1._id === opt2._id &&
          opt1.selectedOptionName === opt2.selectedOptionName &&
          opt1.name === opt2.name
        );
      });
    };

    const isSameItem = (item1, item2) => {
      return (
        item1._id === item2._id &&
        item1.selectedVariant?._id === item2.selectedVariant?._id &&
        areSelectedOptionsEqual(item1.selectedOptions, item2.selectedOptions)
      );
    };

    const existingIndex = selectedItems.findIndex((item) =>
      isSameItem(item, itemToAdd)
    );

    if (existingIndex !== -1) {
      const updatedItems = [...selectedItems];
      updatedItems[existingIndex].quantity += itemToAdd.quantity;
      setSelectedItems(updatedItems);
      console.log(updatedItems);
    } else {
      setSelectedItems([...selectedItems, itemToAdd]);
      console.log([...selectedItems, itemToAdd]);
    }

    handleCloseAllDialogs();
  };

  const inventoryValidation = (input) => {
    const isArrayInput = Array.isArray(input);
    const items = isArrayInput ? input : [input];
    // console.log("input", input);
    const validations = items.map((item) => {
      const itemQuantity = item?.quantity ?? quantity ?? 1;
      //   console.log("item", item);
      const inventoryQty =
        typeof item?.inventory === "number"
          ? item.inventory
          : item?.inventory?.quantity ?? 0;
      //   console.log("item.inventory", item?.inventory);
      //   console.log("item?.inventory?.quantity", item?.inventory?.quantity);
      const isInventoryAvailable =
        !item?.trackQuantityEnabled || inventoryQty >= itemQuantity;
      //   console.log("isInventoryAvailable", isInventoryAvailable);
      const isCartMaximumEnabled =
        !item?.cartMaximumEnabled || item?.cartMaximum >= itemQuantity;
      const isCartMinimumEnabled =
        !item?.cartMinimumEnabled || itemQuantity >= item?.cartMinimum;

      return {
        _id: item?._id,
        name: item?.name,
        variant: item?.selectedVariant?.name,
        isInventoryAvailable,
        isCartMaximumEnabled,
        isCartMinimumEnabled,
      };
    });

    return isArrayInput ? validations : validations[0];
  };

  const allDisabled =
    !selectedProduct?.trackQuantityEnabled ||
    !selectedProduct?.cartMaximumEnabled ||
    !selectedProduct?.cartMinimumEnabled;

  const { isInventoryAvailable, isCartMaximumEnabled, isCartMinimumEnabled } =
    inventoryValidation(selectedProduct);

  const showAddButton =
    allDisabled ||
    (isInventoryAvailable && isCartMaximumEnabled && isCartMinimumEnabled);

  const resetProductSelectionStates = () => {
    setSelectedProduct(null);
    setSelection(null);
    setSelectedVariant(null);
    setQuantity(1);
    setSelectedNumberOption({ amount: null });
    setSelectedTextOption({ context: "" });
    setSelectedOptions([]);
  };

  const handleCloseAllDialogs = () => {
    setIsProductDetailOpen(false);
    setIsAddItemDialogOpen(false);
    setSearchQuery("");
    resetProductSelectionStates();
    setShowOptionError(false);
  };

  const handleRemoveItem = (index) => {
    const newItems = [...selectedItems];
    newItems.splice(index, 1);
    setSelectedItems(newItems);
  };

  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleIncreaseQuantity = () => {
    setQuantity(quantity + 1);
  };

  const handleDecreaseCartItemQuantity = (index) => {
    const newItems = [...selectedItems];
    if (newItems[index].quantity > 1) {
      newItems[index].quantity -= 1;
      setSelectedItems(newItems);
    }
  };

  const handleIncreaseCartItemQuantity = (index) => {
    const newItems = [...selectedItems];
    newItems[index].quantity = (newItems[index].quantity || 1) + 1;
    setSelectedItems(newItems);
  };

  const handleCustomerNameFocus = () => {
    setIsCustomerNameFocused(true);
  };

  const handleCustomerNameBlur = () => {
    // Delay hiding the dropdown to allow for clicking on it
    setTimeout(() => {
      setIsCustomerNameFocused(false);
    }, 200);
  };

  const handleSelectCustomer = (customer) => {
    setValue("customerId", customer._id, {
      shouldValidate: true,
    });
    setValue("customerName", customer.name, { shouldValidate: true });
    setValue("customerPhone", customer.phoneNumber, {
      shouldValidate: true,
    });
    setValue("address", customer.address, {
      shouldValidate: true,
    });
    setValue("condoName", customer.condoName, {
      shouldValidate: true,
    });
    setValue("condoUnit", customer.condoUnit, {
      shouldValidate: true,
    });
    setIsCustomerNameFocused(false);
  };

  const onSubmit = async (data) => {
    const validations = inventoryValidation(selectedItems);
    const failed = validations.filter(
      (v) =>
        !v.isInventoryAvailable ||
        !v.isCartMaximumEnabled ||
        !v.isCartMinimumEnabled
    );

    if (failed.length) {
      failed.forEach(
        ({
          _id,
          isInventoryAvailable,
          isCartMaximumEnabled,
          isCartMinimumEnabled,
        }) => {
          const item = selectedItems.find((i) => i._id === _id);
          const name = item?.name || "Item";
          const variant = item?.selectedVariant?.name || "";
          if (!isInventoryAvailable) errorToast(`${name} is out of stock.`);
          if (!isCartMaximumEnabled)
            errorToast(`Order limit exceeded: ${name} - ${variant}`);
          if (!isCartMinimumEnabled)
            errorToast(`Order minimum not reached: ${name} - ${variant}`);
        }
      );
      return;
    }

    const wantedKeys = [
      "_id",
      "cartMaximum",
      "cartMinimum",
      "inventory",
      "name",
      "price",
      "quantity",
      "selectedOptions",
      "selectedVariant",
      "servicePrice",
      "trackQuantityEnabled",
      "selectedNumberOption",
      "photo",
    ];
    const cleanedItems = selectedItems.map((item) => {
      const newItem = {};
      wantedKeys.forEach((key) => {
        if (key === "inventory" && item.inventory) {
          newItem.inventory = item.inventory.quantity || item.inventory;
        } else if (item[key] !== undefined) {
          newItem[key] = item[key];
        }
      });
      newItem.productId = item._id;
      return newItem;
    });

    const newData = { ...data, cleanedItems, totalAmount: total };
    const toastId = toast.loading("Adding order...", {
      position: "top-center",
    });

    try {
      let res;

      if (id) {
        const itemsFromDb = getValues("orderItemsfromDb");
        const requiresInventoryAction = itemsFromDb.some(
          (item) => item.trackQuantityEnabled
        );

        const increaseQuantity = [];
        const decreaseQuantity = [];
        const newItems = [];
        const removedItems = [];

        for (const item of cleanedItems) {
          const match = itemsFromDb.find((i) => i._id === item._id);
          if (!match) {
            newItems.push(item);
          } else if (item.quantity > match.quantity) {
            increaseQuantity.push({
              _id: item._id,
              quantityDiff: item.quantity - match.quantity,
              updatedItem: item,
              trackQuantityEnabled: item.trackQuantityEnabled,
            });
          } else if (item.quantity < match.quantity) {
            decreaseQuantity.push({
              _id: item._id,
              quantityDiff: match.quantity - item.quantity,
              updatedItem: item,
              trackQuantityEnabled: item.trackQuantityEnabled,
            });
          }
        }

        // Detect removed items
        for (const originalItem of itemsFromDb) {
          const stillExists = cleanedItems.find(
            (i) => i._id === originalItem._id
          );
          if (!stillExists) {
            removedItems.push(originalItem);
          }
        }

        // Confirm inventory deductions
        if (
          requiresInventoryAction &&
          (increaseQuantity.length > 0 || newItems.length > 0)
        ) {
          const confirmDeduct = confirm(
            "Some items track inventory and have increased quantity or are newly added. Do you want to deduct inventory?"
          );
          if (confirmDeduct) {
            newData.shouldDeduct = true;
          }
        }
        console.log("requiresInventoryAction", requiresInventoryAction);
        console.log("decreaseQuantity", decreaseQuantity);
        console.log("removedItems", removedItems);
        // Confirm inventory restocks (decreased or removed)
        if (
          requiresInventoryAction &&
          (decreaseQuantity.length > 0 || removedItems.length > 0)
        ) {
          const confirmRestock = confirm(
            "Some items were removed or have decreased quantity. Do you want to restock inventory?"
          );
          if (confirmRestock) {
            newData.shouldRestock = true;
          }
        }

        const payload = {
          ...newData,
          newItems,
          increaseQuantity,
          decreaseQuantity,
          removedItems,
        };
        console.log(payload);
        res = await axios.patch(`/api/orders/${id}/edit`, payload);
      } else {
        res = await axios.post("/api/orders", newData);
      }

      if (res?.status === 200) {
        showToast(
          toastId,
          id ? "Order updated successfully" : "Order added successfully"
        );
        onError("error");
      }
    } catch (error) {
      console.log(error);
      console.error("Error handling order:", error.response?.data.msg);
      showToast(toastId, error.response?.data.msg, "error");
    }
  };

  const filteredProducts = useMemo(
    () =>
      products?.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [products, searchQuery]
  );

  const formatCurrency = (value) => {
    const num = Number(value);
    return isNaN(num) ? "$0.00" : `$${num.toFixed(2)}`;
  };

  const handleIncreaseAdjustment = () => {
    const currentValue = watch("adjustment")
      ? Number.parseFloat(watch("adjustment"))
      : 0;
    setValue("adjustment", currentValue + 1, {
      shouldValidate: true,
    });
  };

  const handleDecreaseAdjustment = () => {
    const currentValue = watch("adjustment")
      ? Number.parseFloat(watch("adjustment"))
      : 0;
    setValue("adjustment", currentValue - 1, {
      shouldValidate: true,
    });
  };

  const handleNumberChange = (e, name) => {
    const value =
      e.target.value === "" ? null : Number.parseInt(e.target.value);
    if (value === null || !isNaN(value)) {
      setSelectedNumberOption((prev) => ({
        ...prev,
        amount: value,
        name: name,
      }));
    }
  };

  const handleTextChange = (e, name) => {
    const value = e.target.value;
    setSelectedTextOption((prev) => ({
      ...prev,
      context: value,
      name: name,
    }));
  };

  const handleDecreaseNumber = (name) => {
    if (selectedNumberOption.amount && selectedNumberOption.amount > 0) {
      setSelectedNumberOption((prev) => ({
        ...prev,
        amount: prev.amount - 1,
        name: name,
      }));
    }
  };

  const handleIncreaseNumber = (name) => {
    setSelectedNumberOption((prev) => ({
      ...prev,
      amount: prev.amount + 1,
      name: name,
    }));
  };

  const quantityValue = Number(quantity) || 1;
  const optionTotal = selectedOptions?.reduce(
    (acc, item) => acc + (item.amount || 0),
    0
  );
  const basePrice =
    (selectedVariant?.price || selectedProduct?.price || 0) +
    optionTotal +
    (selection?.amount || 0);
  const totalPrice = basePrice * quantityValue;

  const isSoldOut =
    selectedProduct?.trackQuantityEnabled &&
    quantityValue > selectedProduct?.inventory?.quantity;

  return (
    <div ref={containerRef} className="min-h-screen flex flex-col">
      {/* Admin mode notification bar */}
      <div className="w-full bg-blue-400 text-white py-3 px-4 text-center">
        You are in <span className="font-medium">admin mode</span>.
      </div>

      {/* Main content */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-gray-500 text-2xl font-normal">Checkout</h2>
            <h1 className="text-3xl font-bold">Story Appetizers</h1>
          </div>
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <Home className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit, onError)}>
          {/* Customer Information */}
          <Card className="p-6 mb-6" id="customer-section">
            <div className="mb-6">
              <h2 className="text-lg font-medium mb-4">
                Customer <span className="text-red-500">*</span>
              </h2>

              <div className="mb-4 relative">
                <Label
                  htmlFor="customerName"
                  className={errors.customerName ? "text-red-500" : ""}
                >
                  Name
                </Label>
                <Input
                  id="customerName"
                  {...register("customerName", {
                    required: "Customer name is required",
                  })}
                  onFocus={handleCustomerNameFocus}
                  onBlur={handleCustomerNameBlur}
                  className={`mt-1 bg-card border-input w-full focus:ring-blue-500 focus:ring-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 focus:border-input focus:ring-ring ${
                    errors.customerName
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder=""
                  autoComplete="off"
                />

                {errors.customerName && (
                  <div className="flex items-center mt-1 text-red-500 text-sm">
                    {errors.customerName.message}
                  </div>
                )}

                {/* Existing customers dropdown - always show all customers */}
                {isCustomerNameFocused &&
                  filteredCustomersByName.length > 0 && (
                    <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredCustomersByName.map((customer) => (
                        <div
                          key={customer._id}
                          className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => handleSelectCustomer(customer)}
                        >
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                            <User className="h-4 w-4 text-gray-500" />
                          </div>
                          <div>
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-sm text-gray-500">
                              {customer.phoneNumber}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>

              <div>
                <Label
                  htmlFor="customerPhone"
                  className={errors.customerPhone ? "text-red-500" : ""}
                >
                  Phone number
                </Label>
                <div className="flex mt-1">
                  {/* <div className="relative">
                    <Button
                      type="button"
                      variant="outline"
                      className={`flex items-center justify-between h-10 px-3 rounded-l-md ${
                        errors.customerPhone
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    >
                      {countryCode} <ChevronDown className="ml-1 h-4 w-4" />
                    </Button>
                  </div> */}
                  <Input
                    id="customerPhone"
                    {...register("customerPhone", {
                      required: "Phone number is required",
                    })}
                    className={`flex-1 bg-card border-input w-full focus:ring-blue-500 focus:ring-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 focus:border-input focus:ring-ring ${
                      errors.customerPhone
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="Phone number"
                  />
                </div>

                {errors.customerPhone && (
                  <div className="flex items-center mt-1 text-red-500 text-sm">
                    {errors.customerPhone.message}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Items */}
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-medium mb-4">Items</h2>

            {selectedItems?.length > 0 && (
              <div className="mb-6">
                {selectedItems.map((item, index) => (
                  <div
                    key={`${item._id}-${item.selectedVariant?._id ?? ""}-${
                      item.selectedOptions?.map((opt) => opt._id).join("-") ??
                      ""
                    }-${index}`}
                    className="py-3 border-b"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        {item?.imgUrls?.length > 0 && (
                          <img
                            src={item.imgUrls}
                            alt={item.name}
                            className="w-10 h-10 mr-3 object-cover rounded"
                          />
                        )}
                        <div className="flex items-center space-x-2">
                          <span>{item.name}</span>
                          {item.selectedVariant && (
                            <>
                              <span>-</span>
                              <span className="text-sm text-gray-500">
                                {Array.isArray(item.selectedVariant)
                                  ? item.selectedVariant[0]?.name
                                  : item.selectedVariant.name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="flex items-center mr-4">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleDecreaseCartItemQuantity(index)
                            }
                            disabled={item.quantity <= 1}
                            className="h-6 w-6 p-0 border-gray-300"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <div className="w-8 text-center text-sm">
                            {item.quantity || 1}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleIncreaseCartItemQuantity(index)
                            }
                            className="h-6 w-6 p-0 border-gray-300"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="mr-4 w-16 text-right font-semibold">
                          {item.price
                            ? formatCurrency(item.price * (item.quantity || 1))
                            : "-"}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-500 hover:text-red-500"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2 px-16">
                      {item.selectedNumberOption &&
                        (Array.isArray(item.selectedNumberOption) ? (
                          item.selectedNumberOption.map((o) => (
                            <ul
                              key={o._id}
                              className="text-gray-500 list-disc text-sm font-light"
                            >
                              <li className="space-x-2">
                                <span>{o.name}</span>
                                <span>-</span>
                                <span>{o.amount}</span>
                              </li>
                            </ul>
                          ))
                        ) : (
                          <ul className="text-gray-500 list-disc text-sm font-light">
                            <li className="space-x-2">
                              <span>{item.selectedNumberOption.name}</span>
                              <span>-</span>
                              <span>{item.selectedNumberOption.amount}</span>
                            </li>
                          </ul>
                        ))}

                      {item.selection && (
                        <ul className="text-gray-500 list-disc text-sm font-light">
                          <li className="space-x-2">
                            <span>{item.selection.selectedOptionName}</span>
                            <span>-</span>
                            <span>{item.selection.name}</span>
                          </li>
                        </ul>
                      )}
                      {item.selectedOptions?.length > 0 && (
                        <ul className="text-gray-500 text-sm list-disc font-light">
                          <li>{item.selectedOptions[0]?.selectedOptionName}</li>
                        </ul>
                      )}
                      {item.selectedOptions?.length > 0 &&
                        item.selectedOptions.map((opt) => (
                          <ul
                            key={opt._id}
                            className="text-gray-500 text-sm font-light bg-gray-100 px-2 py-1 rounded-md w-fit"
                          >
                            <li className="space-x-2">
                              <span>{opt.name}</span>
                              <span>-</span>
                              <span>{opt.amount}</span>
                            </li>
                          </ul>
                        ))}
                      {item.selectedTextOption && (
                        <ul className="text-gray-500 list-disc text-sm font-light">
                          <li className="space-x-2">
                            <span>{item.selectedTextOption.name}</span>
                            <span>-</span>
                            <span>{item.selectedTextOption.context}</span>
                          </li>
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mb-8">
              <Button
                type="button"
                variant="outline"
                className="border-gray-300"
                onClick={handleAddItem}
              >
                Add item
              </Button>
            </div>
          </Card>
          {/* Delivery */}
          <Card className="p-6 mb-6" ref={addressRef}>
            <div className="space-y-2">
              <h2 className="text-lg font-medium mb-4">Delivery</h2>

              <Label
                htmlFor="address"
                className={cn(errors.address && "text-destructive")}
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
                {...register("address", {
                  required: "Address is required",
                })}
              />
              {errors.address && (
                <p className="text-sm text-destructive">
                  {errors.address.message}
                </p>
              )}
            </div>
          </Card>

          {/* Remark */}
          <Card className="p-6 mb-6 mt-6">
            <div className="-mx-6 -mt-6 bg-blue-400 text-white py-3 px-4 text-center mb-6 rounded-t-lg">
              Only available on Admin view
            </div>
            <div className="mb-6">
              <h2 className="text-lg font-medium mb-1">Remark</h2>
              <p className="text-gray-500 text-sm mb-4">Visible to customers</p>
              <Input
                placeholder="optional"
                className="bg-card border-input w-full focus:ring-blue-500 focus:ring-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 focus:border-input focus:ring-ring"
                {...register("remark")}
              />
            </div>
            <div>
              <h2 className="text-lg font-medium mb-1">Adjustment</h2>
              <p className="text-gray-500 text-sm mb-4">
                Add arbitrary amount to adjust the charges in invoice
              </p>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-gray-500">$</span>
                </div>
                <Input
                  type="number"
                  placeholder="0"
                  className="pl-7 pr-10 bg-card border-input w-full focus:ring-blue-500 focus:ring-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 focus:border-input focus:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  {...register("adjustment", { valueAsNumber: true })}
                />
                <div className="absolute inset-y-0 right-0 flex flex-col border-l border-gray-300">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-1/2 px-2 hover:bg-gray-100 rounded-none"
                    onClick={handleIncreaseAdjustment}
                  >
                    <ChevronDown className="h-4 w-4 rotate-180" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-1/2 px-2 hover:bg-gray-100 rounded-none"
                    onClick={handleDecreaseAdjustment}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Order Summary */}
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="font-medium">
                  Items ({selectedItems?.length})
                </span>
                <span className="font-medium">
                  {formatCurrency(itemsPrice)}
                </span>
              </div>

              {/* <div className="border-t border-dashed border-gray-200 pt-4">
                <div className="flex justify-between">
                  <span>Others</span>
                  <span>{formatCurrency(othersPrice)}</span>
                </div>
              </div> */}

              <div className="border-t border-dashed border-gray-200 pt-4">
                <div className="flex justify-between">
                  <span>Adjustment</span>
                  <span>{formatCurrency(adjustmentPrice)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span>Service</span>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                    <span className="text-blue-600">$</span>
                  </div>
                  <Input
                    type="number"
                    className="w-20 h-8 text-right pl-6 p-1 border-none text-blue-600 font-medium bg-card border-input focus:ring-blue-500 focus:ring-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 focus:border-input focus:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:outline-none"
                    placeholder="0.00"
                    {...register("servicePrice", { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="border-t border-dashed border-gray-200 pt-4">
                <div className="flex justify-between">
                  <span className="font-medium">Subtotal</span>
                  <span className="font-medium">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-300 pt-4">
                <div className="flex justify-between">
                  <span className="text-xl font-bold">Total</span>
                  <span className="text-xl font-bold">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Save button */}
          <Button
            type="submit"
            className="w-full py-6 bg-blue-500 hover:bg-blue-600 text-white"
          >
            {id ? "Update" : "Save"}
          </Button>
        </form>
      </div>

      {/* Add Item Dialog */}
      <Dialog
        open={isAddItemDialogOpen && !isProductDetailOpen}
        onOpenChange={setIsAddItemDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="flex justify-between items-center">
            <DialogTitle>Add item</DialogTitle>
            <DialogDescription>{}</DialogDescription>
          </DialogHeader>

          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by Product name"
              className="pl-10 bg-card border-input w-full focus:ring-blue-500 focus:ring-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 focus:border-input focus:ring-ring"
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <div
                  key={product._id}
                  className="p-4 border-b border-gray-200 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSelectProduct(product)}
                >
                  <div className="w-full">
                    <div
                      className={`font-medium ${
                        product.trackQuantityEnabled &&
                        product.inventory.quantity < 1
                          ? "text-gray-400"
                          : ""
                      }`}
                    >
                      {product.name}
                    </div>
                    <div
                      className={`flex items-center gap-3 ${
                        product.trackQuantityEnabled &&
                        product.inventory.quantity < 1
                          ? "text-gray-400"
                          : ""
                      }`}
                    >
                      <p>
                        {formatCurrency(
                          product.variants?.[0]?.price ?? product.price
                        )}
                      </p>
                      {product.trackQuantityEnabled &&
                        product.inventory.quantity < 1 && (
                          <p
                            className={`text-sm ${
                              product.trackQuantityEnabled &&
                              product.inventory.quantity < 1
                                ? "text-red-400"
                                : ""
                            }`}
                          >
                            Sold out
                          </p>
                        )}
                    </div>
                  </div>

                  {product.imgUrls.length > 0 && (
                    <img
                      src={product.imgUrls[0]}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center">
                No products found.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Detail Dialog */}
      <Dialog
        open={isProductDetailOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseAllDialogs();
          }
        }}
      >
        <CustomDialogContent
          className={`sm:max-w-md p-0 bg-gray-100 overflow-y-auto ${
            selectedProduct?.imgUrls.length > 0 ? "h-[700px]" : ""
          }`}
          aria-describedby="product-description"
        >
          <DialogHeader>
            <DialogTitle className="hidden"></DialogTitle>
            <DialogDescription className="sr-only hidden"></DialogDescription>
          </DialogHeader>
          <div className="relative">
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsProductDetailOpen(false);
                  setIsAddItemDialogOpen(false);
                }}
                className="h-8 w-8 p-0 absolute right-2 top-2 z-10 bg-white hover:bg-slate-50 shadow-xl rounded-lg"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>

            <div className="bg-gray-100 py-[80px]">
              {selectedProduct?.imgUrls.length > 0 && (
                <img
                  src={selectedProduct.imgUrls}
                  alt={selectedProduct.name}
                  className="w-full object-cover"
                />
              )}
            </div>
          </div>

          <div className="p-6 bg-white">
            <h2 className="text-xl font-bold mb-4">{selectedProduct?.name}</h2>
            {selectedProduct?.variants &&
              selectedProduct.variants.length > 0 && (
                <RadioGroup
                  value={selectedVariant?._id}
                  onValueChange={(value) => {
                    const variant = selectedProduct.variants.find(
                      (v) => v._id === value
                    );
                    setSelectedVariant(variant);
                  }}
                  className="mb-6"
                >
                  {selectedProduct.variants.map((variant) => (
                    <div
                      key={variant._id}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center">
                        <RadioGroupItem
                          className="h-5 w-5 border-[1.5px] border-gray-300 
                        before:h-2 before:w-2 before:bg-white
                        data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500
                        data-[state=checked]:before:bg-white text-white"
                          value={variant._id}
                          id={variant._id}
                        />
                        <Label htmlFor={variant._id} className="ml-2">
                          {variant.name}
                        </Label>
                      </div>
                      <div>
                        <div className="font-medium">
                          ${variant.price.toFixed(2)}
                        </div>
                        <div className="font-medium text-sm text-gray-400 line-through">
                          ${variant.originalPrice.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              )}
            {selectedProduct?.options.length > 0 &&
              selectedProduct.options.map(
                (opt) =>
                  opt.type === "Number" && (
                    <div key={opt._id} className="mb-6">
                      <Label
                        htmlFor="customNumber"
                        className="font-medium block mb-2"
                      >
                        {opt.name}{" "}
                        {opt.required && (
                          <span className="text-red-500">*</span>
                        )}
                      </Label>
                      <div className="relative">
                        <Input
                          id="numberCustomValue"
                          type="number"
                          value={
                            selectedNumberOption.amount === null
                              ? ""
                              : selectedNumberOption.amount
                          }
                          onChange={(e) => handleNumberChange(e, opt.name)}
                          className="pr-8 bg-card border-input w-full focus:ring-blue-500 focus:ring-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 focus:border-input focus:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          min={0}
                          placeholder=""
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                          <ChevronDown
                            className="h-3 w-3 rotate-180 cursor-pointer"
                            onClick={() => handleIncreaseNumber(opt.name)}
                          />
                          <ChevronDown
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => handleDecreaseNumber(opt.name)}
                          />
                        </div>
                      </div>
                      {showOptionError && numberError && (
                        <span className="text-red-500 text-xs">
                          Select an opition
                        </span>
                      )}
                    </div>
                  )
              )}
            {selectedProduct?.options.length > 0 &&
              selectedProduct.options.map(
                (opt) =>
                  opt.type === "Text" && (
                    <div key={opt._id} className="mb-6">
                      <Label
                        htmlFor="customNumber"
                        className="font-medium block mb-2"
                      >
                        {opt.name}{" "}
                        {opt.required && (
                          <span className="text-red-500">*</span>
                        )}
                        {!opt.required && (
                          <span className="text-gray-400 font-light text-xs">
                            (Optional)
                          </span>
                        )}
                      </Label>
                      <div className="relative">
                        <Input
                          id="numberCustomValue"
                          type="text"
                          value={selectedTextOption.context}
                          onChange={(e) => handleTextChange(e, opt.name)}
                          className="bg-card border-input w-full focus:ring-blue-500 focus:ring-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 focus:border-input focus:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder=""
                        />
                      </div>
                      {showOptionError && textError && (
                        <span className="text-red-500 text-xs">
                          Select an opition
                        </span>
                      )}
                    </div>
                  )
              )}

            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div>
                  <div className="font-medium">Quantity</div>
                  {selectedProduct?.cartMinimumEnabled &&
                    selectedProduct?.cartMaximumEnabled && (
                      <div className="text-gray-400 text-sm space-x-1">
                        <span>min {selectedProduct?.cartMinimum},</span>
                        <span>max {selectedProduct?.cartMaximum}</span>
                      </div>
                    )}
                </div>
                {selectedProduct?.trackQuantityEnabled &&
                  selectedProduct?.inventory.quantity <= 5 && (
                    <Badge variant="secondary" className="text-gray-500">
                      {selectedProduct.inventory.quantity < 1
                        ? "Sold out"
                        : `${selectedProduct.inventory.quantity} left`}
                    </Badge>
                  )}
              </div>
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDecreaseQuantity}
                  disabled={quantity <= 1}
                  className="h-8 w-8 p-0"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="w-10 text-center">{quantity}</div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleIncreaseQuantity}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {selectedProduct?.options.length > 0 &&
              selectedProduct.options.map(
                (opt) =>
                  opt.type === "Selection" && (
                    <div className="mb-6" key={opt._id}>
                      <Label
                        htmlFor={opt._id}
                        className="font-medium block mb-2"
                      >
                        {opt.name}{" "}
                        {opt.required && (
                          <span className="text-red-500">*</span>
                        )}
                      </Label>
                      {opt.choices.length > 0 && (
                        <RadioGroup
                          value={selection?._id}
                          onValueChange={(value) => {
                            const selected = opt.choices.find(
                              (choice) => choice._id === value
                            );
                            setSelection({
                              ...selected,
                              selectedOptionName: opt.name,
                            });
                          }}
                        >
                          {opt.choices.map((choice) => (
                            <div
                              key={choice._id}
                              className="flex items-center justify-between py-2"
                            >
                              <div className="flex items-center">
                                <RadioGroupItem
                                  className="h-5 w-5 border-[1.5px] border-gray-300 
                              before:h-2 before:w-2 before:bg-white
                              data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500
                              data-[state=checked]:before:bg-white text-white"
                                  value={choice._id}
                                  id={choice._id}
                                />
                                <Label htmlFor={choice._id} className="ml-2">
                                  {choice.name}
                                </Label>
                              </div>
                              <div className="font-medium">
                                ${choice.amount.toFixed(2)}
                              </div>
                            </div>
                          ))}
                        </RadioGroup>
                      )}
                      {showOptionError && selectionError && (
                        <span className="text-red-500 text-xs">
                          Select an opition
                        </span>
                      )}
                    </div>
                  )
              )}
            {selectedProduct?.options.length > 0 &&
              selectedProduct.options.map(
                (opt) =>
                  opt.type === "Checkbox" && (
                    <div className="mb-6" key={opt._id}>
                      <Label
                        htmlFor={opt._id}
                        className="font-medium block mb-2"
                      >
                        {opt.name}{" "}
                        {opt.required && (
                          <span className="text-red-500">*</span>
                        )}
                      </Label>
                      {opt.validation.type === "at_most" && (
                        <span className="text-sm text-gray-500">
                          Select up to {opt.validation.atLeastMax}
                        </span>
                      )}
                      {opt.validation.type === "at_least" && (
                        <span className="text-sm text-gray-500">
                          {opt.validation.atLeastMin < 1
                            ? "Optional"
                            : `Select at least ${opt.validation.atLeastMin}`}
                        </span>
                      )}
                      {opt.validation.type === "between" && (
                        <span className="text-sm text-gray-500">
                          Select at least {opt.validation.betweenMin} and up to{" "}
                          {opt.validation.betweenMax}
                        </span>
                      )}
                      {opt.choices.length > 0 && (
                        <div className="space-y-2">
                          {opt.choices.map((choice) => {
                            const isChecked = selectedOptions?.some(
                              (item) => item._id === choice._id
                            );

                            const maxLimit =
                              opt.validation?.atLeastMax ??
                              opt.validation?.betweenMax;

                            const selectedCountForGroup =
                              selectedOptions?.filter(
                                (item) => item.selectedOptionName === opt.name
                              ).length ?? 0;

                            const isMaxReached =
                              maxLimit !== undefined &&
                              selectedCountForGroup >= maxLimit;

                            const isDisabled = !isChecked && isMaxReached;

                            return (
                              <div
                                key={choice._id}
                                className="flex items-center justify-between py-2"
                              >
                                <div className="flex items-center">
                                  <Checkbox
                                    id={choice._id}
                                    className="peer data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 border-gray-300"
                                    checked={isChecked}
                                    disabled={isDisabled}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedOptions((prev) => [
                                          ...prev,
                                          {
                                            ...choice,
                                            selectedOptionName: opt.name,
                                          },
                                        ]);
                                      } else {
                                        setSelectedOptions((prev) =>
                                          prev.filter(
                                            (item) => item._id !== choice._id
                                          )
                                        );
                                      }
                                    }}
                                  />
                                  <Label htmlFor={choice._id} className="ml-2">
                                    {choice.name}
                                  </Label>
                                </div>
                                <div className="font-medium">
                                  ${choice.amount.toFixed(2)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {showOptionError &&
                        checkboxError &&
                        opt.validation.type === "at_least" &&
                        selectedOptions.length < opt.validation.atLeastMin && (
                          <span className="text-red-500 text-xs">
                            Select an option
                          </span>
                        )}

                      {showOptionError &&
                        checkboxError &&
                        opt.validation.type === "at_most" &&
                        selectedOptions.length < 1 && (
                          <span className="text-red-500 text-xs">
                            Select an option
                          </span>
                        )}

                      {showOptionError &&
                        checkboxError &&
                        opt.validation.type === "between" && (
                          <span className="text-red-500 text-xs">
                            Select at least {opt.validation.betweenMin} and up
                            to {opt.validation.betweenMax}
                          </span>
                        )}
                    </div>
                  )
              )}
            <div className="p-3 border-t border-gray-200 sticky bottom-0 bg-white">
              <Button
                className={`w-full py-6 text-white bg-blue-500 hover:bg-blue-600 ${
                  !showAddButton || isSoldOut
                    ? "cursor-not-allowed opacity-50"
                    : ""
                }`}
                onClick={
                  isSoldOut || !showAddButton ? undefined : handleAddToCart
                }
              >
                {isSoldOut
                  ? `Sold Out ${formatCurrency(totalPrice)}`
                  : `Add ${formatCurrency(totalPrice)}`}
              </Button>
            </div>
          </div>
        </CustomDialogContent>
      </Dialog>
      {/* Address Dialog */}
      <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
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
                control={control}
                rules={{ required: "Condo name is required" }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger
                      className={cn(
                        "border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-0",
                        { "border-destructive": showUnitError }
                      )}
                    >
                      <SelectValue placeholder="Select Condo" />
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="max-h-60 overflow-y-auto">
                        {condoLists.length &&
                          condoLists.map((condo, i) => (
                            <div key={i}>
                              <SelectItem value={condo}>{condo}</SelectItem>
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
              value={getValues("condoUnit")}
              onChange={(e) => {
                setValue("condoUnit", e.target.value);
                if (e.target.value) setShowUnitError(false);
              }}
            />
            <span className="text-gray-400 text-xs">e.g. Building A,B,1,2</span>
            {showUnitError && (
              <p className="text-sm text-destructive">Unit is required</p>
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
      <ToastContainer />
    </div>
  );
}
