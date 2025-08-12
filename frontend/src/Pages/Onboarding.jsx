import React from "react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ArrowLeft,
  ChevronRight,
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

const step1Schema = z.object({
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
  phone: z.string().optional(),
  address: z.string().optional(),
});

const step4Schema = z
  .object({
    productName: z.string().optional(),
    currency: z.enum(["USD", "EUR", "GBP"]).optional(),
    price: z.string().optional(),
    addSamples: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    const { addSamples, productName, currency, price } = data;

    if (addSamples !== true) {
      // Require productName, currency, price
      if (!productName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["productName"],
          message: "Product name is required when samples are not added",
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
  })
  .refine((data) => data.cash || data.bank || data.qr, {
    message: "At least one payment method must be selected",
    path: ["cash"], // or any path you want to show the error on
  });

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [storeLogo, setStoreLogo] = useState(null);
  const [productImage, setProductImage] = useState(null);
  const [products, setProducts] = useState([]);

  const storeLogoInputRef = useRef(null);
  const productImageInputRef = useRef(null);
  const otpInputRefs = useRef([]);

  const step1Form = useForm({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      email: "",
      countryCode: "+1",
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
      productName: "",
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
    },
  });

  const isStep1Valid = step1Form.formState.isValid;
  const isStep2Valid = step2Form.formState.isValid;
  const isStep3Valid = step3Form.formState.isValid;
  const isStep4Valid = step4Form.formState.isValid;
  const isStep5Valid = step5Form.formState.isValid;

  const nextStep = () => {
    if (step < 5) setStep(step + 1);
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

  const handleAccountCreation = (data) => {
    console.log("Account data:", data);
    // Handle account creation logic
    nextStep();
  };

  const handleVerification = (data) => {
    console.log("Verification data:", data);
    // Handle verification logic
    nextStep();
  };

  const handleStoreSetup = (data) => {
    console.log("Store data:", data);
    // Handle store setup logic
    nextStep();
  };

  const handleProductAddition = (data) => {
    console.log("Store data:", data);
    // Handle store setup logic
    nextStep();
  };

  const handlePaymentConfig = (data) => {
    console.log("Store data:", data);
    // Handle store setup logic
    nextStep();
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="mx-auto w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-10 bg-white shadow rounded-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto flex w-fit items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
            <span>Step {step} of 5</span>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-6 lg:grid lg:grid-cols-2 lg:gap-8 xl:gap-10">
          {/* Left Column - Form (appears second on mobile) */}
          <div className="flex max-h-[600px] flex-col lg:max-h-[650px]">
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
                                  <SelectItem value="+1">+1</SelectItem>
                                  <SelectItem value="+44">+44</SelectItem>
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

                  <footer className="mt-auto flex flex-col gap-3 pt-1 sm:items-end sm:justify-between">
                    {/* <Button
                      type="button"
                      variant="outline"
                      onClick={nextStep}
                      className="order-2 rounded-xl bg-white sm:order-1"
                    >
                      Skip
                    </Button> */}
                    <Button
                      disabled={!isStep1Valid}
                      className="order-1 rounded-xl bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500 sm:order-2"
                    >
                      Continue
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
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
                      We've sent a verification code to your email or phone.
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
                        onClick={() =>
                          step2Form.setValue("otp", Array(6).fill(""))
                        }
                      >
                        Resend code
                      </button>
                    </div>
                  </div>

                  <footer className="mt-auto flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      className="order-2 rounded-xl bg-white sm:order-1"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      disabled={!isStep2Valid}
                      className="order-1 rounded-xl bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500 sm:order-2"
                    >
                      Continue
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
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
                            Store name
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
                            <span className="text-muted-foreground">
                              (optional)
                            </span>
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
                      <Label className="text-sm font-medium">Store logo</Label>
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
                        onChange={(e) => handleUploadLogo(e.target.files?.[0])}
                        className="hidden"
                      />
                    </div>
                  </div>

                  <footer className="mt-auto flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      className="order-2 rounded-xl bg-white sm:order-1"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      disabled={!isStep3Valid}
                      className="order-1 rounded-xl bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500 sm:order-2"
                    >
                      Continue
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
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
                      name="productName"
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

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddProduct}
                      className="h-12 w-full rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 text-sm font-medium text-gray-600 hover:border-gray-400 hover:bg-gray-100 sm:h-14 sm:text-base"
                    >
                      + Add product
                    </Button>

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
                      onClick={prevStep}
                      className="order-2 rounded-xl bg-white sm:order-1"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      disabled={!isStep4Valid}
                      className="order-1 rounded-xl bg-blue-500 text-white hover:bg-blue-600 sm:order-2  disabled:bg-gray-300 disabled:text-gray-500"
                    >
                      Continue
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </footer>
                </form>
              </Form>
            )}

            {step === 5 && (
              <Form {...step5Form}>
                <form
                  onSubmit={step5Form.handleSubmit(handlePaymentConfig)}
                  className="flex flex-col space-y-6"
                >
                  <header className="space-y-2">
                    <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                      Configure payment methods
                    </h1>
                    <p className="text-sm text-muted-foreground sm:text-base">
                      Choose how your customers can pay.
                    </p>
                  </header>

                  <div className="space-y-4">
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
                                  QR Payment
                                </FormLabel>
                                <p className="text-xs text-muted-foreground">
                                  Mobile QR code payments
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
                  </div>

                  <footer className="mt-auto flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      className="order-2 rounded-xl bg-white sm:order-1"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      disabled={!isStep5Valid}
                      className="order-1 rounded-xl bg-blue-500 text-white hover:bg-blue-600 sm:order-2  disabled:bg-gray-300 disabled:text-gray-500"
                    >
                      Finish Setup
                    </Button>
                  </footer>
                </form>
              </Form>
            )}
          </div>

          {/* Right Column - Preview (appears first on mobile) */}
          <div className="flex items-center justify-center rounded-2xl bg-blue-50 p-6 sm:p-8 lg:p-12">
            <div className="w-full max-w-sm">
              {step === 1 && (
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
                  <div className="flex items-center space-x-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                      <User className="h-6 w-6 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {step1Form.watch("email") || "your@email.com"}
                      </h3>
                      <p className="text-sm text-gray-500">
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
                    <p className="text-sm text-gray-500">
                      Check your email or phone
                    </p>
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
                          {step4Form.watch("productName") || "Sample Product"}
                        </h3>
                        <p className="text-lg font-semibold text-gray-900">
                          {step4Form.watch("currency") === "USD" && "$"}
                          {step4Form.watch("currency") === "EUR" && "€"}
                          {step4Form.watch("currency") === "GBP" && "£"}
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
      </div>
    </div>
  );
}
