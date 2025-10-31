const formatItems = (items) => {
  if (!items || items.length === 0) return "";

  return items
    .map((item) => {
      let itemStr = `${item.quantity}x ${item.productName}`;

      // Add variant if exists
      if (item.variantName) {
        itemStr += ` (${item.variantName})`;
      }

      // Add options if exists
      if (item.options && item.options.length > 0) {
        const optionsStr = item.options
          .map((opt) => {
            if (opt.answers && opt.answers.length > 0) {
              return `${opt.name}: ${opt.answers.join(", ")}`;
            }
            return null;
          })
          .filter(Boolean)
          .join("; ");

        if (optionsStr) {
          itemStr += ` [${optionsStr}]`;
        }
      }

      itemStr += ` - ${item.totalPrice} THB`;
      return itemStr;
    })
    .join(" | ");
};

module.exports = formatItems;
