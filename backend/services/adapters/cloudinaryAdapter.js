const cloudinaryClient = require("../../config/cloudinary");
const streamifier = require("streamifier");
const generateImageUrls = require("../../helpers/generateImgUrls");
const Product = require("../../models/Product");

const uploadImages = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ msg: "Photo is required" });
  }
  const storeId = req.params.storeId || req.storeId;
  console.log("storeId",storeId);
  try {
    // const storeId = req.params.storeId || req.storeId;
    const folder = `${storeId}-${req.query.type || "products"}`;

    // Upload all in parallel instead of sequentially
    const uploadPromises = req.files.map((file) => {
      const buffer = file.buffer;
      // If you want compression, uncomment:
      // const buffer = await sharp(file.buffer).webp({ quality: 70 }).toBuffer();

      return new Promise((resolve, reject) => {
        const uploadStream = cloudinaryClient.uploader.upload_stream(
          { folder, resource_type: "image", format: "webp" },
          (error, result) => (error ? reject(error) : resolve(result))
        );
        streamifier.createReadStream(buffer).pipe(uploadStream);
      });
    });

    const results = await Promise.all(uploadPromises);

    req.randomImageNames = results.map((uploadResult) => ({
      public_id: uploadResult.public_id,
      url: uploadResult.secure_url,
    }));

    next();
  } catch (error) {
    console.error("Image upload error:", error);
    return res.status(500).json({ msg: "Image upload failed" });
  }
};

const duplicateImages = async (originalPublicIds) => {
  const uploadPromises = originalPublicIds.map(async (originalPublicId) => {
    const newPublicId = `${originalPublicId}_copy_${Date.now()}`;

    // Use explicit with 'public_id' to duplicate faster
    const result = await cloudinaryClient.uploader.rename(
      originalPublicId,
      newPublicId,
      { overwrite: false } // keeps original, makes a new copy
    );

    return result.public_id;
  });

  return Promise.all(uploadPromises);
};

const extractFilename = (url) => {
  try {
    return url
      .split("?")[0]
      .split("/v1/")[1]
      .replace(/\.[^/.]+$/, "");
  } catch (error) {
    console.error("Error extracting filename:", error);
    return null;
  }
};

const updateImages = async (id, deletedImages, images) => {
  console.log("deletedImages", deletedImages);
  if (!Array.isArray(deletedImages)) {
    deletedImages = [deletedImages];
  }

  const formattedDeletedImages = (deletedImages || [])
    .map(extractFilename)
    .filter(Boolean);

  const formattedImages = (images || []).map(extractFilename).filter(Boolean);

  // Delete images from Cloudinary in parallel
  await Promise.all(
    formattedDeletedImages.map((publicId) =>
      cloudinaryClient.uploader.destroy(publicId, { resource_type: "image" })
    )
  );

  const updateFields = {
    photo: formattedImages || [],
    imgUrls: generateImageUrls(formattedImages),
  };

  const updatedProduct = await Product.findByIdAndUpdate(id, updateFields, {
    new: true,
  });
  return updatedProduct;
};

const getImageUrls = (product) => {
  const plainProduct = product.toObject ? product.toObject() : product;

  const images = plainProduct.photos || plainProduct.photo;
  if (!images || !images.length) return plainProduct;
  return {
    ...plainProduct,
    imgUrls: generateImageUrls(images),
  };
};

const removeImages = async (deletedImages) => {
  console.log("deletedImages", deletedImages);
  if (!Array.isArray(deletedImages)) {
    deletedImages = [deletedImages];
  }

  // Delete images from Cloudinary in parallel
  await Promise.all(
    deletedImages.map((publicId) =>
      cloudinaryClient.uploader.destroy(publicId, { resource_type: "image" })
    )
  );
};

module.exports = {
  getImageUrls,
  uploadImages,
  duplicateImages,
  updateImages,
  removeImages,
};
