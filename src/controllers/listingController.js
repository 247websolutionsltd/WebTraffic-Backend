const Listing = require("../models/Listing");

const createListing = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      category,
      images,
      quantity,
      condition,
      location,
    } = req.body;

    const listing = await Listing.create({
      seller: req.user.id,
      title,
      description,
      price,
      category,
      images,
      quantity,
      condition,
      location,
    });

    res.status(201).json(listing);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create listing",
    });
  }
};

const getListings = async (req, res) => {
  try {
    const listings = await Listing.find({
      isActive: true,
    })
      .populate("category", "name image")
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
    const listing = await Listing.findById(req.params.id)
      .populate("category")
      .populate(
        "seller",
        "firstName lastName profileImage"
      );

    if (!listing) {
      return res.status(404).json({
        message: "Listing not found",
      });
    }

    res.json(listing);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch listing",
    });
  }
};

module.exports = {
  createListing,
  getListings,
  getListing,
};