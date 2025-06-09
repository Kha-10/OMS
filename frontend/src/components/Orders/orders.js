// Generate 100 orders
export const orders = Array.from({ length: 100 }, (_, i) => {
  const id = 100 - i;
  const statuses= ['COMPLETED', 'PENDING', 'CONFIRMED', 'CANCELLED'];
  const paymentStatuses = ['PAID', 'UNPAID'];
  const fulfillmentStatuses = ['FULFILLED', 'UNFULFILLED'];
  
  const randomDate = new Date();
  randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 30));
  
  return {
    id: `#${id}`,
    customerName: ['kyaw', 'k', 'john', 'jane', 'alex'][Math.floor(Math.random() * 5)],
    amount: Math.floor(Math.random() * 1000000),
    status: statuses[Math.floor(Math.random() * statuses.length)],
    paymentStatus: paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)],
    fulfillmentStatus: fulfillmentStatuses[Math.floor(Math.random() * fulfillmentStatuses.length)],
    date: randomDate.toLocaleString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  };
});