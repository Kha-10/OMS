const crypto = require("crypto");

const generateCacheKey = (storeId, mainKey, queryParams) => {
  console.log("queryParams",queryParams);
  const filteredParams = {
    page: queryParams.page || 1,
    limit: queryParams.limit || 10,
    visibility: queryParams.visibility,
    categories: queryParams.categories,
    search: queryParams.search,
    sortBy: queryParams.sortBy,
    sortDirection: queryParams.sortDirection,
  };

  console.log("filteredParams",filteredParams);
  const hash = crypto
    .createHash("md5")
    .update(JSON.stringify(filteredParams))
    .digest("hex");

  return `${mainKey}:store${storeId}:${hash}`;
};

module.exports = generateCacheKey;
