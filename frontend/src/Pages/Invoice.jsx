import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Download, Printer, Edit } from "lucide-react";
import { toPng, toJpeg } from "html-to-image";
import jsPDF from "jspdf";
import useOrders from "@/hooks/useOrders";
import { format } from "date-fns";
import StatusBadge from "@/components/StatusBadge";
import { useSelector } from "react-redux";

const currency = (n) =>
  n.toLocaleString(undefined, { style: "currency", currency: "USD" });

const Invoice = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isPending } = useOrders(
    { id },
    {
      enabled: !!id,
    }
  );
  const orders = data;

  const captureRef = useRef(null);

  const { stores } = useSelector((state) => state.stores);
  console.log("stores", stores);

  const handleDownloadPng = async () => {
    if (!captureRef.current) return;
    try {
      setIsDownloading(true);

      const dataUrl = await toPng(captureRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `invoice-${orders?.invoiceNumber}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to download PNG:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadJpg = async () => {
    if (!captureRef.current) return;
    try {
      setIsDownloading(true);

      const dataUrl = await toJpeg(captureRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        quality: 0.95,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `invoice-${orders?.invoiceNumber}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to download JPG:", err);
    } finally {
      setIsDownloading(false); // Show icons again
    }
  };

  const handleDownloadPdf = async () => {
    if (!captureRef.current) return;
    try {
      setIsDownloading(true);

      const dataUrl = await toPng(captureRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`invoice-${orders?.invoiceNumber}.pdf`);
    } catch (err) {
      console.error("Failed to download PDF:", err);
    } finally {
      setIsDownloading(false); // Show icons again
    }
  };
  console.log(orders.manualCustomer);
  return (
    <>
      <header className="container mx-auto py-6">
        <nav className="text-sm text-muted-foreground">
          <Link to="/" className="hover:underline">
            Home
          </Link>
          <span className="px-2">/</span>
          <span>Invoice #{orders?.invoiceNumber}</span>
        </nav>
      </header>

      <main className="container mx-auto pb-16">
        <section aria-labelledby="invoice-title" className="mx-auto max-w-2xl">
          <h1 id="invoice-title" className="sr-only">
            Invoice Receipt
          </h1>

          <div ref={captureRef} id="invoice-capture">
            <Card className="p-4 sm:p-6 md:p-8 transition-transform duration-300 hover:shadow-lg">
              <CardContent className="p-0">
                <div className="flex items-start justify-between">
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={orders.orderStatus} />
                    <StatusBadge status={orders.paymentStatus} />
                    <StatusBadge status={orders.fulfillmentStatus} />
                  </div>
                  {!isDownloading && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="icon"
                        type="button"
                        onClick={() => navigate(`/addToCart/${orders._id}`)}
                      >
                        <Edit />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Download invoice"
                          >
                            <Download />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={handleDownloadPng}>
                            Download PNG
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleDownloadJpg}>
                            Download JPG
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Download PDF"
                        onClick={handleDownloadPdf}
                      >
                        <Printer />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="mt-6 grid gap-2">
                  <h2 className="text-2xl font-semibold">{stores[0]?.name}</h2>
                  <div className="text-sm">
                    {/* <a
                      href={`https://${invoice.customer.url}`}
                      className="text-primary hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {invoice.customer.url}
                    </a> */}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stores[0]?.phone}
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                  <div className="text-muted-foreground">Invoice No</div>
                  <div className="text-right font-medium">
                    #{orders?.invoiceNumber}
                  </div>
                  <div className="text-muted-foreground">Order date</div>
                  <div className="text-right font-medium">
                    {format(new Date(orders.createdAt), "dd MMMM yyyy, h:mm a")}
                  </div>
                </div>

                <div className="my-6 h-px bg-border" />

                <h3 className="text-base font-semibold">Items</h3>

                <Table className="mt-2">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Qty</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.items.map((it, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-muted-foreground">
                          {it.quantity}x
                        </TableCell>
                        <TableCell>
                          <Link to="#" className="text-primary hover:underline">
                            {it.productName}
                          </Link>
                        </TableCell>
                        <TableCell className="text-right">
                          {currency(it.totalPrice)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="my-4 h-px bg-border" />

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">
                    Items total (
                    {orders.items.reduce((a, b) => a + b.quantity, 0)})
                  </div>
                  <div className="text-right">
                    {currency(orders.pricing.subtotal)}
                  </div>
                  <div className="text-muted-foreground">Subtotal</div>
                  <div className="text-right">
                    {currency(orders.pricing.subtotal)}
                  </div>
                  <div className="text-muted-foreground">
                    {orders.pricing?.adjustments?.map((adj) => adj.name)}
                  </div>
                  <div className="text-right">
                    {currency(
                      orders.pricing?.adjustments?.map((adj) => adj.value)
                    )}
                  </div>
                  <div className="font-semibold">Total</div>
                  <div className="text-right font-semibold">
                    {currency(orders.pricing.finalTotal)}
                  </div>
                </div>

                <div className="my-6 h-px bg-border" />

                <h3 className="text-base font-semibold">Order Details</h3>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div className="text-muted-foreground">Customer</div>
                  <div className="text-right">
                    {orders?.manualCustomer?.name ? (
                      <>
                        {orders.manualCustomer.name}
                        {orders?.manualCustomer?.phone
                          ? ` / ${orders.manualCustomer.phone}`
                          : ""}
                      </>
                    ) : orders?.customer?.name ? (
                      <>
                        {orders.customer.name}
                        {orders?.customer?.phone
                          ? ` / ${orders.customer.phone}`
                          : ""}
                      </>
                    ) : (
                      <>No customer info</>
                    )}
                  </div>

                  {/* <div className="text-muted-foreground">Service</div>
                  <div className="text-right">KG</div> */}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </>
  );
};

export default Invoice;
