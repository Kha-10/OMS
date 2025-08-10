const s3 = require("../config/aws");
const cloudFront = require("../config/cloudFront");
const crypto = require("crypto");
const { CreateInvalidationCommand } = require("@aws-sdk/client-cloudfront");
const {
  DeleteObjectCommand,
  CopyObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");

const awsRemove = async (photosToDelete) => {
  try {
    for (const photo of photosToDelete) {
      const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: photo,
      };

      const command = new DeleteObjectCommand(params);
      await s3.send(command);
    }
  } catch (error) {
    console.error("Error deleting object:", error);
    throw new Error(error);
  }
};

const extractFilename = (url) => {
  try {
    return url.split("/").pop().split("?")[0]; // Extract filename before query params
  } catch (error) {
    console.error("Error extracting filename:", error);
    return null;
  }
};

const invalidateCloudFrontCache = async (photoPaths) => {
  try {
    const invalidationParams = {
      DistributionId: process.env.CLOUDFRONT_DIST_ID,
      InvalidationBatch: {
        Paths: {
          Quantity: photoPaths.length,
          Items: photoPaths.map((path) => `/${path}`),
        },
        CallerReference: `${Date.now()}`,
      },
    };

    const invalidationCommand = new CreateInvalidationCommand(
      invalidationParams
    );
    const response = await cloudFront.send(invalidationCommand);
    console.log("CloudFront Invalidation Response:", response);
  } catch (error) {
    console.error("CloudFront Invalidation Error:", error);
  }
};

const randomImageName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

const duplicateImages = async (originalImages) => {
  try {
    const newImageNames = [];

    for (const originalKey of originalImages) {
      const newImageName = randomImageName();

      const copyParams = {
        Bucket: process.env.BUCKET_NAME,
        CopySource: `${process.env.BUCKET_NAME}/${originalKey}`,
        Key: newImageName,
      };

      await s3.send(new CopyObjectCommand(copyParams));
      newImageNames.push(newImageName);
    }

    return newImageNames;
  } catch (error) {
    console.error("Error duplicating images:", error);
    throw error;
  }
};

const getImageUrls = (product) => {
  if (product?.photo?.length > 0) {
    product.imgUrls = product.photo.map((image) =>
      getSignedUrl({
        url: `https://d1pgjvyfhid4er.cloudfront.net/${image}`,
        dateLessThan: new Date(Date.now() + 1000 * 60 * 60),
        privateKey: process.env.CLOUDFRONT_PRIVATE_KEY,
        keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
      })
    );
  }
  return product;
};

const uploadImages = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ msg: "Photo is required" });
  }

  try {
    req.randomImageNames = [];

    for (const file of req.files) {
      if (!file.mimetype.startsWith("image")) {
        return res
          .status(400)
          .json({ msg: "All uploaded files must be images" });
      }

      const buffer = await sharp(file.buffer).webp({ quality: 70 }).toBuffer();

      const imageName = randomImageName();
      req.randomImageNames.push(imageName);

      // Upload to S3
      const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: imageName,
        Body: buffer,
        ContentType: file.mimetype,
      };
      console.log("params", params);
      const command = new PutObjectCommand(params);
      await s3.send(command);
    }
    next();
  } catch (error) {
    console.error("Image upload error:", error);
    return res.status(500).json({ msg: "Image upload failed" });
  }
};

const updateImages = async (id, deletedImages, images) => {
  const formattedDeletedImages = (deletedImages || [])
    .map(extractFilename)
    .filter(Boolean);

  const formattedImages = (images || []).map(extractFilename).filter(Boolean);

  if (formattedDeletedImages.length > 0) {
    await awsRemove(formattedDeletedImages);
    await invalidateCloudFrontCache(formattedDeletedImages);
  }

  const updateFields = {
    ...updateData,
    ...(images && {
      photo: formattedImages,
      imgUrls: formattedImages.map(
        (filename) => `https://d1pgjvyfhid4er.cloudfront.net/${filename}`
      ),
    }),
  };

  const updatedProduct = await Product.findByIdAndUpdate(id, updateFields, {
    new: true,
  });
  return updatedProduct;
};

const removeImages = async (deletedImages) => {
  awsRemove(deletedImages);
  invalidateCloudFrontCache(deletedImages);
};

module.exports = {
  getImageUrls,
  uploadImages,
  updateImages,
  removeImages,
  duplicateImages,
};
