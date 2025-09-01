import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Package,
  ShoppingCart,
  Check,
  Search,
  X,
  User,
  MapPin,
  Plus,
  Minus,
  Percent,
  Edit,
  Trash2,
  Undo2,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import debounce from "lodash.debounce";
import useCustomers from "@/hooks/useCustomers";
import useProducts from "@/hooks/useProducts";
import useCategories from "@/hooks/useCategories";
import { useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import axios from "@/helper/axios";
import { DevTool } from "@hookform/devtools";
import { useSelector, useDispatch } from "react-redux";
import { discardCart } from "@/features/cart/cartSlice";
import { toast } from "sonner";
import NewToaster from "@/components/NewToaster";
import { formatWithCurrency } from "@/helper/currencyCoverter";

// Form schemas
const customerFormSchema = z.object({
  customerId: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  // email: z.string().email("Valid email is required"),
  // phone: z.string().min(1, "Phone is required"),
  email: z.string().optional(),
  phone: z.string().optional(),
  deliveryAddressId: z.string().optional(),
  newDeliveryAddress: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      condoName: z.string().optional(),
      buildinUnit: z.string().optional(),
    })
    .optional(),
});

const createFormSchema = (product) => {
  return z.object({
    quantity: z.preprocess((val) => {
      if (val === "" || val === null || val === undefined) {
        return 0;
      }
      const parsed = typeof val === "string" ? parseFloat(val) : val;
      return isNaN(parsed) ? 0 : parsed;
    }, z.number({ invalid_type_error: "Quantity must be a number" }).min(1, "Quantity must be at least 1")),
    // variantId: z.string().min(1, "Product variant is required"),
    variantId: z
      .string()
      .optional()
      .superRefine((val, ctx) => {
        if (product.variants?.length > 0 && (!val || val.trim() === "")) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Product variant is required",
          });
        }
      }),
    totalPrice: z.number().optional(),
    options: z
      .array(
        z.object({
          name: z.string(),
          answers: z
            .array(z.union([z.string(), z.number()]))
            .default([])
            .optional()
            .refine(
              (arr) =>
                arr === undefined ||
                arr.every((val) => val !== undefined && val !== null),
              { message: "Invalid answer value" }
            ),

          prices: z.array(z.number()).default([]).optional(),
          quantities: z.array(z.number()).default([]).optional(),
        })
      )
      .superRefine((options, ctx) => {
        // Validate each option
        options.forEach((optionData, optionIndex) => {
          const optionMeta = product.options.find(
            (o) => o.name === optionData.name
          );

          if (!optionMeta) {
            return;
          }

          // Skip validation for non-required options
          if (!optionMeta.required) {
            return;
          }

          const { type } = optionMeta;
          const answers = optionData.answers || [];

          // Handle Text type
          if (type === "Text") {
            const hasValidAnswer =
              answers.length > 0 &&
              answers[0] !== undefined &&
              answers[0] !== null &&
              answers[0] !== "" &&
              typeof answers[0] === "string" &&
              answers[0].trim() !== "";

            if (!hasValidAnswer) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: [optionIndex, "answers", 0],
                message: "This field is required",
              });
            }
          }

          // Handle Number type
          if (type === "Number") {
            const hasValidAnswer =
              answers.length > 0 &&
              answers[0] !== undefined &&
              answers[0] !== null &&
              answers[0] !== "" &&
              typeof answers[0] === "number" &&
              !isNaN(answers[0]);

            if (!hasValidAnswer) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: [optionIndex, "answers", 0],
                message: "Please enter a valid number",
              });
            }
          }

          // Handle Selection type
          if (type === "Selection") {
            const hasValidAnswer =
              answers.length > 0 &&
              answers[0] !== undefined &&
              answers[0] !== null &&
              answers[0] !== "";

            console.log("Selection validation:", {
              hasValidAnswer,
              answersLength: answers.length,
              firstAnswer: answers[0],
              answersArray: answers,
            });

            if (!hasValidAnswer) {
              console.log("Adding validation error for Selection field");
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: [optionIndex, "answers", 0],
                message: "Please select an option",
              });
            }
          }

          // Handle Checkbox type (keeping your existing logic)
          if (type === "Checkbox") {
            const settings = optionMeta.settings;
            if (settings?.inputType === "not_applicable") return;

            const selectedCount = answers.length;
            console.log("answers", answers);
            console.log("selectedCount", selectedCount);
            if (selectedCount > 0 && answers[0] === "") {
              console.log("shit");
              if (settings?.inputType === "min") {
                const minRequired = settings.min || 1;
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  path: [optionIndex, "answers"],
                  message: `Select at least ${minRequired}`,
                });
              } else if (settings?.inputType === "max") {
                const maxAllowed = settings.max || 1;
                if (selectedCount > maxAllowed) {
                  ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: [optionIndex, "answers"],
                    message: `You can select up to ${maxAllowed}`,
                  });
                }
              } else if (settings?.inputType === "minmax") {
                const min = settings.min || 1;
                const max = settings.max || Infinity;
                if (selectedCount < min || selectedCount > max) {
                  ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: [optionIndex, "answers"],
                    message: `You can select between ${min} and ${max}`,
                  });
                }
              } else {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  path: [optionIndex, "answers"],
                  message: "Select an option",
                });
              }
            }
          }
        });
      }),
  });
};

