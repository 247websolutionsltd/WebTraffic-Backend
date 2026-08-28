const Listing = require("../models/Listing");
const uploadToCloudinary = require("../utils/uploadToCloudinary");
const Category = require("../models/Category");

const createListing = async (req, res) => {
  try {
    console.log("=================================");
    console.log("CREATE LISTING REQUEST");
    console.log("USER:", req.user);
    console.log("BODY:", req.body);
    console.log("FILES:", req.files?.length || 0);
    console.log("=================================");

    const {
      title,
      description,
      price,
      category,
      quantity,
      condition,
      city,
      state,
      country,
      store
    } = req.body;

    // const listing = await Listing.create({
    //   seller: req.user.id,
    //   title,
    //   description,
    //   price,
    //   category,
    //   images:imageUrls,
    //   quantity,
    //   condition,
    //   location,
    // });

    if (!title || !title.trim()) {
      return res.status(400).json({
        message: "Title is required",
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        message: "Description is required",
      });
    }

    if (!category) {
      return res.status(400).json({
        message: "Category is required",
      });
    }

    if (!price) {
      return res.status(400).json({
        message: "Price is required",
      });
    }

    if (!condition) {
      return res.status(400).json({
        message: "Condition is required",
      });
    }
    
    const categoryExists = await Category.findById(category);

    if (!categoryExists) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: "At least one image is required",
      });
    }

    if (req.files.length > 6) {
      return res.status(400).json({
        message: "You can upload a maximum of 6 images",
      });
    }

    console.log(
      `Uploading ${req.files.length} images to Cloudinary...`
    );

    const uploadedImages = await Promise.all(
      req.files.map((file) =>
        uploadToCloudinary(
          file,
          "webtraffic/listings"
        )
      )
    );

    // Get the Cloudinary URLs
    const imageUrls = uploadedImages.map(
      (image) => image.secure_url
    );

    console.log("Cloudinary images:");
    console.log(imageUrls);

    const listing = await Listing.create({
      title: title.trim(),

      description: description.trim(),

      price: Number(price),

      quantity: quantity
        ? Number(quantity)
        : 1,

      condition: condition.toLowerCase(),

      category: category,

      images: imageUrls,

      location: {
        city: city || "",
        state: state || "",
        country: country || "Nigeria",
      },

      seller: req.user.id,
      store: store || null,
    });

    console.log(
      "LISTING CREATED:",
      listing._id
    );

    return res.status(201).json({
      message: "Listing created successfully",

      listing,
    });

  } catch (error) {
     console.error(
      "CREATE LISTING ERROR:",
      error
    );

    return res.status(500).json({
      message: "Failed to create listing",
      error: error.message,
    });
  }
};

const getListings = async (req, res) => {
  try {
    const listings = await Listing.find({
      isActive: true,
    })
      .populate("category")
      .populate(
        "seller",
        "firstName lastName profileImage"
      )
      .sort({
        createdAt: -1,
      });

    res.json(listings);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch listings",
    });
  }
};

const getListing = async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await Listing.findById(id)
      .populate(
        "seller",
        "firstName lastName email phone profileImage timestamps"
      )
      .populate(
        "category",
        "name"
      )
      .populate(
        "store",
        "name profileImage description followers timestamps"
      );

    if (!listing) {
      return res.status(404).json({
        message: "Listing not found",
      });
    }

    return res.status(200).json({
      listing,
    });

  } catch (error) {
    console.error(
      "GET LISTING ERROR:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch listing",
    });
  }
};

const getSellerListings = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const listings = await Listing.find({
      seller: sellerId,
    })
      .populate("category", "name")
      .populate("store", "name profileImage")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: listings.length,
      listings,
    });

  } catch (error) {
    console.error(
      "GET SELLER LISTINGS ERROR:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch seller listings",
    });
  }
};

module.exports = {
  createListing,
  getListings,
  getListing,
  getSellerListings
};