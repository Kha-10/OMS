import React from "react";
import { useRef, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  FileImage,
  Mail,
  QrCode,
  ShoppingCart,
  Upload,
  CreditCard,
  Banknote,
  Phone,
  User,
  MapPin,
  Store,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { registerTenant } from "@/features/tenants/tenantSlice";
import axios from "@/helper/axios";
import LoadingButton from "@/components/LoadingButton";
import { showToast } from "@/components/NewToaster";

const step1Schema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
  email: z.string().email("Please enter a valid email address"),
  countryCode: z.string().min(1, "Country code is required"),
  phoneLocal: z.string().min(1, "Phone number is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const step2Schema = z.object({
  otp: z
    .array(z.string().length(1, "Each digit is required"))
    .length(6, "All 6 digits are required"),
});

const step3Schema = z.object({
  name: z.string().min(1, "Store name is required"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().optional(),
});

const step4Schema = z
  .object({
    name: z.string().optional(),
    categories: z.array(z.string()).optional(),
    currency: z.enum(["USD", "EUR", "GBP", "THB", "MMK"]).optional(),
    price: z.string().optional(),
    addSamples: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    const { addSamples, name, categories, currency, price } = data;

    if (addSamples !== true) {
      // Require name, categories, currency, price
      if (!name) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["name"],
          message: "Product name is required when samples are not added",
        });
      }
      if (!categories || categories.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["categories"],
          message:
            "At least one category is required when samples are not added",
        });
      }
      if (!currency) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["currency"],
          message: "Currency is required when samples are not added",
        });
      }
      if (!price) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["price"],
          message: "Price is required when samples are not added",
        });
      }
    }
  });

const step5Schema = z
  .object({
    cash: z.boolean(),
    bank: z.boolean(),
    qr: z.boolean(),
    countryCode: z.string().optional(),
    phoneLocal: z.string().optional(),
    accountNumber: z.string().optional(),
    accountHolderName: z.string().optional(),
    bankName: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Rule 1: At least one payment method selected
    if (!data.cash && !data.bank && !data.qr) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cash"],
        message: "At least one payment method must be selected",
      });
    }

    // Rule 2: If QR selected, countryCode & phoneLocal required
    if (data.qr) {
      if (!data.countryCode) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["countryCode"],
          message: "Country code is required when QR is selected",
        });
      }
      if (!data.phoneLocal) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["phoneLocal"],
          message: "Phone number is required when QR is selected",
        });
      }
    }
    if (data.bank) {
      if (!data.accountNumber) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["accountNumber"],
          message: "AccountNumber is required when Bank is selected",
        });
      }
      if (!data.accountHolderName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["accountHolderName"],
          message: "AccountHolderName is required when Bank is selected",
        });
      }
      if (!data.bankName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["bankName"],
          message: "BankName is required when Bank is selected",
        });
      }
    }
  });

