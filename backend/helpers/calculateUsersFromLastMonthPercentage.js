const User = require("../models/User");

const getUsersFromLastMonthCount = async () => {
  const currentDate = new Date();
  const firstDayOfCurrentMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );
  const firstDayOfLastMonth = new Date(firstDayOfCurrentMonth);
  firstDayOfLastMonth.setMonth(firstDayOfLastMonth.getMonth() - 1);
  const lastDayOfLastMonth = new Date(firstDayOfCurrentMonth);

  const usersLastMonthCount = await User.countDocuments({
    createdAt: { $gte: firstDayOfLastMonth, $lt: lastDayOfLastMonth },
  });
  return usersLastMonthCount;
};
const getTotalUsersCount = async () => {
  const totalUsersCount = await User.countDocuments();
  return totalUsersCount;
};
const calculateUsersFromLastMonthPercentage = async () => {
  const usersLastMonthCount = await getUsersFromLastMonthCount();
  const totalUsersCount = await getTotalUsersCount();

  const percentage = (usersLastMonthCount / totalUsersCount) * 100;
  return percentage;
};

module.exports = calculateUsersFromLastMonthPercentage;
