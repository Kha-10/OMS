const cloudinaryClient = require("../config/cloudinary");

const generateImageUrls = (publicIds, options = {}) => {
  if (!Array.isArray(publicIds)) {
    publicIds = [publicIds];
  }
  return publicIds.map((publicId) =>
    cloudinaryClient.url(publicId, {
      format: "webp",
      folder: "products",
      ...options,
    })
  );
};

module.exports = generateImageUrls;