export default function Onboarding({ stepper, dbEmail, dbStoreId, storeName }) {
  const [step, setStep] = useState(stepper);
  const [showPassword, setShowPassword] = useState(false);
  const [storeLogo, setStoreLogo] = useState(null);
  const [productImage, setProductImage] = useState(null);
  const [products, setProducts] = useState([]);
  const [email, setEmail] = useState(dbEmail);
  const [storeId, setStoreId] = useState(dbStoreId);
  const [loading, setLoading] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const storeLogoInputRef = useRef(null);
  const productImageInputRef = useRef(null);
  const otpInputRefs = useRef([]);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const defaultCategories = [
    "Electronics",
    "Clothing",
    "Food & Beverages",
    "Home & Garden",
    "Health & Beauty",
    "Sports & Outdoors",
    "Books & Media",
    "Toys & Games",
    "Automotive",
    "Office Supplies",
    "Jewelry & Accessories",
    "Art & Crafts",
  ];

  const step1Form = useForm({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      username: "",
      email: "",
      countryCode: "+66",
      phoneLocal: "",
      password: "",
    },
  });

  const step2Form = useForm({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      otp: Array(6).fill(""),
    },
    mode: "onChange",
  });

  const step3Form = useForm({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
    },
  });

  const step4Form = useForm({
    resolver: zodResolver(step4Schema),
    defaultValues: {
      name: "",
      categories: [],
      currency: "USD",
      price: "",
      addSamples: false,
    },
  });

  const step5Form = useForm({
    resolver: zodResolver(step5Schema),
    defaultValues: {
      cash: true,
      bank: false,
      qr: false,
      countryCode: "+66",
      phoneLocal: "",
      accountNumber: "",
      accountHolderName: "",
      bankName: "",
    },
  });

  const isStep1Valid = step1Form.formState.isValid;
  const isStep2Valid = step2Form.formState.isValid;
  const isStep3Valid = step3Form.formState.isValid;
  const isStep4Valid = step4Form.formState.isValid;
  const isStep5Valid = step5Form.formState.isValid;

  const nextStep = () => {
    setStep((prevStep) => (prevStep < 6 ? prevStep + 1 : prevStep));
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleUploadLogo = (file) => {
    if (file) {
      const url = URL.createObjectURL(file);
      setStoreLogo(url);
    }
  };

  const handleUploadProductImage = (file) => {
    if (file) {
      const url = URL.createObjectURL(file);
      setProductImage(url);
    }
  };

  const handleAddProduct = () => {
    const productName = step4Form.getValues("productName");
    const price = step4Form.getValues("price");
    const currency = step4Form.getValues("currency");

    if (productName && price) {
      setProducts([
        ...products,
        {
          name: productName,
          price,
          currency,
          image: productImage || undefined,
        },
      ]);
      step4Form.setValue("productName", "");
      step4Form.setValue("price", "");
      setProductImage(null);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...step2Form.getValues("otp")];
      newOtp[index] = value;
      step2Form.setValue("otp", newOtp, {
        shouldValidate: true,
        shouldDirty: true,
      });

      // Auto-focus next input
      if (value && index < 5) {
        otpInputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (
      e.key === "Backspace" &&
      !step2Form.getValues("otp")[index] &&
      index > 0
    ) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newOtp = pastedData
        .split("")
        .concat(Array(6 - pastedData.length).fill(""))
        .slice(0, 6);
      step2Form.setValue("otp", newOtp, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  const handleAccountCreation = async (data) => {
    try {
      setLoading(true);
      const createdUser = await dispatch(registerTenant(data)).unwrap();
      if (createdUser?.user) {
        setEmail(createdUser?.user?.email);
        nextStep();
      }
    } catch (error) {
      console.log("Error submitting the form", error);
      showToast({
        title: error?.response?.data?.msg || error?.email?.msg,
        type: "error",
      });
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (data) => {
    try {
      setLoading(true);
      let res = await axios.post("/api/users/verify-email", {
        code: data.otp,
        email,
      });
      console.log("res", res);
      if (res.status === 200) {
        nextStep();
      }
    } catch (error) {
      console.log("Error submitting the form", error);
      showToast({
        title: error?.response?.data?.msg || error?.email?.msg,
        type: "error",
      });
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      let res = await axios.post("/api/users/resend", {
        email,
      });
      if (res.status === 200) {
        step2Form.setValue("otp", Array(6).fill(""));
      }
    } catch (error) {
      console.log(error);
      showToast({
        title: error?.response?.data?.msg || error?.email?.msg,
        type: "error",
      });
    }
  };

  const handleStoreSetup = async (data) => {
    try {
      setLoading(true);
      let res = await axios.post(`/api/stores`, data);
      if (res.status === 200) {
        setStoreId(res.data._id);
        console.log("storeId", storeId);
        const file = productImageInputRef.current?.files?.[0];
        if (file) {
          const formData = new FormData();
          formData.append("photo", file);

          await axios.post(
            `/api/stores/${res.data._id}/upload?type=stores`,
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );
        }

        nextStep();
      }
    } catch (error) {
      console.log("Error submitting the form", error);
      showToast({
        title: error?.response?.data?.msg || error?.email?.msg,
        type: "error",
      });
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setStoreId(dbStoreId);
  }, [dbStoreId]);

  const skipStep = async () => {
    let res = await axios.patch("/api/users/skip");
    if (res.status === 200) {
      nextStep();
      if (res.data?.user?.onboarding_step === 7) {
        navigate(`/stores/${res.data?.store?.store._id}`);
      }
    }
  };
  const handleProductAddition = async (data) => {
    try {
      setLoading(true);
      let res = await axios.post(
        `/api/stores/${storeId}/products/onboarding`,
        data
      );
      if (res.status === 200) {
        const file = productImageInputRef.current?.files?.[0];
        if (file) {
          const formData = new FormData();
          formData.append("photo", file);
          await axios.post(
            `/api/stores/${storeId}/products/${res.data._id}/upload`,
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );
        }

        nextStep();
      }
    } catch (error) {
      console.log("Error submitting the form", error);
      showToast({
        title: error?.response?.data?.msg || error?.email?.msg,
        type: "error",
      });
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentConfig = async (data) => {
    try {
      setLoading(true);
      let res = await axios.patch(`/api/stores/${storeId}/payment`, data);
      if (res.status === 200) {
        nextStep();
      }
    } catch (error) {
      console.log("Error submitting the form", error);
      showToast({
        title: error?.response?.data?.message || error?.email?.msg,
        type: "error",
      });
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const categoryDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target)
      ) {
        setShowCategoryDropdown(false);
      }
    };

    if (showCategoryDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCategoryDropdown]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(
      `${import.meta.env.VITE_CUSTOMER_URL}/${storeName
        ?.toLowerCase()
        .replace(/\s+/g, "")}`
    );
    setShowCopySuccess(true);
    setTimeout(() => setShowCopySuccess(false), 3000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-28 relative">
      <div className="mx-auto w-full max-w-[95%] sm:max-w-4xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10 bg-white shadow rounded-xl">
        {step < 6 && (
          <div className="mb-8 text-center">
            <div className="mx-auto flex w-fit items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
              <span>Step {step} of 5</span>
            </div>
          </div>
        )}

        {showCopySuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-2 text-green-800 absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="flex items-center justify-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="font-medium">
                Store link copied to clipboard!
              </span>
            </div>
          </div>
        )}

        {step === 6 ? (
          <div className="flex min-h-[400px] sm:min-h-[500px] md:min-h-[600px] items-center justify-center">
            <div className="text-center space-y-6 max-w-md mx-auto px-4">
              <div className="space-y-4">
                <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  🎉 Your store is ready!
                </h1>
                <p className="text-base sm:text-lg text-gray-600">
                  Congratulations! Your store is now set up and ready to share
                  with customers.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  className="w-full rounded-xl bg-blue-500 text-white hover:bg-blue-600 py-3 text-base font-medium"
                  onClick={() => {
                    skipStep();
                  }}
                >
                  Go to Dashboard
                </Button>
                <Button
                  variant="outline"
                  className="w-full rounded-xl border-gray-300 py-3 text-base font-medium bg-transparent"
                  onClick={copyToClipboard}
                >
                  Share Store Link
                </Button>
              </div>

              <div className="pt-4 text-sm text-gray-500">
                You can always update your store settings later from the
                dashboard.
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col-reverse gap-6 lg:grid lg:grid-cols-2 lg:gap-8 xl:gap-10">
            {/* Left Column - Form (appears second on mobile) */}
            <div
              //   className={`
              // ${step5Form.watch("bank") && step === 5 && "h-[600px] lg:h-[650px]"}
              // flex max-h-[600px] flex-col lg:max-h-[650px]`}
              className="flex flex-col gap-6 w-full"
            >
              {step === 1 && (
                <Form {...step1Form}>
                  <form
                    onSubmit={step1Form.handleSubmit(handleAccountCreation)}
                    className="flex flex-col space-y-6"
                  >
                    <header className="space-y-2">
                      <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                        Create your account
                      </h1>
                      <p className="text-sm text-muted-foreground sm:text-base">
                        Sign up to start managing your store.
                      </p>
                    </header>

                    <div className="space-y-4 sm:space-y-5">
                      <FormField
                        control={step1Form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              Username
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                placeholder="username_123"
                                className="h-11 rounded-xl border-gray-200 text-sm sm:h-12 sm:text-base w-full focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={step1Form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              Email address
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="you@example.com"
                                className="h-11 rounded-xl border-gray-200 text-sm sm:h-12 sm:text-base w-full focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Phone number
                        </Label>
                        <div className="flex gap-2">
                          <FormField
                            control={step1Form.control}
                            name="countryCode"
                            render={({ field }) => (
                              <FormItem>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
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
                            control={step1Form.control}
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

                      <FormField
                        control={step1Form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              Password
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Create a secure password"
                                  className="h-11 rounded-xl border-gray-200 pr-10 text-sm sm:h-12 sm:text-base w-full focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                                  {...field}
                                  autoComplete="off"
                                />
                                <button
                                  type="button"
                                  aria-label={
                                    showPassword
                                      ? "Hide password"
                                      : "Show password"
                                  }
                                  onClick={() => setShowPassword((s) => !s)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <footer className="mt-auto flex items-center justify-between">
                      <div className="text-center">
                        <a href="/sign-in" className="text-sm text-blue-500">
                          Already have an account? Sign in
                        </a>
                      </div>
                      <LoadingButton
                        loading={loading}
                        disabled={!isStep1Valid}
                        icon={<ChevronRight className="h-4 w-4" />}
                      >
                        Continue
                      </LoadingButton>
                    </footer>
                  </form>
                </Form>
              )}

              {step === 2 && (
                <Form {...step2Form}>
                  <form
                    onSubmit={step2Form.handleSubmit(handleVerification)}
                    className="flex flex-col space-y-6"
                  >
                    <header className="space-y-2">
                      <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                        Verify your account
                      </h1>
                      <p className="text-sm text-muted-foreground sm:text-base">
                        We've sent a verification code to your email.
                      </p>
                    </header>

                    <div className="space-y-4 sm:space-y-6">
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">
                          Enter 6-digit code
                        </Label>
                        <div className="flex justify-center gap-2 sm:gap-3">
                          {/* Fixed OTP inputs to avoid void element error */}
                          {Array.from({ length: 6 }).map((_, index) => (
                            <Input
                              key={index}
                              ref={(el) => (otpInputRefs.current[index] = el)}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={step2Form.watch("otp")[index] || ""}
                              onChange={(e) =>
                                handleOtpChange(index, e.target.value)
                              }
                              onKeyDown={(e) => handleOtpKeyDown(index, e)}
                              onPaste={handleOtpPaste}
                              className="h-12 w-12 rounded-xl border-gray-200 text-center text-lg font-medium sm:h-14 sm:w-14 sm:text-xl focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                            />
                          ))}
                        </div>
                        {step2Form.formState.errors.otp && (
                          <p className="text-center text-sm text-red-500">
                            All 6 digits are required
                          </p>
                        )}
                      </div>

                      <div className="text-center">
                        <button
                          type="button"
                          className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                          // onClick={() =>
                          //   step2Form.setValue("otp", Array(6).fill(""))
                          // }
                          onClick={handleResend}
                        >
                          Resend code
                        </button>
                        <p className="text-xs text-red-400 sm:text-xs mt-5">
                          Didn't receive the email? Check your spam folder.
                        </p>
                      </div>
                    </div>

                    <footer className="mt-auto flex flex-col gap-3 pt-1 sm:items-end sm:justify-between">
                      <LoadingButton
                        loading={loading}
                        disabled={!isStep2Valid}
                        icon={<ChevronRight className="h-4 w-4" />}
                      >
                        Continue
                      </LoadingButton>
                    </footer>
                  </form>
                </Form>
              )}

              {step === 3 && (
                <Form {...step3Form}>
                  <form
                    onSubmit={step3Form.handleSubmit(handleStoreSetup)}
                    className="flex flex-col space-y-6"
                  >
                    <header className="space-y-2">
                      <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                        Set up your store
                      </h1>
                      <p className="text-sm text-muted-foreground sm:text-base">
                        Add your store name, contact details, and address.
                      </p>
                    </header>

                    <div className="space-y-4 sm:space-y-5">
                      <FormField
                        control={step3Form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              Store name <span className="text-red-400">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                placeholder="My Awesome Store"
                                className="h-11 rounded-xl border-gray-200 text-sm sm:h-12 sm:text-base w-full focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={step3Form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              Phone number{" "}
                              <span className="text-red-400">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="tel"
                                placeholder="+1 555-000-0000"
                                className="h-11 rounded-xl border-gray-200 text-sm sm:h-12 sm:text-base w-full focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={step3Form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              Address{" "}
                              <span className="text-muted-foreground">
                                (optional)
                              </span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                placeholder="123 Main St, City, State"
                                className="h-11 rounded-xl border-gray-200 text-sm sm:h-12 sm:text-base w-full focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Store logo
                        </Label>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => storeLogoInputRef.current?.click()}
                          className="h-11 w-full justify-start rounded-xl border-gray-200 text-sm sm:h-12 sm:text-base"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Add store logo
                        </Button>
                        <input
                          ref={storeLogoInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleUploadLogo(e.target.files?.[0])
                          }
                          className="hidden"
                        />
                      </div>
                    </div>

                    <footer className="mt-auto flex flex-col gap-3 pt-1 sm:items-end sm:justify-between">
                      <LoadingButton
                        loading={loading}
                        disabled={!isStep3Valid}
                        icon={<ChevronRight className="h-4 w-4" />}
                      >
                        Continue
                      </LoadingButton>
                    </footer>
                  </form>
                </Form>
              )}

              {step === 4 && (
                <Form {...step4Form}>
                  <form
                    onSubmit={step4Form.handleSubmit(handleProductAddition)}
                    className="flex flex-col space-y-6"
                  >
                    <header className="space-y-2">
                      <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                        Add products
                      </h1>
                      <p className="text-sm text-muted-foreground sm:text-base">
                        Add product names, prices, and images to your store.
                      </p>
                    </header>

                    <div className="space-y-4 sm:space-y-5">
                      <FormField
                        control={step4Form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              Product name
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                placeholder="Enter product name"
                                className="h-11 rounded-xl border-gray-200 text-sm sm:h-12 sm:text-base w-full focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={step4Form.control}
                        name="categories"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categories</FormLabel>
                            <FormControl>
                              <div
                                className="relative"
                                ref={categoryDropdownRef}
                              >
                                {/* Input Display */}
                                <div
                                  onClick={() =>
                                    setShowCategoryDropdown(
                                      !showCategoryDropdown
                                    )
                                  }
                                  className="flex min-h-[44px] w-full cursor-pointer flex-wrap items-center gap-1 rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 sm:min-h-[48px] sm:text-base"
                                >
                                  {field.value?.length > 0 ? (
                                    field.value.map((category) => (
                                      <span
                                        key={category}
                                        className="inline-flex items-center gap-1 rounded-lg bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800"
                                      >
                                        {category}
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            field.onChange(
                                              field.value.filter(
                                                (c) => c !== category
                                              )
                                            );
                                          }}
                                          className="ml-1 hover:text-blue-600"
                                        >
                                          ×
                                        </button>
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-muted-foreground">
                                      Select categories
                                    </span>
                                  )}
                                  <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                                </div>

                                {/* Dropdown */}
                                {showCategoryDropdown && (
                                  <div className="absolute top-full z-10 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-border bg-popover shadow-lg">
                                    {defaultCategories.map((category) => (
                                      <div
                                        key={category}
                                        onClick={() => {
                                          if (field.value?.includes(category)) {
                                            field.onChange(
                                              field.value.filter(
                                                (c) => c !== category
                                              )
                                            );
                                          } else {
                                            field.onChange([
                                              ...(field.value || []),
                                              category,
                                            ]);
                                          }
                                        }}
                                        className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm hover:bg-accent ${
                                          field.value?.includes(category)
                                            ? "bg-blue-50 text-blue-700"
                                            : ""
                                        }`}
                                      >
                                        <span>{category}</span>
                                        {field.value?.includes(category) && (
                                          <Check className="h-4 w-4 text-blue-600" />
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={step4Form.control}
                          name="currency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">
                                Currency
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-11 rounded-xl border-gray-200 sm:h-12 focus:ring-2 focus:ring-blue-500 focus-visible:ring-offset-0">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="USD">USD ($)</SelectItem>
                                  <SelectItem value="EUR">EUR (€)</SelectItem>
                                  <SelectItem value="GBP">GBP (£)</SelectItem>
                                  <SelectItem value="THB">THB (฿)</SelectItem>
                                  <SelectItem value="MMK">MMK (K)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={step4Form.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">
                                Price
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  className="h-11 rounded-xl border-gray-200 text-sm sm:h-12 sm:text-base w-full focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Product image
                        </Label>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => productImageInputRef.current?.click()}
                          className="h-11 w-full justify-start rounded-xl border-gray-200 text-sm sm:h-12 sm:text-base"
                        >
                          <FileImage className="mr-2 h-4 w-4" />
                          Add image
                        </Button>
                        <input
                          ref={productImageInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleUploadProductImage(e.target.files?.[0])
                          }
                          className="hidden"
                        />
                      </div>

                      {/* <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddProduct}
                      className="h-12 w-full rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 text-sm font-medium text-gray-600 hover:border-gray-400 hover:bg-gray-100 sm:h-14 sm:text-base"
                    >
                      + Add product
                    </Button> */}

                      <FormField
                        control={step4Form.control}
                        name="addSamples"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="peer data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 border-gray-300"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm font-medium">
                                Add sample products
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    <footer className="mt-auto flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={skipStep}
                        className="order-2 rounded-xl bg-white sm:order-1"
                      >
                        {/* <ArrowLeft className="mr-2 h-4 w-4" /> */}
                        Skip
                      </Button>
                      <LoadingButton
                        loading={loading}
                        disabled={!isStep4Valid}
                        icon={<ChevronRight className="h-4 w-4" />}
                      >
                        Continue
                      </LoadingButton>
                    </footer>
                  </form>
                </Form>
              )}

              {step === 5 && (
                <Form {...step5Form}>
                  <form
                    onSubmit={step5Form.handleSubmit(handlePaymentConfig)}
                    className="flex h-full flex-col"
                  >
                    <div className="flex-1 overflow-y-auto min-h-0">
                      <div className="p-1">
                        <header className="space-y-2 mb-6">
                          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                            Configure payment methods
                          </h1>
                          <p className="text-sm text-muted-foreground sm:text-base">
                            Choose how your customers can pay.
                          </p>
                        </header>

                        <div className="space-y-4 pb-4">
                          <FormField
                            control={step5Form.control}
                            name="cash"
                            render={({ field }) => (
                              <FormItem>
                                <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
                                  <div className="flex items-center space-x-3">
                                    <Banknote className="h-5 w-5 text-green-600" />
                                    <div>
                                      <FormLabel className="text-sm font-medium">
                                        Cash
                                      </FormLabel>
                                      <p className="text-xs text-muted-foreground">
                                        Accept cash payments
                                      </p>
                                    </div>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </div>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={step5Form.control}
                            name="qr"
                            render={({ field }) => (
                              <FormItem>
                                <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
                                  <div className="flex items-center space-x-3">
                                    <QrCode className="h-5 w-5 text-purple-600" />
                                    <div>
                                      <FormLabel className="text-sm font-medium">
                                        PromptPay
                                      </FormLabel>
                                      <p className="text-xs text-muted-foreground">
                                        Mobile payments
                                      </p>
                                    </div>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </div>
                              </FormItem>
                            )}
                          />
                          {step5Form.watch("qr") && (
                            <div className="flex gap-2">
                              <FormField
                                control={step5Form.control}
                                name="countryCode"
                                render={({ field }) => (
                                  <FormItem>
                                    <Select
                                      onValueChange={field.onChange}
                                      defaultValue={field.value}
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
                                control={step5Form.control}
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
                          )}
                          <FormField
                            control={step5Form.control}
                            name="bank"
                            render={({ field }) => (
                              <FormItem>
                                <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
                                  <div className="flex items-center space-x-3">
                                    <CreditCard className="h-5 w-5 text-blue-600" />
                                    <div>
                                      <FormLabel className="text-sm font-medium">
                                        Bank Transfer
                                      </FormLabel>
                                      <p className="text-xs text-muted-foreground">
                                        Direct bank transfers
                                      </p>
                                    </div>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </div>
                              </FormItem>
                            )}
                          />
                          {step5Form.watch("bank") && (
                            <div className="space-y-4 sm:space-y-5">
                              <FormField
                                control={step5Form.control}
                                name="bankName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm font-medium">
                                      Bank name
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        type="text"
                                        className="h-11 rounded-xl border-gray-200 text-sm sm:h-12 sm:text-base w-full focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={step5Form.control}
                                name="accountNumber"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm font-medium">
                                      Account number
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        type="text"
                                        className="h-11 rounded-xl border-gray-200 text-sm sm:h-12 sm:text-base w-full focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={step5Form.control}
                                name="accountHolderName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm font-medium">
                                      Account holder name
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        type="text"
                                        className="h-11 rounded-xl border-gray-200 text-sm sm:h-12 sm:text-base w-full focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <footer className="flex flex-col gap-3 pt-4 border-t border-gray-100 bg-white sm:flex-row sm:items-center sm:justify-between">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={skipStep}
                          className="order-2 rounded-xl bg-white sm:order-1"
                        >
                          {/* <ArrowLeft className="mr-2 h-4 w-4" /> */}
                          Skip
                        </Button>
                        <LoadingButton
                          loading={loading}
                          disabled={!isStep5Valid}
                        >
                          Finish Setup
                        </LoadingButton>
                      </footer>
                    </div>
                  </form>
                </Form>
              )}
            </div>

            {/* Right Column - Preview (appears first on mobile) */}
            <div className="flex items-center justify-center rounded-2xl bg-blue-50 p-4 sm:p-6 lg:p-12 w-full">
              <div className="w-full max-w-full sm:max-w-sm lg:max-w-md">
                {step === 1 && (
                  // <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
                  //   <div className="flex items-center space-x-4">
                  //     <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                  //       <User className="h-6 w-6 text-gray-600" />
                  //     </div>
                  //     <div className="flex-1 min-w-0">
                  //       <h3 className="font-medium text-gray-900">
                  //         {step1Form.watch("email") || "your@email.com"}
                  //       </h3>
                  //       <p className="text-sm text-gray-500">
                  //         {step1Form.watch("countryCode")}{" "}
                  //         {step1Form.watch("phoneLocal") || "555-000-0000"}
                  //       </p>
                  //     </div>
                  //   </div>
                  // </div>
                  <div className="rounded-2xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-black/5 w-full max-w-sm">
                    <div className="flex items-center space-x-4">
                      {/* User Icon */}
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
                        <User className="h-6 w-6 text-gray-600" />
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 break-words">
                          {step1Form.watch("email") || "your@email.com"}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">
                          {step1Form.watch("countryCode")}{" "}
                          {step1Form.watch("phoneLocal") || "555-000-0000"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
                    <div className="text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                        <Mail className="h-8 w-8 text-blue-600" />
                      </div>
                      <h3 className="font-medium text-gray-900">
                        Verification sent
                      </h3>
                      <p className="text-sm text-gray-500">Check your email</p>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        {storeLogo ? (
                          <img
                            src={storeLogo || "/placeholder.svg"}
                            alt="Store logo"
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                            <Store className="h-6 w-6 text-gray-600" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {step3Form.watch("name") || "Your Store Name"}
                          </h3>
                          <p className="text-sm text-gray-500">Store</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4" />
                          <span>
                            {step3Form.watch("phone") || "+1 555-000-0000"}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4" />
                          <span>
                            {step3Form.watch("address") ||
                              "123 Main St, City, State"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
                    <div className="space-y-4">
                      {productImage && (
                        <img
                          src={productImage || "/placeholder.svg"}
                          alt="Product"
                          className="h-32 w-full rounded-lg object-cover"
                        />
                      )}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {step4Form.watch("name") || "Sample Product"}
                          </h3>
                          <p className="text-lg font-semibold text-gray-900">
                            {step4Form.watch("currency") === "USD" && "$"}
                            {step4Form.watch("currency") === "EUR" && "€"}
                            {step4Form.watch("currency") === "GBP" && "£"}
                            {step4Form.watch("currency") === "THB" && "฿"}
                            {step4Form.watch("currency") === "MMK" && "K"}
                            {step4Form.watch("price") || "29.99"}
                          </p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black">
                          <ShoppingCart className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {step === 5 && (
                  <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900">
                        Payment Options
                      </h3>
                      <div className="flex justify-center space-x-4">
                        {step5Form.watch("cash") && (
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                            <Banknote className="h-6 w-6 text-green-600" />
                          </div>
                        )}
                        {step5Form.watch("bank") && (
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                            <CreditCard className="h-6 w-6 text-blue-600" />
                          </div>
                        )}
                        {step5Form.watch("qr") && (
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                            <QrCode className="h-6 w-6 text-purple-600" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
