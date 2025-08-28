const crypto = require("crypto");

const generateCacheKey = (storeId, mainKey, queryParams) => {
  const filteredParams = {
    page: queryParams.page || 1,
    limit: queryParams.limit || 10,
    categories: queryParams.categories,
    search: queryParams.search,
    sortBy: queryParams.sortBy,
    sortDirection: queryParams.sortDirection,
  };

  const hash = crypto
    .createHash("md5")
    .update(JSON.stringify(filteredParams))
    .digest("hex");

  return `${mainKey}:store${storeId}:${hash}`;
};

module.exports = generateCacheKey;
