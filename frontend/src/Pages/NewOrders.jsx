import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Search,
  Tag,
  X,
  Home,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { DevTool } from "@hookform/devtools";
import { useForm, useFieldArray } from "react-hook-form";

const products = [
  { id: "1", name: "Mama noodle", price: 50.0, unit: "1 KG" },
  { id: "2", name: "Yum yun", price: 45.0, unit: "1 PC" },
];
const customers = [
  { id: 1, name: "John Doe", phoneCode: "+95", phone: "9123456789" },
  { id: 2, name: "Jane Smith", phoneCode: "+95", phone: "9987654321" },
  { id: 3, name: "Mike Johnson", phoneCode: "+66", phone: "9456789123" },
  { id: 4, name: "Sarah Williams", phoneCode: "+66", phone: "9321654987" },
];

export default function NewOrders() {
  const [isDiscountOpen, setIsDiscountOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isCustomItemOpen, setIsCustomItemOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [customItem, setCustomItem] = useState({
    name: "",
    price: null,
    quantity: 1,
  });

  const form = useForm({
    defaultValues: {
      customerName: "",
      phoneCode: "+66",
      phoneNumber: "",
      customItem: [],
      remark: "",
      adjustment: 0,
      discountCode: "",
    },
  });

  const { fields, append, remove, replace, update } = useFieldArray({
    control: form.control,
    name: "customItem",
  });

  const selectCustomer = (customer) => {
    form.setValue("customerName", customer.name);
    form.setValue("phoneNumber", customer.phone);
    form.setValue("phoneCode", customer.phoneCode);
    setOpen(false);
  };

  const onSubmit = (data) => {
    setOpen(false);
  };

  const adjustment = form.watch("adjustment");

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectProduct = (product) => {
    setSelectedProduct(product);
    setSelectedQuantity(1);
    setIsAddItemOpen(false);
  };

  const addSelectedProduct = () => {
    if (selectedProduct) {
      append({
        id: selectedProduct.id,
        name: selectedProduct.name,
        price: selectedProduct?.price * selectedQuantity,
        quantity: selectedQuantity,
        unit: selectedProduct.unit,
      });
      setSelectedProduct(null);
      setSelectedQuantity(1);
      setIsAddItemOpen(false);
    }
  };

  const addCustomItem = () => {
    if (customItem.name && customItem.price > 0) {
      append({ id: `custom-${Date.now()}`, ...customItem });
      setCustomItem({ name: "", price: 0, quantity: 1 });
      setIsCustomItemOpen(false);
    }
  };

  const calculateTotals = () => {
    const itemsTotal = fields.reduce((sum, item) => sum + item.price, 0);
    const itemsQuantity = fields.reduce((sum, item) => sum + item.quantity, 0);
    console.log("itemsQuantity",itemsQuantity);
    const adjustmentValue = Number(form.watch("adjustment")) || 0;
    const subtotal = itemsTotal + adjustmentValue;
    return {
      items: itemsTotal,
      quantity: itemsQuantity,
      others: 0,
      service: 0,
      adjustment: adjustmentValue,
      subtotal,
      total: subtotal,
    };
  };

  const totals = calculateTotals();

  console.log("fields", fields);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="mx-auto max-w-2xl p-4 md:p-6 space-y-6">
          {/* Customer Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">Checkout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                rules={{
                  required: "Customer name is required",
                }}
                name="customerName"
                render={({ field }) => (
                  <div>
                    <FormLabel>
                      Customer Name <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        id="customerName"
                        onFocus={() => {
                          if (form.formState.isSubmitting) {
                            setOpen(false);
                          } else {
                            setOpen(true);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </div>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumber"
                rules={{ required: "Phone number is required" }}
                render={({ field }) => (
                  <div>
                    <FormLabel>
                      Phone <span className="text-red-500">*</span>
                    </FormLabel>
                    <div className="flex gap-2">
                      <Select
                        defaultValue="+66"
                        value={form.watch("phoneCode")}
                        onValueChange={(value) =>
                          form.setValue("phoneCode", value)
                        }
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue placeholder="Code" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="+66">+66</SelectItem>
                          <SelectItem value="+95">+95</SelectItem>
                          <SelectItem value="+1">+1</SelectItem>
                          <SelectItem value="+44">+44</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormControl>
                        <Input
                          {...field}
                          id="phoneNumber"
                          type="tel"
                          className="flex-1"
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </div>
                )}
              />
            </CardContent>
          </Card>

          {/* Items Card */}
          <Card>
            <CardContent className="pt-6">
              <Label>Items</Label>
              <div className="space-y-2 mt-2">
                {fields.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        ${item.price.toFixed(2)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (fields[index].quantity > 1) {
                            update(index, {
                              ...fields[index],
                              price:
                                fields[index].price -
                                fields[index].price / fields[index].quantity,
                              quantity: fields[index].quantity - 1,
                            });
                          }
                          if (fields[index].quantity == 1) {
                            remove(index);
                          }
                        }}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          update(index, {
                            ...fields[index],
                            price:
                              fields[index].price +
                              fields[index].price / fields[index].quantity,
                            quantity: fields[index].quantity + 1,
                          });
                        }}
                      >
                        +
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          remove(index);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => setIsAddItemOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Add item
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => setIsCustomItemOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Add custom item
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Remark Card */}
          <Card>
            <CardContent className="p-4 bg-blue-300 mx-2 mt-2 mb-4">
              <p className="text-sm text-white">Only available on Admin view</p>
            </CardContent>
            <CardContent>
              <FormField
                control={form.control}
                name="remark"
                render={({ field }) => (
                  <div className="space-y-2">
                    <FormLabel>Remark</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Visible to customers
                    </p>
                    <FormControl>
                      <Input {...field} id="remark" placeholder="Optional" />
                    </FormControl>
                    <FormMessage />
                  </div>
                )}
              />
            </CardContent>
            <CardContent>
              <FormField
                control={form.control}
                name="adjustment"
                render={({ field }) => (
                  <div className="space-y-2">
                    <FormLabel>Adjustment</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Add arbitrary amount to adjust the charges in invoice
                    </p>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          id="adjustment"
                          type="number"
                          onChange={(e) => {
                            const value = e.target.value;
                            form.setValue(
                              "adjustment",
                              value === "" ? "" : Number(value),
                              {
                                shouldValidate: true,
                              }
                            );
                          }}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 space-y-0.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 hover:bg-transparent"
                            onClick={() =>
                              form.setValue(
                                "adjustment",
                                (Number(form.watch("adjustment")) || 0) + 1
                              )
                            }
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 hover:bg-transparent"
                            onClick={() =>
                              form.setValue(
                                "adjustment",
                                (Number(form.watch("adjustment")) || 0) - 1
                              )
                            }
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </div>
                )}
              />
            </CardContent>
          </Card>

          {/* Discount Code Card */}
          <Card>
            <CardContent className="pt-6">
              <Button
                type="button"
                variant="outline"
                className="flex w-full items-center justify-between"
                onClick={() => setIsDiscountOpen(!isDiscountOpen)}
              >
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  <span>Discount code</span>
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
              {isDiscountOpen && (
                <div className="mt-2">
                  <FormField
                    control={form.control}
                    name="discountCode"
                    render={({ field }) => (
                      <div>
                        <FormControl>
                          <Input {...field} id="discountCode" />
                        </FormControl>
                        <FormMessage />
                      </div>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {fields.length > 0 && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <h3 className="font-semibold text-lg">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Items ({totals.quantity})</span>
                    <span>${totals.items.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Others</span>
                    <span>${totals.others.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service</span>
                    <span className="text-blue-600">
                      ${totals.service.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Adjustment</span>
                    <span
                      className={
                        totals.adjustment >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      ${totals.adjustment.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span>Subtotal</span>
                    <span>${totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t font-semibold">
                    <span>Total</span>
                    <span>${totals.total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Save Button */}
          <Button className="w-full bg-[#635bff] hover:bg-[#5851ea]">
            Save
          </Button>
          {/* custom command box */}
          <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput placeholder="Search customers..." />
            <CommandList>
              <CommandEmpty>No customers found.</CommandEmpty>
              <CommandGroup heading="Customers">
                {customers.map((customer) => (
                  <CommandItem
                    key={customer.id}
                    onSelect={() => selectCustomer(customer)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <User className="h-4 w-4" />
                    <div>
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-gray-500">
                        {customer.phoneCode} {customer.phone}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </CommandDialog>

          {/* Add Item Dialog */}
          <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by Product name"
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      className="flex w-full items-center justify-between rounded-lg p-2 text-left hover:bg-muted"
                      onClick={() => selectProduct(product)}
                    >
                      <span>{product.name}</span>
                      <span className="text-sm text-muted-foreground">
                        ${product.price.toFixed(2)} / {product.unit}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Product Details Dialog */}
          <Dialog
            open={!!selectedProduct}
            onOpenChange={() => setSelectedProduct(null)}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{selectedProduct?.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Price</span>
                  <span>${selectedProduct?.price.toFixed(2)}</span>
                </div>
                <div>
                  <Label>Quantity ({selectedProduct?.unit})</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        selectedQuantity > 1 &&
                        setSelectedQuantity(selectedQuantity - 1)
                      }
                    >
                      -
                    </Button>
                    <span className="w-12 text-center">{selectedQuantity}</span>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedQuantity(selectedQuantity + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>
                <Button
                  className="w-full bg-[#635bff] hover:bg-[#5851ea]"
                  onClick={addSelectedProduct}
                >
                  Add $
                  {((selectedProduct?.price ?? 0) * selectedQuantity).toFixed(
                    2
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Add Custom Item Dialog */}
          <Dialog open={isCustomItemOpen} onOpenChange={setIsCustomItemOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add custom item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="custom-name">Name</Label>
                  <Input
                    id="custom-name"
                    value={customItem.name}
                    onChange={(e) =>
                      setCustomItem({ ...customItem, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="custom-price">Price</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="custom-price"
                      type="number"
                      value={customItem.price}
                      onChange={(e) => {
                        const value = e.target.value;
                        setCustomItem({
                          ...customItem,
                          price: value === "" ? "" : Number(value),
                        });
                      }}
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (customItem.quantity > 1) {
                            setCustomItem({
                              ...customItem,
                              quantity: customItem.quantity - 1,
                            });
                          }
                        }}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center">
                        {customItem.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          setCustomItem({
                            ...customItem,
                            quantity: customItem.quantity + 1,
                          })
                        }
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>
                <Button
                  className="w-full bg-[#635bff] hover:bg-[#5851ea]"
                  onClick={addCustomItem}
                  disabled={!customItem.name || customItem.price <= 0}
                >
                  Add custom item
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <DevTool control={form.control} />
        </div>
      </form>
    </Form>
  );
}
