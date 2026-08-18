const Category = require("../models/Category");

const createCategory = async (req, res) => {
  try {
    const { name, description, image } = req.body;

    const category = await Category.create({
      name,
      description,
      image,
    });

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({
      message: "Failed to create category",
    });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({
      isActive: true,
    }).sort({
      createdAt: -1,
    });

    res.json(categories);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch categories",
    });
  }
};

module.exports = {
  createCategory,
  getCategories,
};