export default function AddToCart({ currency }) {
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentView, setCurrentView] = useState("products");
  const [currentItemPrice, setCurrentItemPrice] = useState(0);

  const [selectedCategory, setSelectedCategory] = useState({ name: "all" });
  const [pricingAdjustments, setPricingAdjustments] = useState([]);
  const [isNewCustomer, setIsNewCustomer] = useState(false);

  // Add orderNotes state after the useNewShippingAddress state
  const [orderNotes, setOrderNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [cartButtonAnimation, setCartButtonAnimation] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  const { id } = useParams();
  const dispatch = useDispatch();
  const { discardSuccess } = useSelector((state) => state.carts);

  const { stores } = useSelector((state) => state.stores);
  const storeId = stores?.[0]?._id;

  const { data: { data: customersfromDb = [] } = {} } = useCustomers({
    all: true,
  });
  const { data: { data: productsfromDb = [], pagination = {} } = {} } =
    useProducts({ categories: selectedCategory._id, searchQuery, all: true });
  const { data: { data: categoriesfromDb = [] } = {} } = useCategories({
    all: true,
  });

  const containerRef = useRef(null);

  const customerForm = useForm({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      customerId: "",
      name: "",
      phone: "",
      email: "",
      deliveryAddress: {
        apartment: "",
        city: "",
        street: "",
        zipCode: "",
      },
    },
  });

  const defaultValuesFromProduct = (product) => ({
    quantity: 1,
    variantId: "",
    options:
      product?.options?.map((opt) => ({
        name: opt.name,
        answers: [""],
        prices: [0],
        quantities: [1],
      })) || [],
  });

  const productForm = useForm({
    mode: "onSubmit",
    resolver: selectedProduct
      ? zodResolver(createFormSchema(selectedProduct))
      : undefined,
    defaultValues: defaultValuesFromProduct(selectedProduct),
  });

  useEffect(() => {
    if (selectedProduct) {
      productForm.reset(defaultValuesFromProduct(selectedProduct));
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (id) {
      loadOrder();
    }
  }, [id]);

  const loadOrder = async () => {
    let orderId = id;
    const res = await axios(
      `/api/stores/${storeId}/orders/${orderId}/load-as-cart`
    );
    if (res.status === 200) {
      console.log("resloadOrder", res.data.cart);
      const orderDetails = res.data.cart.order;
      sessionStorage.setItem("adminCartId", res.data.cart.id);
      setCart([...orderDetails.items]);
      customerForm.setValue("customerId", orderDetails?.customer?._id);
      customerForm.setValue(
        "name",
        orderDetails?.customer?.name || orderDetails?.manualCustomer?.name
      );
      customerForm.setValue(
        "email",
        orderDetails?.customer?.email || orderDetails?.manualCustomer?.email
      );
      customerForm.setValue(
        "phone",
        orderDetails?.customer?.phone || orderDetails?.manualCustomer?.phone
      );
      customerForm.setValue(
        "deliveryAddress",
        orderDetails?.customer?.deliveryAddress ||
          orderDetails?.manualCustomer?.deliveryAddress
      );
      customerForm.setValue(
        "deliveryAddress.apartment",
        orderDetails?.customer?.deliveryAddress?.apartment ||
          orderDetails?.manualCustomer?.deliveryAddress?.apartment
      );
      customerForm.setValue(
        "deliveryAddress.city",
        orderDetails?.customer?.deliveryAddress?.city ||
          orderDetails?.manualCustomer?.deliveryAddress?.city
      );
      customerForm.setValue(
        "deliveryAddress.street",
        orderDetails?.customer?.deliveryAddress?.street ||
          orderDetails?.manualCustomer?.deliveryAddress?.street
      );
      customerForm.setValue(
        "deliveryAddress.zipCode",
        orderDetails?.customer?.deliveryAddress?.zipCode ||
          orderDetails?.manualCustomer?.deliveryAddress?.zipCode
      );
      setOrderNotes([...orderDetails?.notes]);
      setPricingAdjustments([...orderDetails?.pricing?.adjustments]);
      setSelectedProduct(null);
      setCurrentView("cart");
      productForm.reset();

      setCartButtonAnimation(true);
      setTimeout(() => setCartButtonAnimation(false), 1000);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const calculateItemPrice = (product, formValues) => {
    let baseItemPrice = product.price || product.originalPrice || 0;

    // Check variant override price
    if (formValues.variantId) {
      const variant = product.variants?.find(
        (v) => v._id === formValues.variantId
      );
      if (variant && typeof variant.price === "number") {
        baseItemPrice = variant.price;
      }
    }

    // Calculate total option price (this should NOT be multiplied by inventory quantity)
    let optionPrice = 0;
    formValues.options?.forEach((option, i) => {
      const { answers, prices, quantities } = option;
      if (!answers || !prices) return;

      // Filter out undefined/empty answers before processing
      answers
        .filter(
          (answer) => answer !== undefined && answer !== null && answer !== ""
        )
        .forEach((answer, idx) => {
          const quantity = quantities?.[idx] || 1;
          const price = prices?.[idx] || 0;
          optionPrice += price * quantity;
        });
    });

    // Add option price to base price, then multiply by inventory quantity
    const inventoryQuantity = formValues.quantity || 1;
    const totalPrice = baseItemPrice * inventoryQuantity + optionPrice;

    return totalPrice;
  };

  // Calculate cart subtotal
  const calculateCartSubtotal = () => {
    return cart.reduce((total, item) => total + item.totalPrice, 0);
  };

  // Calculate final total with adjustments
  const calculateFinalTotal = () => {
    let total = calculateCartSubtotal();
    console.log("total", total);

    pricingAdjustments.forEach((adjustment) => {
      if (adjustment.isPercentage) {
        if (adjustment.type === "discount") {
          total = total * (1 - adjustment.value / 100);
        } else {
          total = total * (1 + adjustment.value / 100);
        }
      } else {
        if (adjustment.type === "discount") {
          total -= adjustment.value;
        } else {
          total += adjustment.value;
        }
      }
    });

    return Math.max(0, total);
  };

  useEffect(() => {
    if (selectedProduct) {
      const subscription = productForm.watch((formValues) => {
        const price = calculateItemPrice(selectedProduct, formValues);
        setCurrentItemPrice(price);
      });

      // Set initial price
      const price = calculateItemPrice(
        selectedProduct,
        productForm.getValues()
      );
      setCurrentItemPrice(price);

      return () => subscription.unsubscribe();
    }
  }, [selectedProduct, productForm]);

  // Add these functions before the handleCustomerSelect function
  const addOrderNote = () => {
    if (newNote.trim()) {
      const note = {
        id: Date.now().toString(),
        content: newNote.trim(),
        createdAt: new Date(),
        author: "Admin User", // In a real app, this would be the current user
      };
      setOrderNotes([...orderNotes, note]);
      setNewNote("");
    }
  };

  const removeOrderNote = (id) => {
    setOrderNotes(orderNotes.filter((note) => note.id !== id));
  };

  function getOrCreateIdempotencyKey() {
    let cartId = sessionStorage.getItem("idempotencyKey");
    if (!cartId) {
      cartId = uuidv4();
      sessionStorage.setItem("idempotencyKey", cartId);
    }
    return cartId;
  }

  function clearAll() {
    sessionStorage.removeItem("adminCartId");
    sessionStorage.removeItem("idempotencyKey");
  }

  const cartId = sessionStorage.getItem("adminCartId");

  const addToCart = async (formData) => {
    if (!selectedProduct || isSoldOut) return;
    formData.options.forEach((opt) => {
      if (
        Array.isArray(opt.answers) &&
        opt.answers.length === 1 &&
        opt.answers[0] === ""
      ) {
        opt.answers = [];
        opt.prices = [];
        opt.quantities = [];
      }
    });

    // Extract selected variant
    const variant = selectedProduct.variants.find(
      (v) => v._id === formData.variantId
    );

    // Pricing calculation
    const basePrice =
      variant?.price ??
      selectedProduct.price ??
      selectedProduct.originalPrice ??
      0;

    // const cartId = getOrCreateCartId();
    let cartId = sessionStorage.getItem("adminCartId");

    const cartItem = {
      cartId,
      items: {
        cartMinimum: selectedProduct?.cartMinimum,
        cartMaximum: selectedProduct?.cartMaximum,
        categories: selectedProduct?.categories,
        imgUrls: selectedProduct?.imgUrls,
        ...formData,
        productId: selectedProduct._id,
        trackQuantityEnabled: selectedProduct.trackQuantityEnabled,
        productName: variant?.name
          ? `${selectedProduct.name} - ${variant.name}`
          : selectedProduct.name,
        photo: selectedProduct?.photo,
        productinventory: selectedProduct?.inventory?.quantity,
      },
      basePrice,
      totalPrice: currentItemPrice,
    };

    try {
      const res = await axios.post(`/api/stores/${storeId}/cart`, cartItem);
      if (res.status === 200) {
        // const data = id ? res.data.cart.order?.items : res.data.cart.items;
        const data = res.data.cart.items;
        sessionStorage.setItem("adminCartId", res.data.cart.id);
        console.log(res);
        setCart([...data]);
        setSelectedProduct(null);
        setCurrentView("cart");
        productForm.reset();

        setCartButtonAnimation(true);
        setTimeout(() => setCartButtonAnimation(false), 1000);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (error) {
      console.error("Failed to add to cart:", error);
    }
  };

  const updateCartItemQuantity = async (productId, variantId, newQuantity) => {
    if (newQuantity < 1) return;
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.productId !== productId && item.variantId === variantId)
          return item;

        const optionsExtra =
          item.options?.reduce((acc, option) => {
            return acc + option.prices.reduce((sum, p) => sum + p, 0);
          }, 0) || 0;

        const newTotalPrice = item.basePrice * newQuantity + optionsExtra;

        return {
          ...item,
          quantity: newQuantity,
          totalPrice: newTotalPrice,
        };
      })
    );

    try {
      const cartId = sessionStorage.getItem("adminCartId");
      if (!cartId) throw new Error("Missing adminCartId");

      await axios.patch(`/api/stores/${storeId}/cart/${cartId}`, {
        productId,
        variantId,
        quantity: newQuantity,
      });
    } catch (error) {
      console.error("❌ Failed to sync with Redis:", error);
    }
  };

  const updateCartItemOptionQuantity = async (
    productId,
    variantId,
    optionName,
    answerValue,
    newQuantity
  ) => {
    if (newQuantity < 1) return;

    // Optimistic UI update
    setCart((prevCart) => {
      return prevCart.map((item) => {
        if (item.productId !== productId || item.variantId !== variantId)
          return item;

        const updatedOptions = item.options.map((option) => {
          if (option.name !== optionName) return option;

          const answerIndex = option.answers.findIndex(
            (a) => a === answerValue
          );
          if (answerIndex === -1) return option;

          // Update quantity
          const newQuantities = [...option.quantities];
          const prevQuantity = option.quantities[answerIndex] || 0;
          newQuantities[answerIndex] = newQuantity;

          const pricePerUnit = option.prices[answerIndex] || 0;
          const delta = (newQuantity - prevQuantity) * pricePerUnit;

          return {
            ...option,
            quantities: newQuantities,
          };
        });

        // Only update totalPrice based on the delta (don't recalculate everything)
        const changedOption = item.options.find((o) => o.name === optionName);
        const idx = changedOption?.answers.findIndex((a) => a === answerValue);
        const unitPrice = changedOption?.prices?.[idx] || 0;
        const oldQty = changedOption?.quantities?.[idx] || 0;
        const deltaPrice = (newQuantity - oldQty) * unitPrice;

        return {
          ...item,
          options: updatedOptions,
          totalPrice: item.totalPrice + deltaPrice,
        };
      });
    });

    // Persist to Redis (backend will still recalc just in case)
    try {
      const cartId = sessionStorage.getItem("adminCartId");
      if (!cartId) throw new Error("Missing adminCartId");

      await axios.patch(`/api/stores/${storeId}/cart/${cartId}`, {
        productId,
        variantId,
        optionName,
        optionValue: answerValue,
        optionQuantity: newQuantity,
      });
    } catch (err) {
      console.error("❌ Failed to update Redis cart:", err);
    }
  };

  const removeFromCart = async (productId, variantId) => {
    const cartId = sessionStorage.getItem("adminCartId");
    if (!cartId) throw new Error("Missing adminCartId");

    try {
      const endpoint = `/api/stores/${storeId}/cart/${cartId}/item/${productId}/${
        variantId ?? ""
      }`;
      const res = await axios.delete(endpoint);

      if (res.status === 200) {
        console.log(res);
        if (res.data.cartDeleted) {
          // // Entire cart was removed
          // sessionStorage.removeItem("adminCartId");
          setCart([]); // Reset cart state
        } else {
          // Just one item removed
          setCart((prev) =>
            prev.filter((item) =>
              variantId
                ? !(
                    item.productId === productId && item.variantId === variantId
                  )
                : item.productId !== productId
            )
          );
        }
      }
    } catch (error) {
      console.error("Failed to remove cart item:", error);
    }
  };

  const handleCustomerSelect = (customerId) => {
    const customer = customersfromDb.find((c) => c._id === customerId);
    if (customer) {
      console.log("customer", customer);
      setSelectedCustomer(customer);
      setIsNewCustomer(false);
      customerForm.setValue("customerId", customer._id);
      customerForm.setValue("name", customer.name);
      customerForm.setValue("email", customer.email);
      customerForm.setValue("phone", customer.phone);
      customerForm.setValue(
        "deliveryAddress.street",
        customer.deliveryAddress?.street
      );
      customerForm.setValue(
        "deliveryAddress.city",
        customer.deliveryAddress?.city
      );
      customerForm.setValue(
        "deliveryAddress.apartment",
        customer.deliveryAddress?.apartment
      );
      customerForm.setValue(
        "deliveryAddress.zipCode",
        customer.deliveryAddress?.zipCode
      );
    }
  };

  // Add this function after the handleCustomerSelect function
  const handleManualCustomerInput = () => {
    // If user starts typing in customer fields, clear selected customer
    if (selectedCustomer) {
      setSelectedCustomer(null);
      setIsNewCustomer(true);
    }
  };

  // Replace handleProductSelect
  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setCurrentView("product-config");
  };

  const addPricingAdjustment = (type) => {
    const newAdjustment = {
      id: Date.now().toString(),
      type,
      name:
        type === "discount"
          ? "Discount"
          : type === "tax"
          ? "Tax"
          : "Custom Fee",
      value: 0,
      isPercentage: type === "tax",
    };
    setPricingAdjustments([...pricingAdjustments, newAdjustment]);
  };

  const updatePricingAdjustment = (id, field, value) => {
    setPricingAdjustments(
      pricingAdjustments.map((adj) =>
        adj.id === id ? { ...adj, [field]: value } : adj
      )
    );
  };

  const removePricingAdjustment = (id) => {
    setPricingAdjustments(pricingAdjustments.filter((adj) => adj.id !== id));
  };

  const clearSearch = () => {
    searchParams.delete("search");
    setSearchParams(searchParams);
  };

  const debouncedSearch = debounce((query) => {
    if (query) {
      searchParams.set("search", query);
      setSearchParams(searchParams);
    } else {
      clearSearch();
    }
  }, 300);

  const onSearchChange = (e) => {
    debouncedSearch(e.target.value);
  };

  const onComplete = (complete) => {
    if (complete) {
      containerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const completeOrder = customerForm.handleSubmit(async (data) => {
    const customerData = customerForm.watch();
    const isEdit = Boolean(id);

    // Show loading toast
    const loadingToastId = toast.custom(
      () => (
        <NewToaster
          title={isEdit ? "Updating order..." : "Adding order..."}
          type="loading"
        />
      ),
      {
        duration: Infinity, // Keep visible until we manually dismiss
      }
    );

    const orderData = {
      customer: customerData,
      cartId,
      orderStatus: "Pending",
      items: cart,
      pricing: {
        subtotal: calculateCartSubtotal(),
        adjustments: pricingAdjustments,
        finalTotal: calculateFinalTotal(),
      },
      notes: orderNotes,
    };

    try {
      const endpoint = isEdit
        ? `/api/stores/${storeId}/orders/${id}/edit`
        : `/api/stores/${storeId}/orders`;

      const headers = {};
      if (!isEdit) {
        headers["Idempotency-Key"] = getOrCreateIdempotencyKey();
      }

      const res = await axios.post(endpoint, orderData, { headers });

      if (res.status === 200) {
        const { needRestockAndDeduct } = res.data;

        if (!needRestockAndDeduct) {
          // Dismiss loading toast and show success
          toast.dismiss(loadingToastId);
          toast.custom(() => (
            <NewToaster
              title={
                isEdit
                  ? "Order updated successfully"
                  : "Order added successfully"
              }
              type="success"
            />
          ));

          // Reset everything after successful order handling
          clearAll();
          setCart([]);
          setPricingAdjustments([]);
          setOrderNotes([]);
          setCurrentView("products");
          onComplete("complete");
        } else {
          const confirmRestockAndDeduct = confirm(
            "Some items track inventory and have increased quantity or are newly added. Do you want to deduct inventory?"
          );

          if (confirmRestockAndDeduct) {
            try {
              let inventoryRes = await axios.post(
                `/api/stores/${storeId}/orders/${id}/update`,
                orderData
              );

              if (inventoryRes.status === 200) {
                // Dismiss loading toast and show success
                toast.dismiss(loadingToastId);
                toast.custom(() => (
                  <NewToaster
                    title="Order and inventory updated successfully"
                    type="success"
                  />
                ));

                // Reset everything after successful inventory update
                clearAll();
                setCart([]);
                setPricingAdjustments([]);
                setOrderNotes([]);
                setCurrentView("products");
                onComplete("complete");
              }
            } catch (invErr) {
              console.error("Inventory sync failed:", invErr);
              // Dismiss loading toast and show error
              toast.dismiss(loadingToastId);
              toast.custom(() => (
                <NewToaster
                  title="Failed to update the inventory"
                  type="error"
                />
              ));
            }
          } else {
            // Dismiss loading toast and show success even if inventory update is skipped
            toast.dismiss(loadingToastId);
            toast.custom(() => (
              <NewToaster
                title={
                  isEdit
                    ? "Order updated successfully"
                    : "Order added successfully"
                }
                type="success"
              />
            ));

            // Reset everything
            clearAll();
            setCart([]);
            setPricingAdjustments([]);
            setOrderNotes([]);
            setCurrentView("products");
            onComplete("complete");
          }
        }
      }
    } catch (error) {
      console.error("Error handling order:", error);
      // Dismiss loading toast and show error
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
  });

  const renderCartItemDetails = (item) => {
    return (
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-lg">{item.productName}</h4>
            <div className="mt-1">
              <p className="text-base font-bold">
                Total -{" "}
                {formatWithCurrency(item.totalPrice?.toFixed(2), currency)}
              </p>
              {/* <p className="text-sm text-gray-600">
                ${item.basePrice?.toFixed(2)} each
              </p> */}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeFromCart(item.productId, item.variantId)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Main quantity control */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="font-medium">
            Base item Quantity:{" "}
            <p className="text-sm text-red-500">
              {formatWithCurrency(item.basePrice?.toFixed(2), currency)} each
            </p>
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                updateCartItemQuantity(
                  item.productId,
                  item.variantId,
                  item.quantity - 1
                )
              }
              disabled={item.quantity <= 1}
              className="h-8 w-8 p-0"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="font-medium w-12 text-center">
              {item.quantity}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                updateCartItemQuantity(
                  item.productId,
                  item.variantId,
                  item.quantity + 1
                )
              }
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
            {item.trackQuantityEnabled &&
              item.quantity > item.productinventory && (
                <span className="text-red-500">sold out</span>
              )}
          </div>
        </div>

        {/* Options with quantities */}
        {item?.options?.length > 0 && (
          <div className="space-y-2">
            <h5 className="font-medium">Selected Options:</h5>

            {item.options.map((option, i) => {
              return (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <div className="w-full">
                    <p className="font-semibold">{option.name}</p>
                    <div className="flex-1">
                      {console.log(option.answers)}
                      {option.answers?.map((answer, i) => (
                        <div
                          key={i}
                          className="w-full flex items-center justify-between pl-2"
                        >
                          <div className="flex-1">
                            <span className="font-medium">{answer}</span>
                            <span className="ml-2 text-green-600">
                              (+
                              {formatWithCurrency(
                                option.prices?.[i]?.toFixed(2) || "0.00",
                                currency
                              )}{" "}
                              each)
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateCartItemOptionQuantity(
                                  item.productId,
                                  item.variantId,
                                  option.name,
                                  answer,
                                  option.quantities[i] - 1
                                )
                              }
                              disabled={option.quantities[i] <= 1}
                              className="h-6 w-6 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium w-8 text-center">
                              {option.quantities[i]}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateCartItemOptionQuantity(
                                  item.productId,
                                  item.variantId,
                                  option.name,
                                  answer,
                                  option.quantities[i] + 1
                                )
                              }
                              className="h-6 w-6 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateCartItemOptionQuantity(
                          item.productId,
                          item.variantId,
                          option.name,
                          answer, // 👈 specific optionValue
                          option.quantities[i] - 1 // 👈 specific quantity
                        )
                      }
                      disabled={item?.quantity <= 1}
                      className="h-6 w-6 p-0"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-sm font-medium w-8 text-center">
                      {item?.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateCartItemOptionQuantity(
                          item.productId,
                          item.variantId,
                          option.name,
                          answer,
                          option.quantities[i] + 1
                        )
                      }
                      className="h-6 w-6 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div> */}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const handleDiscard = async () => {
    dispatch(discardCart(storeId));
    if (discardSuccess) {
      window.history.back();
    }
  };

  const variants = productForm.watch("variantId");
  const selectedVariant = selectedProduct?.variants.find(
    (v) => v._id === variants
  );

  const quantity = productForm.watch("quantity");
  const isBelowMinimum =
    selectedProduct?.cartMinimumEnabled &&
    quantity < selectedProduct?.cartMinimum;
  const isAboveMaximum =
    selectedProduct?.cartMaximumEnabled &&
    quantity > selectedProduct?.cartMaximum;
  const isOutOfStock =
    selectedProduct?.trackQuantityEnabled &&
    quantity > selectedProduct?.inventory?.quantity;
  const isSoldOut = isAboveMaximum || isOutOfStock;
  const isDisabled = isBelowMinimum && isSoldOut;

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
    >
      <div className="container mx-auto p-4 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Check out
              </h1>
            </div>
            {/* Navigation */}
            <div className="flex items-center gap-2">
              <Button
                // variant={currentView === "products" ? "default" : "outline"}
                onClick={() => setCurrentView("products")}
                className={` ${
                  currentView === "products"
                    ? "bg-blue-100 text-blue-700 hover:bg-blue-50"
                    : "bg-white text-gray-700 hover:bg-slate-100 border border-gray-200"
                }`}
              >
                Products
              </Button>
              <Button
                variant={currentView === "cart" ? "default" : "outline"}
                onClick={() => setCurrentView("cart")}
                className={`relative transition-all duration-300
                ${
                  currentView === "cart"
                    ? "bg-blue-100 text-blue-700 hover:bg-blue-50"
                    : ""
                }
                ${
                  cartButtonAnimation
                    ? "scale-110 bg-green-100 border-green-300"
                    : ""
                }
              `}
                disabled={cart.length === 0}
              >
                <ShoppingCart
                  className={`h-4 w-4 mr-2 ${
                    cartButtonAnimation ? "text-green-600" : ""
                  }`}
                />
                Cart
                {cart.length > 0 && (
                  <Badge
                    className={`absolute bg-blue-600 -top-2 hover:bg-blue-500 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center transition-all duration-300 ${
                      cartButtonAnimation ? "scale-125 bg-green-500" : ""
                    }`}
                  >
                    {cart.length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
          <p className="text-gray-600">
            Create orders for customers with product configuration
          </p>
          {currentView === "cart" && (
            <Button
              type="button"
              variant="outline"
              className="mt-2"
              onClick={handleDiscard}
            >
              <Undo2 className="w-4 h-4 mr-2" />
              Discard
            </Button>
          )}
        </div>

        {/* Customer Selection Section */}
        {currentView === "cart" && (
          <Card className="border-0 shadow-lg mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...customerForm}>
                <div className="space-y-4">
                  {/* Customer Selection */}
                  <div className="space-y-4">
                    {/* New vs Existing Customer Toggle */}
                    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <Label className="text-sm font-medium">
                        Customer Type:
                      </Label>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="new-customer"
                            name="customer-type"
                            checked={isNewCustomer}
                            onChange={() => {
                              setIsNewCustomer(true);
                              setSelectedCustomer(null);
                              customerForm.reset({
                                customerId: "",
                                name: "",
                                phone: "",
                                email: "",
                                deliveryAddress: {
                                  apartment: "",
                                  city: "",
                                  street: "",
                                  zipCode: "",
                                },
                              });
                            }}
                            className="w-4 h-4 text-blue-600"
                          />
                          <Label
                            htmlFor="new-customer"
                            className="text-sm cursor-pointer"
                          >
                            New Customer
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="existing-customer"
                            name="customer-type"
                            checked={!isNewCustomer}
                            onChange={() => {
                              setIsNewCustomer(false);
                              customerForm.reset({
                                customerId: "",
                                name: "",
                                phone: "",
                                email: "",
                                deliveryAddress: {
                                  apartment: "",
                                  city: "",
                                  street: "",
                                  zipCode: "",
                                },
                              });
                            }}
                            className="w-4 h-4 text-blue-600"
                          />
                          <Label
                            htmlFor="existing-customer"
                            className="text-sm cursor-pointer"
                          >
                            Existing Customer
                          </Label>
                        </div>
                      </div>
                    </div>

                    {/* Existing Customer Dropdown - Only show when not new customer */}
                    {!isNewCustomer && (
                      <div>
                        <Label className="text-sm font-medium">
                          Select Existing Customer
                        </Label>
                        <Select onValueChange={handleCustomerSelect}>
                          <SelectTrigger className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 ring-offset-blue-500 focus:ring-transparent">
                            <SelectValue placeholder="Choose existing customer" />
                          </SelectTrigger>
                          <SelectContent>
                            <ScrollArea className="h-60">
                              {customersfromDb.map((customer) => (
                                <SelectItem
                                  key={customer._id}
                                  value={customer._id}
                                >
                                  {customer.name} ({customer.phone})
                                </SelectItem>
                              ))}
                            </ScrollArea>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* Customer Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={customerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Name <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="w-full focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                              placeholder="Customer name"
                              {...field}
                              {...customerForm.register("name", {
                                required: "Customer name is required",
                              })}
                              onChange={(e) => {
                                field.onChange(e);
                                handleManualCustomerInput();
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={customerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email </FormLabel>
                          <FormControl>
                            <Input
                              className="w-full focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                              type="email"
                              placeholder="customer@example.com"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                handleManualCustomerInput();
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={customerForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone *</FormLabel>
                          <FormControl>
                            <Input
                              className="w-full focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                              placeholder="+1 (555) 123-4567"
                              {...field}
                              {...customerForm.register("phone", {
                                required: "Customer phone is required",
                              })}
                              onChange={(e) => {
                                field.onChange(e);
                                handleManualCustomerInput();
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Delivery Address
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <FormField
                          control={customerForm.control}
                          name="deliveryAddress.street"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Street</FormLabel>
                              <FormControl>
                                <Input
                                  className="w-full focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                                  placeholder="123 Main St"
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={customerForm.control}
                          name="deliveryAddress.city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input
                                  className="w-full focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                                  placeholder="New York"
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={customerForm.control}
                          name="deliveryAddress.apartment"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Apartment</FormLabel>
                              <FormControl>
                                <Input
                                  className="w-full focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                                  placeholder="Apartment,unit number"
                                  {...field}
                                  {...customerForm.register(
                                    "deliveryAddress.apartment",
                                    {
                                      required: "Apartment unit is required",
                                    }
                                  )}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={customerForm.control}
                          name="deliveryAddress.zipCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ZIP Code</FormLabel>
                              <FormControl>
                                <Input
                                  className="w-full focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                                  placeholder="10001"
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Cart Page */}
        {currentView === "cart" && (
          <Card className="border-0 shadow-lg mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Shopping Cart ({cart.length} items)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Your cart is empty</p>
                  <Button
                    onClick={() => setCurrentView("products")}
                    className="mt-4 bg-blue-500 hover:bg-blue-600"
                  >
                    Browse Products
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Cart Items */}
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <Card key={item.id} className="border">
                        <CardContent className="p-4">
                          {renderCartItemDetails(item)}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Separator />

                  {/* Pricing Adjustments */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Percent className="h-5 w-5 text-blue-600" />
                        Pricing Adjustments
                      </h3>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addPricingAdjustment("discount")}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Discount
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addPricingAdjustment("tax")}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Tax
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addPricingAdjustment("fee")}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Fee
                        </Button>
                      </div>
                    </div>

                    {pricingAdjustments.map((adjustment) => (
                      <div
                        key={adjustment.id}
                        className="flex items-center gap-2 p-3 border rounded-lg"
                      >
                        <Input
                          placeholder="Name"
                          value={adjustment.name}
                          onChange={(e) =>
                            updatePricingAdjustment(
                              adjustment.id,
                              "name",
                              e.target.value
                            )
                          }
                          className="flex-1 w-full focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                        />
                        <Input
                          type="number"
                          placeholder="0"
                          value={adjustment.value}
                          onChange={(e) =>
                            updatePricingAdjustment(
                              adjustment.id,
                              "value",
                              Number.parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-24 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                        />
                        <Select
                          value={
                            adjustment.isPercentage ? "percentage" : "fixed"
                          }
                          onValueChange={(value) =>
                            updatePricingAdjustment(
                              adjustment.id,
                              "isPercentage",
                              value === "percentage"
                            )
                          }
                        >
                          <SelectTrigger className="w-20 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 ring-offset-blue-500 focus:ring-transparent">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fixed">$</SelectItem>
                            <SelectItem value="percentage">%</SelectItem>
                          </SelectContent>
                        </Select>
                        <Badge
                          variant={
                            adjustment.type === "discount"
                              ? "destructive"
                              : adjustment.type === "tax"
                              ? "secondary"
                              : "default"
                          }
                        >
                          {adjustment.type}
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePricingAdjustment(adjustment.id)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Order Notes */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Edit className="h-5 w-5 text-blue-600" />
                      Internal Notes
                    </h3>

                    <div className="space-y-3">
                      {orderNotes.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {orderNotes.map((note) => (
                            <div
                              key={note.id}
                              className="p-3 bg-gray-50 rounded-lg border relative"
                            >
                              <div className="flex justify-between items-start">
                                <div className="font-medium text-sm">
                                  {note.author}
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 absolute top-2 right-2"
                                  onClick={() => removeOrderNote(note.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              <p className="text-sm mt-1">{note.content}</p>
                              <div className="text-xs text-gray-500 mt-2">
                                {new Date(note.createdAt).toLocaleDateString()}{" "}
                                at{" "}
                                {new Date(note.createdAt).toLocaleTimeString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500 text-sm border rounded-lg">
                          No notes added yet
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Input
                          placeholder="Add internal note..."
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          className="flex-1 w-full focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                        />
                        <Button
                          type="button"
                          onClick={addOrderNote}
                          disabled={!newNote.trim()}
                          className="bg-blue-500"
                        >
                          Add Note
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Internal notes are only visible to admin users and not
                        to customers
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Order Summary */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3">Order Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>
                          {formatWithCurrency(
                            calculateCartSubtotal().toFixed(2),
                            currency
                          )}
                        </span>
                      </div>
                      {pricingAdjustments.map((adjustment) => (
                        <div
                          key={adjustment.id}
                          className="flex justify-between text-sm"
                        >
                          <span>{adjustment.name}:</span>
                          <span
                            className={
                              adjustment.type === "discount"
                                ? "text-red-600"
                                : "text-green-600"
                            }
                          >
                            {adjustment.type === "discount" ? "-" : "+"}
                            {adjustment.isPercentage
                              ? formatWithCurrency(
                                  (calculateCartSubtotal() * adjustment.value) /
                                    100,
                                  currency
                                )
                              : formatWithCurrency(adjustment.value, currency)}
                          </span>
                        </div>
                      ))}
                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Final Total:</span>
                        <span className="text-blue-600">
                          {formatWithCurrency(
                            calculateFinalTotal().toFixed(2),
                            currency
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Complete Order Button */}
                  <Button
                    onClick={completeOrder}
                    size="lg"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Complete Order - {formatWithCurrency(calculateFinalTotal().toFixed(2),currency)}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Product Selection and Configuration */}
        {currentView !== "cart" && (
          <div className="lg:hidden">
            {currentView === "products" ? (
              <div className="grid grid-cols-12 gap-4 h-[84vh]">
                {/* Categories Sidebar - Mobile */}
                <div className="col-span-4">
                  <Card className="border-0 shadow-lg h-full">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Categories</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="space-y-1 max-h-[calc(100vh-300px)] overflow-y-auto">
                        <button
                          onClick={() => setSelectedCategory({ name: "all" })}
                          className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                            selectedCategory.name === "all"
                              ? "bg-blue-100 text-blue-700 border-r-2 border-blue-500"
                              : "hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">All Products</span>
                            <Badge variant="secondary" className="text-xs">
                              {pagination.totalProducts}
                            </Badge>
                          </div>
                        </button>
                        {categoriesfromDb.length > 0 &&
                          categoriesfromDb.map((category) => {
                            return (
                              <button
                                key={category._id}
                                onClick={() => setSelectedCategory(category)}
                                className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                                  selectedCategory.name === category.name
                                    ? "bg-blue-100 text-blue-700 border-r-2 border-blue-500"
                                    : "hover:bg-gray-50 text-gray-700"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">
                                    {category.name}
                                  </span>
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {category.products.length}
                                  </Badge>
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Products Area - Mobile */}
                <div className="col-span-8">
                  <Card className="border-0 shadow-lg h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {selectedCategory.name === "all"
                            ? "All Products"
                            : selectedCategory.name}
                        </CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {pagination.totalProducts} items
                        </Badge>
                      </div>

                      {/* Search and Filters */}
                      <div className="space-y-3 mt-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e)}
                            className="pl-10 h-10 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                          />
                          {searchQuery && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3 py-2"
                              onClick={clearSearch}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-0">
                      {/* Products Grid */}
                      <div className="max-h-[calc(100vh-300px)] overflow-y-auto p-4">
                        {productsfromDb.length > 0 ? (
                          <div className="grid grid-cols-1 gap-3">
                            {productsfromDb.map((product) => (
                              <Card
                                key={product._id}
                                className="cursor-pointer transition-all duration-300 hover:shadow-md hover:scale-[1.01] border"
                                onClick={() => handleProductSelect(product)}
                              >
                                <CardContent className="p-3">
                                  <div className="space-y-2">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">
                                          {product.name}
                                        </h3>
                                        <p className="text-xs text-gray-600 line-clamp-1">
                                          {product.description}
                                        </p>
                                      </div>
                                      <Package className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-1">
                                        {product.variants[0]?.price ? (
                                          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-xs font-semibold">
                                            ${product.variants[0].price}
                                          </Badge>
                                        ) : (
                                          <>
                                            {product.price && (
                                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs font-semibold">
                                                ${product.price}
                                              </Badge>
                                            )}
                                            {product.originalPrice > 1 &&
                                              product.price && (
                                                <Badge
                                                  variant="outline"
                                                  className="line-through text-gray-500 text-xs"
                                                >
                                                  ${product.originalPrice}
                                                </Badge>
                                              )}
                                          </>
                                        )}
                                      </div>

                                      <Button
                                        size="sm"
                                        className="bg-blue-600 hover:bg-blue-700 text-white h-7 text-xs"
                                      >
                                        Select Options
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              No Products Found
                            </h3>
                            <p className="text-gray-600 mb-4">
                              {selectedCategory.name === "all"
                                ? "Try adjusting your search terms or filters."
                                : `No products found in ${selectedCategory.name} category.`}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              /* Product Configuration View - Keep existing */
              selectedProduct && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCurrentView("products");
                        setSelectedProduct(null);
                        productForm.reset();
                      }}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Products
                    </Button>
                  </div>

                  <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl text-gray-900">
                            {selectedProduct.name}
                          </CardTitle>
                          <p className="text-gray-600 mt-1">
                            {selectedProduct.description}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {selectedProduct.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        {selectedVariant && (
                          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-lg px-3 py-1">
                            ${selectedVariant.price.toFixed(2)}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="mb-6">
                        <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                          {selectedProduct.imgUrls.length > 0 ? (
                            selectedProduct.imgUrls.map((img) => (
                              <img
                                src={img}
                                alt={selectedProduct.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ))
                          ) : (
                            <div className="text-center">
                              <Package className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-500">
                                Product Image
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <Form {...productForm}>
                        <form
                          onSubmit={productForm.handleSubmit(
                            (data) => {
                              console.log("Form validated successfully:", data);
                              addToCart(data);
                            },
                            (errors) => {
                              console.error("Form validation failed:", errors);
                            }
                          )}
                        >
                          <div className="space-y-6">
                            {/* Variants */}
                            {selectedProduct.variants.length > 0 && (
                              <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                  <Check className="h-5 w-5 text-blue-600" />
                                  Product Variants
                                  {selectedProduct?.inventory.quantity <= 5 && (
                                    <Badge variant="secondary">5 left</Badge>
                                  )}
                                </h3>
                                <FormField
                                  control={productForm.control}
                                  name="variantId" // this will store the _id of selected variant
                                  render={({ field }) => (
                                    <FormItem className="space-y-3">
                                      <FormLabel className="text-base font-medium">
                                        Size{" "}
                                        <span className="text-red-500">*</span>
                                      </FormLabel>
                                      <FormControl>
                                        <RadioGroup
                                          onValueChange={field.onChange}
                                          value={field.value}
                                          className="grid grid-cols-2 xl:grid-cols-4 gap-2"
                                        >
                                          {selectedProduct.variants.length >
                                            0 &&
                                            selectedProduct.variants.map(
                                              (variant) => (
                                                <div
                                                  key={variant._id}
                                                  className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-blue-50 hover:border-blue-200"
                                                >
                                                  <RadioGroupItem
                                                    value={variant._id}
                                                    id={`variant-${variant._id}`}
                                                    className="border-[1.5px] text-white border-gray-300
                                                      before:h-2 before:w-2 before:bg-white
                                                      data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500
                                                      data-[state=checked]:before:bg-white"
                                                  />
                                                  <Label
                                                    htmlFor={`variant-${variant._id}`}
                                                    className="flex-1 cursor-pointer font-medium"
                                                  >
                                                    {variant.name}
                                                    <span className="ml-1 text-green-600">
                                                      ($
                                                      {variant.price.toFixed(2)}
                                                      )
                                                    </span>
                                                  </Label>
                                                </div>
                                              )
                                            )}
                                        </RadioGroup>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            )}

                            {selectedProduct.options.length === 0 && (
                              <FormField
                                control={productForm.control}
                                name="quantity"
                                render={({ field }) => {
                                  return (
                                    <FormItem>
                                      <div className="flex items-center justify-between">
                                        <FormLabel>Quantity</FormLabel>
                                        <span className="text-gray-500 text-sm">
                                          {selectedProduct?.cartMinimumEnabled &&
                                            `min ${selectedProduct?.cartMinimum}`}
                                          ,{" "}
                                          {selectedProduct?.cartMaximumEnabled &&
                                            `max ${selectedProduct?.cartMaximum}`}
                                        </span>
                                      </div>
                                      <FormControl>
                                        <div className="flex items-center gap-1">
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                              field.onChange(field.value - 1)
                                            }
                                            disabled={field.value <= 1}
                                          >
                                            <Minus className="h-3 w-3" />
                                          </Button>
                                          <span className="text-sm w-8 text-center">
                                            {field.value}
                                          </span>
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                              field.onChange(field.value + 1)
                                            }
                                          >
                                            <Plus className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  );
                                }}
                              />
                            )}

                            {/* Options */}
                            {selectedProduct.options.length > 0 && (
                              <>
                                {selectedProduct.variants.length > 0 && (
                                  <Separator />
                                )}
                                <div className="space-y-4">
                                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <Package className="h-5 w-5 text-blue-600" />
                                    Additional Options
                                  </h3>
                                  <div className="space-y-6">
                                    <FormField
                                      control={productForm.control}
                                      name="quantity"
                                      render={({ field }) => (
                                        <FormItem>
                                          <div className="flex items-center justify-between">
                                            <FormLabel>Quantity</FormLabel>
                                            <span className="text-gray-500 text-sm">
                                              {selectedProduct?.cartMinimumEnabled &&
                                                `min ${selectedProduct?.cartMinimum}`}
                                              ,{" "}
                                              {selectedProduct?.cartMaximumEnabled &&
                                                `max ${selectedProduct?.cartMaximum}`}
                                            </span>
                                          </div>
                                          <FormControl>
                                            <div className="flex items-center gap-1">
                                              <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                  field.onChange(
                                                    field.value - 1
                                                  )
                                                }
                                                disabled={field.value <= 1}
                                              >
                                                <Minus className="h-3 w-3" />
                                              </Button>
                                              <span className="text-sm w-8 text-center">
                                                {field.value}
                                              </span>
                                              <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                  field.onChange(
                                                    field.value + 1
                                                  )
                                                }
                                              >
                                                <Plus className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />

                                    {productForm
                                      .getValues("options")
                                      ?.map((option, index) => {
                                        const baseName = `options.${index}`;
                                        const type =
                                          selectedProduct.options[index]?.type;
                                        const label =
                                          selectedProduct.options[index]?.name;
                                        const required =
                                          selectedProduct.options[index]
                                            ?.required;
                                        const choices =
                                          selectedProduct.options[index]
                                            ?.settings?.choices || [];
                                        const enableQuantity =
                                          selectedProduct.options[index]
                                            ?.settings?.enableQuantity;

                                        if (type === "Text") {
                                          return (
                                            <FormField
                                              key={label}
                                              control={productForm.control}
                                              name={`${baseName}.answers.0`}
                                              render={({ field }) => (
                                                <FormItem>
                                                  <FormLabel>
                                                    {label}
                                                    {required && (
                                                      <span className="text-red-500 ml-1">
                                                        *
                                                      </span>
                                                    )}
                                                  </FormLabel>
                                                  <FormControl>
                                                    <Input
                                                      type="text"
                                                      {...field}
                                                      value={field.value ?? ""}
                                                      onChange={(e) =>
                                                        field.onChange(
                                                          e.target.value
                                                        )
                                                      }
                                                    />
                                                  </FormControl>
                                                  <FormMessage />
                                                </FormItem>
                                              )}
                                            />
                                          );
                                        }

                                        if (type === "Number") {
                                          return (
                                            <FormField
                                              key={label}
                                              control={productForm.control}
                                              name={`${baseName}.answers.0`}
                                              rules={{ required: required }}
                                              render={({ field }) => (
                                                <FormItem>
                                                  <FormLabel>
                                                    {label}
                                                    {required && (
                                                      <span className="text-red-500 ml-1">
                                                        *
                                                      </span>
                                                    )}
                                                  </FormLabel>
                                                  <FormControl>
                                                    <Input
                                                      type="number"
                                                      {...field}
                                                      value={field.value ?? ""}
                                                      onChange={(e) => {
                                                        const val =
                                                          e.target.value;
                                                        field.onChange(
                                                          val === ""
                                                            ? undefined
                                                            : Number(val)
                                                        );
                                                      }}
                                                    />
                                                  </FormControl>
                                                  <FormMessage />
                                                </FormItem>
                                              )}
                                            />
                                          );
                                        }

                                        if (type === "Selection") {
                                          const selectedValue =
                                            productForm.watch(
                                              `${baseName}.answers.0`
                                            );
                                          const quantity =
                                            productForm.watch(
                                              `${baseName}.quantities.0`
                                            ) || 1;

                                          return (
                                            <FormField
                                              key={option.id || label}
                                              control={productForm.control}
                                              name={`${baseName}.answers.0`}
                                              render={() => (
                                                <FormItem>
                                                  <FormLabel>
                                                    {label}
                                                    {required && (
                                                      <span className="text-red-500 ml-1">
                                                        *
                                                      </span>
                                                    )}
                                                  </FormLabel>
                                                  <FormControl>
                                                    <RadioGroup
                                                      value={
                                                        selectedValue || ""
                                                      }
                                                      onValueChange={(
                                                        value
                                                      ) => {
                                                        productForm.setValue(
                                                          `${baseName}.answers`,
                                                          [value]
                                                        );
                                                        productForm.setValue(
                                                          `${baseName}.quantities`,
                                                          [1]
                                                        );

                                                        const selectedChoice =
                                                          choices.find(
                                                            (c) =>
                                                              c.name === value
                                                          );
                                                        const selectedAmount =
                                                          selectedChoice?.amount ||
                                                          0;
                                                        productForm.setValue(
                                                          `${baseName}.prices`,
                                                          [selectedAmount]
                                                        );
                                                      }}
                                                      className="grid grid-cols-1 gap-2"
                                                    >
                                                      {choices.map(
                                                        (choice, cIdx) => (
                                                          <div
                                                            key={cIdx}
                                                            className="flex items-center space-x-2 p-2 rounded-lg border hover:bg-gray-50"
                                                          >
                                                            <RadioGroupItem
                                                              value={
                                                                choice.name
                                                              }
                                                              id={`${baseName}-${choice.name}`}
                                                              className="border-[1.5px] text-white border-gray-300
                                                              before:h-2 before:w-2 before:bg-white
                                                                data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500
                                                                data-[state=checked]:before:bg-white"
                                                            />
                                                            <Label
                                                              htmlFor={`${baseName}-${choice.name}`}
                                                              className="flex-1 cursor-pointer"
                                                            >
                                                              {choice.name}{" "}
                                                              {choice.amount >
                                                                0 && (
                                                                <span>
                                                                  (+$
                                                                  {
                                                                    choice.amount
                                                                  }
                                                                  )
                                                                </span>
                                                              )}
                                                            </Label>
                                                            {selectedValue ===
                                                              choice.name &&
                                                              enableQuantity && (
                                                                <div className="flex items-center gap-1">
                                                                  <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() =>
                                                                      productForm.setValue(
                                                                        `${baseName}.quantities.0`,
                                                                        Math.max(
                                                                          1,
                                                                          quantity -
                                                                            1
                                                                        )
                                                                      )
                                                                    }
                                                                  >
                                                                    <Minus className="h-3 w-3" />
                                                                  </Button>
                                                                  <span className="text-sm w-8 text-center">
                                                                    {quantity}
                                                                  </span>
                                                                  <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() =>
                                                                      productForm.setValue(
                                                                        `${baseName}.quantities.0`,
                                                                        quantity +
                                                                          1
                                                                      )
                                                                    }
                                                                  >
                                                                    <Plus className="h-3 w-3" />
                                                                  </Button>
                                                                </div>
                                                              )}
                                                          </div>
                                                        )
                                                      )}
                                                    </RadioGroup>
                                                  </FormControl>
                                                  <FormMessage />
                                                </FormItem>
                                              )}
                                            />
                                          );
                                        }

                                        if (type === "Checkbox") {
                                          return (
                                            <FormField
                                              key={option.id || label}
                                              control={productForm.control}
                                              name={`${baseName}.answers`}
                                              render={({ field }) => (
                                                <FormItem>
                                                  <FormLabel>
                                                    {label}
                                                    {required && (
                                                      <span className="text-red-500 ml-1">
                                                        *
                                                      </span>
                                                    )}
                                                  </FormLabel>
                                                  <FormControl>
                                                    <div className="grid grid-cols-1 gap-2">
                                                      {choices.map(
                                                        (choice, cIdx) => {
                                                          const isChecked =
                                                            field.value?.includes(
                                                              choice.name
                                                            );

                                                          // Find the index of this choice in the selected answers
                                                          const answerIndex =
                                                            field.value?.indexOf(
                                                              choice.name
                                                            ) ?? -1;
                                                          const quantity =
                                                            answerIndex >= 0
                                                              ? productForm.watch(
                                                                  `${baseName}.quantities.${answerIndex}`
                                                                ) || 1
                                                              : 1;

                                                          console.log(
                                                            "quantity",
                                                            quantity
                                                          );
                                                          console.log(
                                                            "options",
                                                            productForm.watch(
                                                              "options"
                                                            )
                                                          );

                                                          return (
                                                            <div
                                                              key={cIdx}
                                                              className="flex items-center space-x-2 p-2 rounded-lg border hover:bg-gray-50"
                                                            >
                                                              <Checkbox
                                                                className="w-5 h-5 peer data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 border-gray-300"
                                                                checked={
                                                                  isChecked
                                                                }
                                                                onCheckedChange={(
                                                                  checked
                                                                ) => {
                                                                  let currentAnswers =
                                                                    field.value ||
                                                                    [];
                                                                  let currentPrices =
                                                                    productForm.getValues(
                                                                      `${baseName}.prices`
                                                                    ) || [];
                                                                  let currentQuantities =
                                                                    productForm.getValues(
                                                                      `${baseName}.quantities`
                                                                    ) || [];

                                                                  // Remove placeholder if present
                                                                  if (
                                                                    currentAnswers.length ===
                                                                      1 &&
                                                                    (currentAnswers[0] ===
                                                                      "" ||
                                                                      currentAnswers[0] ===
                                                                        undefined)
                                                                  ) {
                                                                    currentAnswers =
                                                                      [];
                                                                    currentPrices =
                                                                      [];
                                                                    currentQuantities =
                                                                      [];
                                                                  }

                                                                  if (checked) {
                                                                    if (
                                                                      !currentAnswers.includes(
                                                                        choice.name
                                                                      )
                                                                    ) {
                                                                      currentAnswers =
                                                                        [
                                                                          ...currentAnswers,
                                                                          choice.name,
                                                                        ];
                                                                      currentPrices =
                                                                        [
                                                                          ...currentPrices,
                                                                          choice.amount ||
                                                                            0,
                                                                        ];
                                                                      currentQuantities =
                                                                        [
                                                                          ...currentQuantities,
                                                                          1,
                                                                        ];
                                                                    }
                                                                  } else {
                                                                    const removeIndex =
                                                                      currentAnswers.indexOf(
                                                                        choice.name
                                                                      );
                                                                    if (
                                                                      removeIndex !==
                                                                      -1
                                                                    ) {
                                                                      currentAnswers =
                                                                        currentAnswers.filter(
                                                                          (
                                                                            _,
                                                                            i
                                                                          ) =>
                                                                            i !==
                                                                            removeIndex
                                                                        );
                                                                      currentPrices =
                                                                        currentPrices.filter(
                                                                          (
                                                                            _,
                                                                            i
                                                                          ) =>
                                                                            i !==
                                                                            removeIndex
                                                                        );
                                                                      currentQuantities =
                                                                        currentQuantities.filter(
                                                                          (
                                                                            _,
                                                                            i
                                                                          ) =>
                                                                            i !==
                                                                            removeIndex
                                                                        );
                                                                    }
                                                                  }

                                                                  field.onChange(
                                                                    currentAnswers
                                                                  );
                                                                  productForm.setValue(
                                                                    `${baseName}.prices`,
                                                                    currentPrices
                                                                  );
                                                                  productForm.setValue(
                                                                    `${baseName}.quantities`,
                                                                    currentQuantities
                                                                  );
                                                                }}
                                                              />
                                                              <Label className="flex-1 cursor-pointer">
                                                                {choice.name}{" "}
                                                                {choice.amount >
                                                                  0 && (
                                                                  <span>
                                                                    (+$
                                                                    {
                                                                      choice.amount
                                                                    }
                                                                    )
                                                                  </span>
                                                                )}
                                                              </Label>
                                                              {isChecked &&
                                                                enableQuantity && (
                                                                  <div className="flex items-center gap-1">
                                                                    <Button
                                                                      type="button"
                                                                      size="sm"
                                                                      variant="outline"
                                                                      onClick={() => {
                                                                        const currentAnswers =
                                                                          field.value ||
                                                                          [];
                                                                        const answerIndex =
                                                                          currentAnswers.indexOf(
                                                                            choice.name
                                                                          );

                                                                        if (
                                                                          answerIndex !==
                                                                          -1
                                                                        ) {
                                                                          const qList =
                                                                            productForm.getValues(
                                                                              `${baseName}.quantities`
                                                                            ) ||
                                                                            [];
                                                                          const updated =
                                                                            [
                                                                              ...qList,
                                                                            ];
                                                                          updated[
                                                                            answerIndex
                                                                          ] =
                                                                            Math.max(
                                                                              1,
                                                                              (updated[
                                                                                answerIndex
                                                                              ] ||
                                                                                1) -
                                                                                1
                                                                            );

                                                                          productForm.setValue(
                                                                            `${baseName}.quantities`,
                                                                            updated
                                                                          );
                                                                          console.log(
                                                                            "decreased quantity",
                                                                            updated
                                                                          );
                                                                        }
                                                                      }}
                                                                    >
                                                                      <Minus className="h-3 w-3" />
                                                                    </Button>
                                                                    <span className="text-sm w-8 text-center">
                                                                      {quantity}
                                                                    </span>
                                                                    <Button
                                                                      type="button"
                                                                      size="sm"
                                                                      variant="outline"
                                                                      onClick={() => {
                                                                        const currentAnswers =
                                                                          field.value ||
                                                                          [];
                                                                        const answerIndex =
                                                                          currentAnswers.indexOf(
                                                                            choice.name
                                                                          );

                                                                        if (
                                                                          answerIndex !==
                                                                          -1
                                                                        ) {
                                                                          const qList =
                                                                            productForm.getValues(
                                                                              `${baseName}.quantities`
                                                                            ) ||
                                                                            [];
                                                                          const updated =
                                                                            [
                                                                              ...qList,
                                                                            ];
                                                                          updated[
                                                                            answerIndex
                                                                          ] =
                                                                            (updated[
                                                                              answerIndex
                                                                            ] ||
                                                                              1) +
                                                                            1;

                                                                          productForm.setValue(
                                                                            `${baseName}.quantities`,
                                                                            updated
                                                                          );
                                                                          console.log(
                                                                            "increased quantity",
                                                                            updated
                                                                          );
                                                                        }
                                                                      }}
                                                                    >
                                                                      <Plus className="h-3 w-3" />
                                                                    </Button>
                                                                  </div>
                                                                )}
                                                            </div>
                                                          );
                                                        }
                                                      )}
                                                    </div>
                                                  </FormControl>
                                                  <FormMessage />
                                                </FormItem>
                                              )}
                                            />
                                          );
                                        }

                                        return null;
                                      })}
                                  </div>
                                </div>
                              </>
                            )}

                            {/* Price Summary */}
                            <div className="bg-gray-50 p-4 rounded-lg border">
                              {/* <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-600">
                                  Base Price:
                                </span>
                                <span className="font-medium">
                                  $
                                  {(
                                    selectedProduct.price ||
                                    selectedProduct.originalPrice ||
                                    0
                                  ).toFixed(2)}
                                </span>
                              </div> */}

                              {/* Show variant and option price additions */}
                              {productForm.watch() &&
                                Object.keys(productForm.watch()).length > 0 && (
                                  <div className="space-y-1 mb-2">
                                    {selectedVariant && (
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">
                                          Price per item -{" "}
                                          {selectedVariant.name}
                                        </span>
                                        <span className="text-green-600">
                                          +${selectedVariant.price.toFixed(2)}
                                        </span>
                                      </div>
                                    )}
                                    {selectedProduct.options.map(
                                      (option, i) => {
                                        const selectedValue = productForm.watch(
                                          option._id
                                        );
                                        const choices = (
                                          productForm.getValues(
                                            `options.${i}.answers`
                                          ) || []
                                        ).filter(Boolean);
                                        const quantities =
                                          productForm.getValues(
                                            `options.${i}.quantities`
                                          ) || [];
                                        const prices =
                                          productForm.getValues(
                                            `options.${i}.prices`
                                          ) || [];
                                        if (
                                          selectedValue &&
                                          option.type === "Selection"
                                        ) {
                                          return choices.map((choice, i) => {
                                            return (
                                              <div
                                                key={`${option._id}-${i}`}
                                                className="flex items-center justify-between text-sm"
                                              >
                                                <span className="text-gray-600">
                                                  {choice} (x
                                                  {quantities[i]})
                                                </span>
                                                <span className="text-green-600">
                                                  +$
                                                  {(
                                                    prices[i] * quantities[i]
                                                  ).toFixed(2)}
                                                </span>
                                              </div>
                                            );
                                          });
                                        }

                                        if (option.type === "Checkbox") {
                                          return choices.map((choice, i) => {
                                            return (
                                              <div
                                                key={`${option._id}-${i}`}
                                                className="flex items-center justify-between text-sm"
                                              >
                                                <span className="text-gray-600">
                                                  {choice} (x
                                                  {quantities[i]})
                                                </span>
                                                <span className="text-green-600">
                                                  +$
                                                  {(
                                                    prices[i] * quantities[i]
                                                  ).toFixed(2)}
                                                </span>
                                              </div>
                                            );
                                          });
                                        }

                                        return null;
                                      }
                                    )}
                                  </div>
                                )}
                              {/* <div className="border-t pt-2 mb-2"> */}
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-gray-600">
                                    Item Price:
                                  </span>
                                  <span className="font-medium">
                                    ${currentItemPrice.toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-gray-600">
                                    Quantity:
                                  </span>
                                  <span className="font-medium">
                                    {productForm.watch("quantity") || 1}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between font-bold">
                                  <span>Total:</span>
                                  <span className="text-blue-600">
                                    ${currentItemPrice.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Add to Cart Button */}
                            <Button
                              type="submit"
                              size="lg"
                              disabled={isDisabled}
                              className={`w-full ${
                                isSoldOut
                                  ? "bg-blue-400 hover:bg-blue-300"
                                  : "bg-blue-600 hover:bg-blue-700"
                              }`}
                            >
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              {isSoldOut
                                ? "Sold Out"
                                : `Add to Cart - $${currentItemPrice.toFixed(
                                    2
                                  )}`}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </div>
              )
            )}
          </div>
        )}

        {/* Desktop layout */}
        {currentView !== "cart" && (
          <div className="hidden lg:grid lg:grid-cols-12 gap-6">
            {/* Categories Sidebar - Desktop */}
            <div className="lg:col-span-3 max-h-[85vh]">
              <Card className="border-0 shadow-lg h-fit">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Package className="h-6 w-6" />
                    Categories
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 max-h-[85vh] overflow-y-auto">
                  <div className="space-y-1">
                    <button
                      onClick={() => setSelectedCategory({ name: "all" })}
                      className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                        selectedCategory.name === "all"
                          ? "bg-blue-100 text-blue-700 border-r-4 border-blue-500"
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">All Products</span>
                        <Badge variant="secondary" className="text-xs">
                          {pagination.totalProducts}
                        </Badge>
                      </div>
                    </button>
                    {categoriesfromDb.length > 0 &&
                      categoriesfromDb.map((category) => {
                        return (
                          <button
                            key={category._id}
                            onClick={() => setSelectedCategory(category)}
                            className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                              selectedCategory.name === category.name
                                ? "bg-blue-100 text-blue-700 border-r-4 border-blue-500"
                                : "hover:bg-gray-50 text-gray-700"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">
                                {category.name}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {category.products.length}
                              </Badge>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Products and Configuration Area - Desktop */}
            <div className="lg:col-span-9 max-h-[85vh]">
              {selectedProduct ? (
                /* Product Configuration */
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCurrentView("products");
                          setSelectedProduct(null);
                          productForm.reset();
                        }}
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Products
                      </Button>
                    </div>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-2xl text-gray-900">
                          {selectedProduct.name}
                        </CardTitle>
                        <p className="text-gray-600 mt-1">
                          {selectedProduct.description}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {selectedProduct.categories?.length > 0 &&
                          selectedProduct.categories.map((category) => (
                            <span key={category._id}>{category.name}</span>
                          ))}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      {selectedVariant && (
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-lg px-3 py-1">
                          ${selectedVariant.price.toFixed(2)}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="max-h-[calc(100vh-300px)] overflow-y-auto">
                    <div className="mb-6">
                      <div className="w-[500px] h-[300px] bg-gray-100 rounded-lg flex items-center justify-center">
                        {selectedProduct.imgUrls.length > 0 ? (
                          selectedProduct.imgUrls.map((img) => (
                            <img
                              src={img}
                              alt={selectedProduct.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ))
                        ) : (
                          <div className="text-center">
                            <Package className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">
                              Product Image
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <Form {...productForm}>
                      <form
                        onSubmit={productForm.handleSubmit(
                          (data) => {
                            console.log("Form validated successfully:", data);
                            addToCart(data);
                          },
                          (errors) => {
                            console.error("Form validation failed:", errors);
                          }
                        )}
                      >
                        <div className="space-y-6">
                          {/* Variants */}
                          {selectedProduct.variants.length > 0 && (
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <Check className="h-5 w-5 text-blue-600" />
                                Product Variants
                                {selectedProduct?.inventory.quantity <= 5 && (
                                  <Badge variant="secondary">5 left</Badge>
                                )}
                              </h3>
                              <FormField
                                control={productForm.control}
                                name="variantId"
                                render={({ field }) => (
                                  <FormItem className="space-y-3">
                                    <FormLabel className="text-base font-medium">
                                      Size{" "}
                                      <span className="text-red-500">*</span>
                                    </FormLabel>
                                    <FormControl>
                                      <RadioGroup
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        className="grid grid-cols-2 xl:grid-cols-4 gap-2"
                                      >
                                        {selectedProduct.variants.length > 0 &&
                                          selectedProduct.variants.map(
                                            (variant) => (
                                              <div
                                                key={variant._id}
                                                className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-blue-50 hover:border-blue-200"
                                              >
                                                <RadioGroupItem
                                                  className="border-[1.5px] text-white border-gray-300 
                                                before:h-2 before:w-2 before:bg-white
                                                data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500
                                                data-[state=checked]:before:bg-white"
                                                  value={variant._id}
                                                  id={`variant-${variant._id}`}
                                                />
                                                <Label
                                                  htmlFor={`variant-${variant._id}`}
                                                  className="flex-1 cursor-pointer font-medium"
                                                >
                                                  {variant.name}
                                                  <span className="ml-1 text-green-600">
                                                    (${variant.price.toFixed(2)}
                                                    )
                                                  </span>
                                                </Label>
                                              </div>
                                            )
                                          )}
                                      </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          )}

                          {selectedProduct.options.length === 0 && (
                            <FormField
                              control={productForm.control}
                              name="quantity"
                              render={({ field }) => {
                                return (
                                  <FormItem>
                                    <div className="flex items-center justify-between">
                                      <FormLabel>Quantity</FormLabel>
                                      <span className="text-gray-500 text-sm">
                                        {selectedProduct?.cartMinimumEnabled &&
                                          `min ${selectedProduct?.cartMinimum}`}
                                        ,{" "}
                                        {selectedProduct?.cartMaximumEnabled &&
                                          `max ${selectedProduct?.cartMaximum}`}
                                      </span>
                                    </div>
                                    <FormControl>
                                      <div className="flex items-center gap-1">
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            field.onChange(field.value - 1)
                                          }
                                          disabled={field.value <= 1}
                                        >
                                          <Minus className="h-3 w-3" />
                                        </Button>
                                        <span className="text-sm w-8 text-center">
                                          {field.value}
                                        </span>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            field.onChange(field.value + 1)
                                          }
                                        >
                                          <Plus className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                );
                              }}
                            />
                          )}

                          {/* Options */}
                          {selectedProduct.options.length > 0 && (
                            <>
                              {selectedProduct.variants.length > 0 && (
                                <Separator />
                              )}
                              <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                  <Package className="h-5 w-5 text-blue-600" />
                                  Additional Options
                                </h3>
                                <div className="space-y-6">
                                  <FormField
                                    control={productForm.control}
                                    name="quantity"
                                    render={({ field }) => (
                                      <FormItem>
                                        <div className="flex items-center justify-between">
                                          <FormLabel>Quantity</FormLabel>
                                          <span className="text-gray-500 text-sm">
                                            {selectedProduct?.cartMinimumEnabled &&
                                              `min ${selectedProduct?.cartMinimum}`}
                                            ,{" "}
                                            {selectedProduct?.cartMaximumEnabled &&
                                              `max ${selectedProduct?.cartMaximum}`}
                                          </span>
                                        </div>
                                        <FormControl>
                                          <div className="flex items-center gap-1">
                                            <Button
                                              type="button"
                                              size="sm"
                                              variant="outline"
                                              onClick={() =>
                                                field.onChange(field.value - 1)
                                              }
                                              disabled={field.value <= 1}
                                            >
                                              <Minus className="h-3 w-3" />
                                            </Button>
                                            <span className="text-sm w-8 text-center">
                                              {field.value}
                                            </span>
                                            <Button
                                              type="button"
                                              size="sm"
                                              variant="outline"
                                              onClick={() =>
                                                field.onChange(field.value + 1)
                                              }
                                            >
                                              <Plus className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  {productForm
                                    .getValues("options")
                                    ?.map((option, index) => {
                                      const baseName = `options.${index}`;
                                      const type =
                                        selectedProduct?.options[index]?.type;
                                      const label =
                                        selectedProduct?.options[index]?.name;
                                      const required =
                                        selectedProduct?.options[index]
                                          ?.required;
                                      const choices =
                                        selectedProduct?.options[index]
                                          ?.settings?.choices || [];
                                      const enableQuantity =
                                        selectedProduct?.options[index]
                                          ?.settings?.enableQuantity;

                                      if (
                                        type === "Text" ||
                                        type === "Number"
                                      ) {
                                        return (
                                          <FormField
                                            key={option.id || label}
                                            control={productForm.control}
                                            name={`${baseName}.answers.0`}
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel>
                                                  {label}
                                                  {required && (
                                                    <span className="text-red-500 ml-1">
                                                      *
                                                    </span>
                                                  )}
                                                </FormLabel>
                                                <FormControl>
                                                  <Input
                                                    type={
                                                      type === "Number"
                                                        ? "number"
                                                        : "text"
                                                    }
                                                    className="w-full focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                                                    {...field}
                                                    value={field.value ?? ""}
                                                    onChange={(e) =>
                                                      field.onChange(
                                                        type === "Number"
                                                          ? e.target.value ===
                                                            ""
                                                            ? ""
                                                            : Number(
                                                                e.target.value
                                                              )
                                                          : e.target.value
                                                      )
                                                    }
                                                  />
                                                </FormControl>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                        );
                                      }

                                      if (type === "Selection") {
                                        const selectedValue = productForm.watch(
                                          `${baseName}.answers.0`
                                        );
                                        const quantity =
                                          productForm.watch(
                                            `${baseName}.quantities.0`
                                          ) || 1;

                                        return (
                                          <FormField
                                            key={option.id || label}
                                            control={productForm.control}
                                            name={`${baseName}.answers.0`}
                                            render={() => (
                                              <FormItem>
                                                <FormLabel>
                                                  {label}
                                                  {required && (
                                                    <span className="text-red-500 ml-1">
                                                      *
                                                    </span>
                                                  )}
                                                </FormLabel>
                                                <FormControl>
                                                  <RadioGroup
                                                    value={selectedValue || ""}
                                                    onValueChange={(value) => {
                                                      productForm.setValue(
                                                        `${baseName}.answers`,
                                                        [value]
                                                      );
                                                      productForm.setValue(
                                                        `${baseName}.quantities`,
                                                        [1]
                                                      );

                                                      const selectedChoice =
                                                        choices.find(
                                                          (c) =>
                                                            c.name === value
                                                        );
                                                      const selectedAmount =
                                                        selectedChoice?.amount ||
                                                        0;
                                                      productForm.setValue(
                                                        `${baseName}.prices`,
                                                        [selectedAmount]
                                                      );
                                                    }}
                                                    className="grid grid-cols-1 gap-2"
                                                  >
                                                    {choices.map(
                                                      (choice, cIdx) => (
                                                        <div
                                                          key={cIdx}
                                                          className="flex items-center space-x-2 p-2 rounded-lg border hover:bg-gray-50"
                                                        >
                                                          <RadioGroupItem
                                                            className="border-[1.5px] text-white border-gray-300
                                                          before:h-2 before:w-2 before:bg-white
                                                            data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500
                                                            data-[state=checked]:before:bg-white"
                                                            value={choice.name}
                                                            id={`${baseName}-${choice.name}`}
                                                          />
                                                          <Label
                                                            htmlFor={`${baseName}-${choice.name}`}
                                                            className="flex-1 cursor-pointer"
                                                          >
                                                            {choice.name}{" "}
                                                            {choice.amount >
                                                              0 && (
                                                              <span>
                                                                (+$
                                                                {choice.amount})
                                                              </span>
                                                            )}
                                                          </Label>
                                                          {selectedValue ===
                                                            choice.name &&
                                                            enableQuantity && (
                                                              <div className="flex items-center gap-1">
                                                                <Button
                                                                  type="button"
                                                                  size="sm"
                                                                  variant="outline"
                                                                  onClick={() =>
                                                                    productForm.setValue(
                                                                      `${baseName}.quantities.0`,
                                                                      Math.max(
                                                                        1,
                                                                        quantity -
                                                                          1
                                                                      )
                                                                    )
                                                                  }
                                                                >
                                                                  <Minus className="h-3 w-3" />
                                                                </Button>
                                                                <span className="text-sm w-8 text-center">
                                                                  {quantity}
                                                                </span>
                                                                <Button
                                                                  type="button"
                                                                  size="sm"
                                                                  variant="outline"
                                                                  onClick={() =>
                                                                    productForm.setValue(
                                                                      `${baseName}.quantities.0`,
                                                                      quantity +
                                                                        1
                                                                    )
                                                                  }
                                                                >
                                                                  <Plus className="h-3 w-3" />
                                                                </Button>
                                                              </div>
                                                            )}
                                                        </div>
                                                      )
                                                    )}
                                                  </RadioGroup>
                                                </FormControl>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                        );
                                      }

                                      if (type === "Checkbox") {
                                        return (
                                          <FormField
                                            key={option.id || label}
                                            control={productForm.control}
                                            name={`${baseName}.answers`}
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel>
                                                  {label}
                                                  {required && (
                                                    <span className="text-red-500 ml-1">
                                                      *
                                                    </span>
                                                  )}
                                                </FormLabel>
                                                <FormControl>
                                                  <div className="grid grid-cols-1 gap-2">
                                                    {choices.map(
                                                      (choice, cIdx) => {
                                                        const isChecked =
                                                          field.value?.includes(
                                                            choice.name
                                                          );

                                                        // Find the index of this choice in the selected answers
                                                        const answerIndex =
                                                          field.value?.indexOf(
                                                            choice.name
                                                          ) ?? -1;
                                                        const quantity =
                                                          answerIndex >= 0
                                                            ? productForm.watch(
                                                                `${baseName}.quantities.${answerIndex}`
                                                              ) || 1
                                                            : 1;

                                                        return (
                                                          <div
                                                            key={cIdx}
                                                            className="flex items-center space-x-2 p-2 rounded-lg border hover:bg-gray-50"
                                                          >
                                                            <Checkbox
                                                              className="w-5 h-5 peer data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 border-gray-300"
                                                              checked={
                                                                isChecked
                                                              }
                                                              onCheckedChange={(
                                                                checked
                                                              ) => {
                                                                let currentAnswers =
                                                                  field.value ||
                                                                  [];
                                                                let currentPrices =
                                                                  productForm.getValues(
                                                                    `${baseName}.prices`
                                                                  ) || [];
                                                                let currentQuantities =
                                                                  productForm.getValues(
                                                                    `${baseName}.quantities`
                                                                  ) || [];

                                                                // Remove placeholder if present
                                                                if (
                                                                  currentAnswers.length ===
                                                                    1 &&
                                                                  (currentAnswers[0] ===
                                                                    "" ||
                                                                    currentAnswers[0] ===
                                                                      undefined)
                                                                ) {
                                                                  currentAnswers =
                                                                    [];
                                                                  currentPrices =
                                                                    [];
                                                                  currentQuantities =
                                                                    [];
                                                                }

                                                                if (checked) {
                                                                  if (
                                                                    !currentAnswers.includes(
                                                                      choice.name
                                                                    )
                                                                  ) {
                                                                    currentAnswers =
                                                                      [
                                                                        ...currentAnswers,
                                                                        choice.name,
                                                                      ];
                                                                    currentPrices =
                                                                      [
                                                                        ...currentPrices,
                                                                        choice.amount ||
                                                                          0,
                                                                      ];
                                                                    currentQuantities =
                                                                      [
                                                                        ...currentQuantities,
                                                                        1,
                                                                      ];
                                                                  }
                                                                } else {
                                                                  const removeIndex =
                                                                    currentAnswers.indexOf(
                                                                      choice.name
                                                                    );
                                                                  if (
                                                                    removeIndex !==
                                                                    -1
                                                                  ) {
                                                                    currentAnswers =
                                                                      currentAnswers.filter(
                                                                        (
                                                                          _,
                                                                          i
                                                                        ) =>
                                                                          i !==
                                                                          removeIndex
                                                                      );
                                                                    currentPrices =
                                                                      currentPrices.filter(
                                                                        (
                                                                          _,
                                                                          i
                                                                        ) =>
                                                                          i !==
                                                                          removeIndex
                                                                      );
                                                                    currentQuantities =
                                                                      currentQuantities.filter(
                                                                        (
                                                                          _,
                                                                          i
                                                                        ) =>
                                                                          i !==
                                                                          removeIndex
                                                                      );
                                                                  }
                                                                }

                                                                field.onChange(
                                                                  currentAnswers
                                                                );
                                                                productForm.setValue(
                                                                  `${baseName}.prices`,
                                                                  currentPrices
                                                                );
                                                                productForm.setValue(
                                                                  `${baseName}.quantities`,
                                                                  currentQuantities
                                                                );
                                                              }}
                                                            />
                                                            <Label className="flex-1 cursor-pointer">
                                                              {choice.name}{" "}
                                                              {choice.amount >
                                                                0 && (
                                                                <span>
                                                                  (+$
                                                                  {
                                                                    choice.amount
                                                                  }
                                                                  )
                                                                </span>
                                                              )}
                                                            </Label>
                                                            {isChecked &&
                                                              enableQuantity && (
                                                                <div className="flex items-center gap-1">
                                                                  <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                      const currentAnswers =
                                                                        field.value ||
                                                                        [];
                                                                      const answerIndex =
                                                                        currentAnswers.indexOf(
                                                                          choice.name
                                                                        );

                                                                      if (
                                                                        answerIndex !==
                                                                        -1
                                                                      ) {
                                                                        const qList =
                                                                          productForm.getValues(
                                                                            `${baseName}.quantities`
                                                                          ) ||
                                                                          [];
                                                                        const updated =
                                                                          [
                                                                            ...qList,
                                                                          ];
                                                                        updated[
                                                                          answerIndex
                                                                        ] =
                                                                          Math.max(
                                                                            1,
                                                                            (updated[
                                                                              answerIndex
                                                                            ] ||
                                                                              1) -
                                                                              1
                                                                          );

                                                                        productForm.setValue(
                                                                          `${baseName}.quantities`,
                                                                          updated
                                                                        );
                                                                      }
                                                                    }}
                                                                  >
                                                                    <Minus className="h-3 w-3" />
                                                                  </Button>
                                                                  <span className="text-sm w-8 text-center">
                                                                    {quantity}
                                                                  </span>
                                                                  <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                      const currentAnswers =
                                                                        field.value ||
                                                                        [];
                                                                      const answerIndex =
                                                                        currentAnswers.indexOf(
                                                                          choice.name
                                                                        );

                                                                      if (
                                                                        answerIndex !==
                                                                        -1
                                                                      ) {
                                                                        const qList =
                                                                          productForm.getValues(
                                                                            `${baseName}.quantities`
                                                                          ) ||
                                                                          [];
                                                                        const updated =
                                                                          [
                                                                            ...qList,
                                                                          ];
                                                                        updated[
                                                                          answerIndex
                                                                        ] =
                                                                          (updated[
                                                                            answerIndex
                                                                          ] ||
                                                                            1) +
                                                                          1;

                                                                        productForm.setValue(
                                                                          `${baseName}.quantities`,
                                                                          updated
                                                                        );
                                                                        console.log(
                                                                          "increased quantity",
                                                                          updated
                                                                        );
                                                                      }
                                                                    }}
                                                                  >
                                                                    <Plus className="h-3 w-3" />
                                                                  </Button>
                                                                </div>
                                                              )}
                                                          </div>
                                                        );
                                                      }
                                                    )}
                                                  </div>
                                                </FormControl>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                        );
                                      }

                                      return null;
                                    })}
                                </div>
                              </div>
                            </>
                          )}

                          {/* Price Summary */}
                          <div className="bg-gray-50 p-4 rounded-lg border">
                            {/* <div className="flex items-center justify-between mb-2">
                              <span className="text-gray-600">Base Price:</span>
                              <span className="font-medium">
                                $
                                {(
                                  selectedProduct.price ||
                                  selectedProduct.originalPrice ||
                                  0
                                ).toFixed(2)}
                              </span>
                            </div> */}

                            {/* Show variant and option price additions */}
                            {productForm.watch() &&
                              Object.keys(productForm.watch()).length > 0 && (
                                <div className="space-y-1 mb-2">
                                  {selectedVariant && (
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-gray-600">
                                        Price per item - {selectedVariant.name}
                                      </span>
                                      <span className="text-green-600">
                                        +${selectedVariant.price.toFixed(2)}
                                      </span>
                                    </div>
                                  )}
                                  {selectedProduct.options.map((option, i) => {
                                    const selectedValue = productForm.watch(
                                      option._id
                                    );
                                    const choices = (
                                      productForm.getValues(
                                        `options.${i}.answers`
                                      ) || []
                                    ).filter(Boolean);
                                    const quantities =
                                      productForm.getValues(
                                        `options.${i}.quantities`
                                      ) || [];
                                    const prices =
                                      productForm.getValues(
                                        `options.${i}.prices`
                                      ) || [];
                                    if (
                                      selectedValue &&
                                      option.type === "Selection"
                                    ) {
                                      return choices.map((choice, i) => {
                                        return (
                                          <div
                                            key={`${option._id}-${i}`}
                                            className="flex items-center justify-between text-sm"
                                          >
                                            <span className="text-gray-600">
                                              {choice} (x
                                              {quantities[i]})
                                            </span>
                                            <span className="text-green-600">
                                              +$
                                              {(
                                                prices[i] * quantities[i]
                                              ).toFixed(2)}
                                            </span>
                                          </div>
                                        );
                                      });
                                    }

                                    if (
                                      selectedValue &&
                                      option.type === "Checkbox"
                                    ) {
                                      return choices.map((choice, i) => {
                                        return (
                                          <div
                                            key={`${option._id}-${i}`}
                                            className="flex items-center justify-between text-sm"
                                          >
                                            <span className="text-gray-600">
                                              {choice} (x
                                              {quantities[i]})
                                            </span>
                                            <span className="text-green-600">
                                              +$
                                              {(
                                                prices[i] * quantities[i]
                                              ).toFixed(2)}
                                            </span>
                                          </div>
                                        );
                                      });
                                    }

                                    return null;
                                  })}
                                </div>
                              )}

                            {/* <div className="border-t pt-2 mb-2"> */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-600">
                                  Item Price:
                                </span>
                                <span className="font-medium">
                                  ${currentItemPrice.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-600">Quantity:</span>
                                <span className="font-medium">
                                  {productForm.watch("quantity") || 1}
                                </span>
                              </div>
                              <div className="flex items-center justify-between font-bold">
                                <span>Total:</span>
                                <span className="text-blue-600">
                                  ${currentItemPrice.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="pt-4 sticky bottom-0 bg-white">
                            <Button
                              type="submit"
                              size="lg"
                              disabled={isDisabled}
                              className={`w-full ${
                                isSoldOut
                                  ? "bg-blue-400 hover:bg-blue-300"
                                  : "bg-blue-600 hover:bg-blue-700"
                              }`}
                            >
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              {isSoldOut
                                ? "Sold Out"
                                : `Add to Cart - $${currentItemPrice.toFixed(
                                    2
                                  )}`}
                            </Button>
                          </div>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              ) : (
                /* Products List */
                <Card className="border-0 shadow-lg h-full">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">
                        {selectedCategory.name === "all"
                          ? "All Products"
                          : selectedCategory.name}
                      </CardTitle>
                      <Badge variant="outline" className="text-sm">
                        {pagination.totalProducts} items
                      </Badge>
                    </div>

                    {/* Search and Filters */}
                    <div className="space-y-4 mt-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Search products..."
                          value={searchQuery}
                          onChange={(e) => onSearchChange(e)}
                          className="pl-10 h-11 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                        />
                        {searchQuery && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 py-2"
                            onClick={clearSearch}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 max-h-[480px] overflow-y-auto">
                    {productsfromDb.length > 0 ? (
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {productsfromDb.map((product) => (
                          <Card
                            key={product._id}
                            className="cursor-pointer transition-all duration-200 hover:shadow-md border hover:border-blue-200 hover:bg-gray-50"
                            onClick={() => handleProductSelect(product)}
                          >
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-gray-900 text-sm line-clamp-2 leading-tight">
                                      {product.name}
                                    </h4>
                                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                      {product.description}
                                    </p>
                                  </div>
                                  <Package className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
                                </div>

                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1">
                                    {product.variants[0]?.price ? (
                                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-xs font-semibold">
                                        ${product.variants[0].price}
                                      </Badge>
                                    ) : (
                                      <>
                                        {product.price && (
                                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs font-semibold">
                                            ${product.price}
                                          </Badge>
                                        )}
                                        {product.originalPrice > 1 &&
                                          product.price && (
                                            <Badge
                                              variant="outline"
                                              className="line-through text-gray-500 text-xs"
                                            >
                                              ${product.originalPrice}
                                            </Badge>
                                          )}
                                      </>
                                    )}
                                  </div>

                                  <Button
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 text-white h-7 text-xs"
                                  >
                                    Select Options
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          No Products Found
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          {selectedCategory.name === "all"
                            ? "Try adjusting your search terms or filters."
                            : `No products found in ${selectedCategory.name} category.`}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
      {/* <DevTool control={productForm.control} /> */}
      <DevTool control={customerForm.control} />
    </div>
  );
}
