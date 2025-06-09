import { addDays, addMonths, parseISO } from "date-fns";

export const calculateUpdatedDates = (tenant, unit, duration, reason) => {
  const currentEndDate = parseISO(tenant.subscriptionEndDate);
  const currentGracePeriodEndDate = parseISO(tenant.gracePeriodEndDate);

  const newEndDate =
    unit === "months"
      ? addMonths(currentEndDate, duration)
      : addDays(currentEndDate, duration);

  const newGracePeriodEndDate =
    unit === "months"
      ? addMonths(currentGracePeriodEndDate, duration)
      : addDays(currentGracePeriodEndDate, duration);
  return {
    updatedTenant: {
      ...tenant,
      subscriptionEndDate: newEndDate.toISOString(),
      gracePeriodEndDate: newGracePeriodEndDate.toISOString(),
    },
    historyRecord: {
      action: "Extended",
      createdAt: new Date(),
      previousEndDate: tenant.subscriptionEndDate,
      newEndDate: newEndDate.toISOString(),
      gracePeriodEndDate: newGracePeriodEndDate.toISOString(),
      paymentMethod: tenant.paymentMethod,
      subscriptionPlan: tenant.subscriptionPlan,
      reason,
      subscriptionInfoID: tenant._id,
      tenantID: tenant.tenantID._id,
    },
  };
};
