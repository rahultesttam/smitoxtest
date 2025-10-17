import productForYouModel from "../models/productForYouModel.js";
import productModel from "../models/productModel.js";
import productForYou from "../models/productForYouModel.js";
import subcategoryModel from "../models/subcategoryModel.js";
import mongoose from 'mongoose';

export const adminGetProductsForYouController = async (req, res) => {
  try {
    // Fetch all products-for-you, populating necessary fields
    const products = await productForYouModel
      .find({})
      .populate("categoryId", "name")
      .populate("subcategoryId", "name")
      .populate("productId", "name photos price slug perPiecePrice")
      .select("categoryId subcategoryId productId")
      .sort({ createdAt: -1 });

    let productsWithBase64Photos = products.map((productForYou) => {
      const productObj = productForYou.toObject();

      if (
        productObj.productId &&
        productObj.productId.photos &&
        productObj.productId.photos.data
      ) {
        productObj.productId.photoUrl = `data:${productObj.productId.photos.contentType};base64,${productObj.productId.photos.data.toString(
          "base64"
        )}`;
        delete productObj.productId.photos;
      }

      return productObj;
    });

    res.status(200).send({
      success: true,
      message: "Admin products fetched successfully",
      banners: productsWithBase64Photos,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error in fetching admin products for you",
      error: error.message,
    });
  }
};

export const getProductsForYouController = async (req, res) => {
  try {
    const { categoryId, subcategoryId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(categoryId) ||
      !mongoose.Types.ObjectId.isValid(subcategoryId)
    ) {
      return res
        .status(400)
        .send({ success: false, message: "Invalid category or subcategory ID" });
    }

    const products = await productForYouModel
      .find({})
      .populate("categoryId", "name")
      .populate("subcategoryId", "name")
      .populate("productId", "name photos price slug perPiecePrice")
      .select("categoryId subcategoryId productId")
      .sort({ createdAt: -1 });

    let productsWithBase64Photos = products.map((productForYou) => {
      const productObj = productForYou.toObject();

      if (
        productObj.productId &&
        productObj.productId.photos &&
        productObj.productId.photos.data
      ) {
        productObj.productId.photoUrl = `data:${productObj.productId.photos.contentType};base64,${productObj.productId.photos.data.toString(
          "base64"
        )}`;
        delete productObj.productId.photos;
      }

      return productObj;
    });

    // Shuffle the products array
    productsWithBase64Photos = productsWithBase64Photos.sort(() => Math.random() - 0.5);

    res.status(200).send({
      success: true,
      message: "Products fetched successfully",
      products: productsWithBase64Photos,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error in fetching products for you",
      error: error.message,
    });
  }
};

export const getAllProductsForYouController = async (req, res) => {
  try {
    const products = await productForYouModel.find()
      .populate("categoryId", "name")
      .populate("subcategoryId", "name")
      .populate("productId", "name photos price slug perPiecePrice custom_order")
      .select("categoryId subcategoryId productId")
      .sort({ "productId.custom_order": 1, createdAt: -1 });

    const productsWithBase64Photos = products.map((productForYou) => {
      const productObj = productForYou.toObject();

      if (
        productObj.productId &&
        productObj.productId.photos &&
        productObj.productId.photos.data
      ) {
        productObj.productId.photoUrl = `data:${
          productObj.productId.photos.contentType
        };base64,${productObj.productId.photos.data.toString("base64")}`;
        delete productObj.productId.photos;
      }

      return productObj;
    });

    res.status(200).send({
      success: true,
      message: "Products for you fetched successfully",
      products: productsWithBase64Photos,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error in fetching products for you",
      error: error.message,
    });
  }
};

export const singleProductController = async (req, res) => {
  try {
    const banner = await bannerModel
      .findOne({ _id: req.params.id })
      .select("-photos")
      .populate("category")
      .populate("subcategory");
    res.status(200).send({
      success: true,
      message: "Single Banner Fetched",
      banner,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting single banner",
      error,
    });
  }
};

