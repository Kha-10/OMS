function formatWithCurrency(amount, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

function buildItemsHtml(order, storeData) {
  if (!order.items || order.items.length === 0) {
    return "<tr><td colspan='2' style='padding:20px; text-align:center; color:#666;'>No items found</td></tr>";
  }

  return order.items
    .map((item) => {
      console.log("item", item);
      // Handle undefined values safely
      const itemName = item.productName;
      const itemImage = item.imgUrls[0]; // Don't use undefined images
      const itemPrice = parseFloat(item.totalPrice) || 0; // Ensure it's a number
      const itemQuantity = parseInt(item.quantity) || 1;

      const addonsHtml =
        item.options
          ?.map((option) => {
            const optionName = option.name || "Option";
            const answersHtml =
              option.answers
                ?.map((ans, idx) => {
                  const pricePart =
                    option.prices?.[idx] !== undefined &&
                    !isNaN(option.prices[idx])
                      ? ` ${formatWithCurrency(
                          option.prices[idx],
                          storeData.settings.currency
                        )}`
                      : "";
                  const qtyPart =
                    option.quantities?.[idx] !== undefined
                      ? ` x ${option.quantities[idx]}`
                      : "";
                  return `${ans}${pricePart}${qtyPart}`;
                })
                .join(", ") || "";

            return `<div style="font-size:12px; color:#666; margin-top:2px;">
                  ${optionName}: ${answersHtml}
                </div>`;
          })
          .join("") || "None";

      return `
        <tr>
          <td style="padding:10px; width:80%; border-bottom:1px solid #e0e0e0;">
            ${
              itemImage
                ? `<img src="${itemImage}" width="60" style="display:inline-block; margin-right:10px; vertical-align:top;" alt="Product" />`
                : ""
            }
            <div style="display:inline-block; vertical-align:top; font-size:14px; color:#333;">
              <strong>${itemName}</strong><br/>
              Qty: ${itemQuantity}<br/>
              Add-ons: ${addonsHtml}
            </div>
          </td>
          <td align="right" style="padding:10px; width:20%; border-bottom:1px solid #e0e0e0; font-size:14px; color:#333;">
            ${formatWithCurrency(itemPrice, storeData.settings.currency)}
          </td>
        </tr>
      `;
    })
    .join("");
}

const Mailjet = require("node-mailjet");

const mailjet = Mailjet.apiConnect(
  process.env.MJ_APIKEY_PUBLIC,
  process.env.MJ_APIKEY_PRIVATE
);

const sendOrderTemplateEmail = async (
  //   fromEmail,
  //   fromName,
  templateId,
  variables,
  toEmail,
  toName,
  subject = "Order Received"
) => {
  console.log("subject", subject);
  try {
    const request = await mailjet.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          //   From: { Email: "august810.a@gmail.com", Name: fromName },
          From: { Email: "august810.a@gmail.com", Name: "Nexora" },
          To: [{ Email: toEmail, Name: toName }],
          TemplateID: templateId,
          TemplateLanguage: true,
          Subject: subject,
          Variables: variables,
        },
      ],
    });
    return request.body;
  } catch (err) {
    console.error("Mailjet error:", err);
    throw err;
  }
};

module.exports = {
  formatWithCurrency,
  buildItemsHtml,
  sendOrderTemplateEmail,
};
