const calculateCartItemPrice = (basePrice, options = [], quantity = 1) => {
  let optionTotal = 0;

  for (const option of options) {
    const { prices = [], quantities = [] } = option;

    for (let i = 0; i < prices.length; i++) {
      const price = prices[i] || 0;
      const qty = quantities[i] || 0;
      optionTotal += price * qty;
    }
  }

  return (basePrice + optionTotal) * quantity;
};

module.exports = calculateCartItemPrice;