export const createProductForYouController = async (req, res) => {
  try {
    const { categoryId, subcategoryId, productId } = req.fields;

    if (!categoryId) return res.status(400).send({ error: "Category is required" });
    if (!subcategoryId) return res.status(400).send({ error: "Subcategory is required" });
    if (!productId) return res.status(400).send({ error: "Product is required" });

    const productForYouData = {
      categoryId,
      subcategoryId,
      productId
    };

    const banner = await new productForYouModel(productForYouData).save();

    res.status(201).send({
      success: true,
      message: "Banner created successfully",
      banner,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      error: error.message,
      message: "Error in creating banner",
    });
  }
};

export const updateBannerController = async (req, res) => {
  try {
    const { categoryId, subcategoryId, productId } = req.fields;
    const { id } = req.params;

    if (!categoryId) return res.status(400).send({ error: "Category is required" });
    if (!subcategoryId) return res.status(400).send({ error: "Subcategory is required" });
    if (!productId) return res.status(400).send({ error: "Product is required" });

    const banner = await productForYouModel.findByIdAndUpdate(
      id,
      { categoryId, subcategoryId, productId },
      { new: true }
    );

    res.status(200).send({
      success: true,
      message: "Banner updated successfully",
      banner,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error in updating banner",
    });
  }
};
export const getBannersController = async (req, res) => {
  try {
    // Build base query
    const query = {};

    // Apply isActive filter if provided
    // Example: GET /api/banners?filter=active
    if (req.query.filter && req.query.filter !== "all") {
      switch (req.query.filter) {
        case "active":
          query.isActive = "1";
          break;
        case "inactive":
          query.isActive = "0";
          break;
        default:
          // if you need other filter types, handle them here
          break;
      }
    }

    // (Optional) Filter by categoryId or subcategoryId if passed as query params
    // Example: GET /api/banners?categoryId=…&subcategoryId=…
    if (req.query.categoryId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.categoryId)) {
        return res.status(400).send({
          success: false,
          message: "Invalid categoryId",
        });
      }
      query.categoryId = req.query.categoryId;
    }

    if (req.query.subcategoryId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.subcategoryId)) {
        return res.status(400).send({
          success: false,
          message: "Invalid subcategoryId",
        });
      }
      query.subcategoryId = req.query.subcategoryId;
    }

    // Fetch banners with population, selection, and sorting
    const banners = await productForYouModel
      .find(query)
      .populate("categoryId", "name")
      .populate("subcategoryId", "name")
      .populate("productId", "name photos perPiecePrice price slug")
      .select("categoryId subcategoryId productId isActive")
      .sort({ createdAt: -1 });

    // Get all unique category IDs from the banners
    const categoryIds = [...new Set(banners
      .filter(banner => banner.categoryId)
      .map(banner => banner.categoryId._id.toString()))];

    // Fetch all subcategories related to these categories
    const subcategoriesByCategory = {};
    
    if (categoryIds.length > 0) {
      // Use the imported subcategoryModel to fetch data
      
      // Fetch subcategories for all categories in one query
      const relatedSubcategories = await subcategoryModel.find({
        category: { $in: categoryIds }
      }).select('name category');
      
      // Organize subcategories by category
      for (const subcategory of relatedSubcategories) {
        const categoryId = subcategory.category.toString();
        if (!subcategoriesByCategory[categoryId]) {
          subcategoriesByCategory[categoryId] = [];
        }
        subcategoriesByCategory[categoryId].push({
          _id: subcategory._id,
          name: subcategory.name
        });
      }
    }

    // Shuffle the banners array for random display
    const shuffledBanners = [...banners].sort(() => Math.random() - 0.5);

    res.status(200).send({
      success: true,
      countTotal: shuffledBanners.length,
      message: "Filtered Banners",
      banners: shuffledBanners,
      categorySubcategories: subcategoriesByCategory
    });
  } catch (error) {
    console.error("Error in getting banners:", error);
    res.status(500).send({
      success: false,
      message: "Error in getting banners",
      error: error.message,
    });
  }
};

export const deleteProductController = async (req, res) => {
  try {
    await productForYouModel.findByIdAndDelete(req.params.id);
    res.status(200).send({
      success: true,
      message: "Banner Deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while deleting banner",
      error,
    });
  }
};

export const getProductPhoto = async (req, res) => {
  try {
    const product = await productModel.findById(req.params.pid).select("photos");
    if (product.photos.data) {
      res.set("Content-type", product.photos.contentType);
      return res.status(200).send(product.photos.data);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting photos",
      error,
    });
  }
};