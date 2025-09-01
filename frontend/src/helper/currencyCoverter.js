export function formatWithCurrency(value, code, locale = "en") {
  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      currencyDisplay: "narrowSymbol", // always show compact symbol
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

    // Extract parts
    const parts = formatter.formatToParts(value);
    const numberPart = parts
      .filter((p) => p.type !== "currency")
      .map((p) => p.value)
      .join("");
    const symbolPart = parts.find((p) => p.type === "currency")?.value || code;

    return `${symbolPart}${numberPart}`; // always number + symbol
  } catch {
    return `${value} ${code}`;
  }
}
