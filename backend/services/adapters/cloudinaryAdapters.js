const sharp = require("sharp");
const crypto = require("crypto");
const cloudinaryClient = require("../../config/cloudinary");

const randomImageName = (bytes = 16) =>
  crypto.randomBytes(bytes).toString("hex");

const uploadImages = async (files) => {
  const uploadedImageUrls = [];

  for (const file of files) {
    if (!file.mimetype.startsWith("image"))
      throw new Error("All uploaded files must be images");

    const buffer = await sharp(file.buffer).webp({ quality: 70 }).toBuffer();

    const publicId = randomImageName();

    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinaryClient.uploader.upload_stream(
        { public_id: publicId, resource_type: "image", format: "webp" },
        (error, result) => (error ? reject(error) : resolve(result))
      );
      uploadStream.end(buffer);
    });

    uploadedImageUrls.push(uploadResult.public_id);
  }

  return uploadedImageUrls;
};

const duplicateImages = async (originalPublicIds) => {
  const uploadPromises = originalPublicIds.map(async (originalPublicId) => {
    const newPublicId = `${originalPublicId}_copy_${Date.now()}`;

    const url = cloudinaryClient.url(originalPublicId, { format: "webp" });

    const result = await cloudinaryClient.uploader.upload(url, {
      public_id: newPublicId,
      overwrite: true,
      resource_type: "image",
    });

    return result.public_id;
  });

  return Promise.all(uploadPromises);
};

const removeImage = async (publicId) => {
  await cloudinaryClient.uploader.destroy(publicId, { resource_type: "image" });
};

const getImageUrl = (publicId, options = {}) => {
  // options could include transformations
  return cloudinaryClient.url(publicId, { format: "webp", ...options });
};

module.exports = {
  uploadImages,
  duplicateImages,
  removeImage,
  getImageUrl,
};
