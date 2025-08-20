const generateCacheKey = (storeId, mainKey, queryParams) => {
  let key = `${mainKey}:store${storeId}:page${queryParams.page || 1}:limit${
    queryParams.limit || 10
  }`;
  return key;
};
module.exports = generateCacheKey;
