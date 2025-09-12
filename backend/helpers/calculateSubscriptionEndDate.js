const calculateSubscriptionEndDate = (subscriptionType) => {
  const currentDate = new Date();
  let monthsToAdd;

  switch (subscriptionType) {
    case "Monthly":
      monthsToAdd = 1;
      break;
    case "Quarterly":
      monthsToAdd = 3;
      break;
    case "Semi-annual":
      monthsToAdd = 6;
      break;
    case "Annually":
      monthsToAdd = 12;
      break;
    default:
      throw new Error("Invalid subscription type");
  }

  // Add the appropriate number of months to the current date
  const endDate = new Date(
    currentDate.setMonth(currentDate.getMonth() + monthsToAdd)
  );

  let status;
  let subscriptionEndDate;
  if (subscriptionType) {
    const now = new Date();
    subscriptionEndDate = new Date(endDate);
    const sevenDaysBeforeEndDate = new Date(subscriptionEndDate);
    sevenDaysBeforeEndDate.setDate(sevenDaysBeforeEndDate.getDate() - 7);

    if (now >= subscriptionEndDate) {
      status = "expired";
    } else if (now >= sevenDaysBeforeEndDate && now < subscriptionEndDate) {
      status = "expiring";
    } else {
      status = "active";
    }
  }
  let gracePeriodEndDate = new Date(subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 7));

  return { endDate, status, gracePeriodEndDate };
};

module.exports = calculateSubscriptionEndDate;
