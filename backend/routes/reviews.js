const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const Product = require("../models/Product");
const Review = require("../models/Review");
const auth = require("../middleware/auth");
const cloudinary = require("../config/cloudinary");

const router = express.Router();
const maxReviewImages = 5;
const allowedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const reviewImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: maxReviewImages,
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    if (!allowedImageTypes.has(file.mimetype)) {
      callback(new Error("Review images must be JPG, PNG, WEBP, or AVIF."));
      return;
    }

    callback(null, true);
  },
});

const parseReviewImages = (req, res, next) => {
  reviewImageUpload.array("images", maxReviewImages)(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "Each review image must be 5 MB or smaller."
        : error.code === "LIMIT_FILE_COUNT"
          ? `You can attach up to ${maxReviewImages} images.`
          : error.message;
    res.status(400).json({ message });
  });
};

const uploadReviewImage = (file) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "ecommerce_reviews",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      },
    );

    stream.end(file.buffer);
  });

const removeUploadedImages = async (images) => {
  await Promise.all(
    images.map(async ({ publicId }) => {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.error("Failed to clean up uploaded review image:", error);
      }
    }),
  );
};

router.get("/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const sortBy = req.query.sort || "newest";
    const sortOptions = {
      newest: { createdAt: -1 },
      highest: { rating: -1, createdAt: -1 },
      lowest: { rating: 1, createdAt: -1 },
    };
    if (!Object.hasOwn(sortOptions, sortBy)) {
      return res.status(400).json({ message: "Invalid review sort option" });
    }

    const query = { product: productId, isApproved: true };
    if (req.query.rating !== undefined) {
      const rating = Number(req.query.rating);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res
          .status(400)
          .json({ message: "Rating filter must be from 1 to 5" });
      }
      query.rating = rating;
    }

    const reviews = await Review.find(query)
      .populate("user", "name")
      .sort(sortOptions[sortBy]);

    return res.json(reviews);
  } catch (error) {
    console.error("Get reviews error:", error);
    return res.status(500).json({ message: "Failed to fetch reviews" });
  }
});

router.post("/", auth, parseReviewImages, async (req, res) => {
  const uploadedImages = [];

  try {
    const { productId, comment } = req.body;
    const rating = Number(req.body.rating);
    const normalizedComment = typeof comment === "string" ? comment.trim() : "";

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "A valid product ID is required" });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be a whole number from 1 to 5" });
    }
    if (!normalizedComment || normalizedComment.length > 2000) {
      return res
        .status(400)
        .json({ message: "Comment is required and must be 2000 characters or fewer" });
    }

    const productExists = await Product.exists({ _id: productId });
    if (!productExists) {
      return res.status(404).json({ message: "Product not found" });
    }

    for (const file of req.files || []) {
      uploadedImages.push(await uploadReviewImage(file));
    }

    const review = await Review.create({
      user: req.userId,
      product: productId,
      rating,
      comment: normalizedComment,
      images: uploadedImages,
    });

    await review.populate("user", "name");
    return res.status(201).json(review);
  } catch (error) {
    await removeUploadedImages(uploadedImages);
    console.error("Create review error:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Failed to create review" });
  }
});

module.exports = router;
