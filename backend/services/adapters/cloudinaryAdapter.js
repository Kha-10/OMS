const cloudinaryClient = require("../../config/cloudinary");
const streamifier = require("streamifier");
const generateImageUrls = require("../../helpers/generateImgUrls");
const Product = require("../../models/Product");

const uploadImages = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ msg: "Photo is required" });
  }

  try {
    req.randomImageNames = [];

    for (const file of req.files) {
      const buffer = file.buffer;
      // Optional: compress with sharp before uploading
      // const buffer = await sharp(file.buffer).webp({ quality: 70 }).toBuffer();

      const folder = "products";

      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinaryClient.uploader.upload_stream(
          { folder, resource_type: "image", format: "webp" },
          (error, result) => (error ? reject(error) : resolve(result))
        );
        streamifier.createReadStream(buffer).pipe(uploadStream);
      });

      req.randomImageNames.push({
        public_id: uploadResult.public_id,
        url: uploadResult.secure_url,
      });
    }

    next();
  } catch (error) {
    console.error("Image upload error:", error);
    return res.status(500).json({ msg: "Image upload failed" });
  }
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
  console.log("plainProduct", plainProduct);
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
