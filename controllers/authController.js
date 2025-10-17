import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";
import productModel from "../models/productModel.js";
import { comparePassword, hashPassword } from "./../helpers/authHelper.js";
import JWT from "jsonwebtoken";
import axios from "axios";
import Pincode from '../models/pincodeModel.js';
import mongoose from 'mongoose';
// send OTP
export const sendOTPController = async (req, res) => {
  try {
    let { phoneNumber } = req.body;

    // Convert phoneNumber to an integer
    phoneNumber = parseInt(phoneNumber, 10);

    const API_KEY = process.env.TWO_FACTOR_API_KEY;

    if (!API_KEY) {
      throw new Error('TWO_FACTOR_API_KEY is not defined in the environment variables');
    }

    const response = await axios.get(`https://2factor.in/API/V1/${API_KEY}/SMS/${phoneNumber}/AUTOGEN/OTP%20For%20Verification`);

    if (response.data.Status === "Success") {
      res.status(200).json({
        success: true,
        message: "SMS OTP sent successfully",
        sessionId: response.data.Details,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Failed to send SMS OTP",
      });
    }
  } catch (error) {
    console.error('Error in sendOTPController:', error.message);
    res.status(500).json({
      success: false,
      message: "Error in sending SMS OTP",
      error: error.message,
    });
  }
};

// verify OTP and login
export const verifyOTPAndLoginController = async (req, res) => {
  try {
    const { sessionId, otp, phoneNumber } = req.body;
    const API_KEY = process.env.TWO_FACTOR_API_KEY;

    if (!phoneNumber || typeof phoneNumber !== 'string' || phoneNumber.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number",
      });
    }

    if (!API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'TWO_FACTOR_API_KEY is not defined in the environment variables',
      });
    }

    const verifyResponse = await axios.get(`https://2factor.in/API/V1/${API_KEY}/SMS/VERIFY/${sessionId}/${otp}`);

    if (verifyResponse.data.Status === "Success") {
      const mobile_no = phoneNumber.trim();

      const user = await userModel.findOne({ mobile_no });
      if (!user) {
        // Instead of showing an error, just inform the client that the user is new
        return res.status(200).json({
          success: true,
          message: "User does not exist, please register",
          isNewUser: true, // Added this flag to indicate a new user
        });
      }

      // Generate access token with 10-second expiration (for testing)
      const token = JWT.sign({ _id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "365d", // 10 seconds
      });
      
      // Generate refresh token with 1-year expiration (for testing)
      const refreshToken = JWT.sign({ _id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "365d", // 1 year
      });

      return res.status(200).json({
        success: true,
        message: "Login successful",
        user: {
          _id: user._id,
          user_fullname: user.user_fullname,
          email_id: user.email_id,
          mobile_no: user.mobile_no,
          address: user.address,
          role: user.role,
          pincode: user.pincode,
          city:user.city,
          landmark:user.landmark,
          state:user.state,
          status: user.status,
          order_type: user.order_type, // return order_type as part of the user profile
          wishlist: user.wishlist,
          cart: user.cart,
        },
        token,
        refreshToken,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }
  } catch (error) {
    console.error('Error in verifyOTPAndLoginController:', error.message);
    return res.status(500).json({
      success: false,
      message: "Error in login",
      error: error.message,
    });
  }
};


// Register user
export const registerController = async (req, res) => {
  const { 
    user_fullname, 
    email_id, 
    mobile_no, 
    address,
    pincode,
    city,
    landmark, 
    state
  } = req.body;
 
  try {
    // Check if user already exists
    const existingUser = await userModel.findOne({ 
      $or: [{ email_id }, { mobile_no }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: existingUser.email_id === email_id 
          ? "Email already exists" 
          : "Mobile number already exists" 
      });
    }
 
    // Validations
    if (!user_fullname) {
      return res.status(400).send({ error: "Name is Required" });
    }
    if (!email_id) {
      return res.status(400).send({ message: "Email is Required" });
    }
    if (!mobile_no) {
      return res.status(400).send({ message: "Phone no is Required" });
    }
    if (!address) {
      return res.status(400).send({ message: "Address is Required" });
    }
    if (!pincode) {
      return res.status(400).send({ message: "PIN Code is Required" });
    }
    if (!city) {
      return res.status(400).send({ message: "City is Required" }); 
    }
    if (!state) {
      return res.status(400).send({ message: "State is Required" });
    }
 
    // Check pincode and create if necessary
    let existingPincode = await Pincode.findOne({ code: pincode });
    if (!existingPincode) {
      existingPincode = await new Pincode({ 
        code: pincode,
        isAvailable: true,
        city,
        state,
        landmark 
      }).save();
    }
 
    // Create new user
    const newUser = new userModel({
      user_fullname,
      email_id,
      mobile_no,
      address,
      pincode,
      city,
      landmark,
      state,
      role: 0, // Default role for new users
    });
 
    // Save the new user
    await newUser.save();
 
    // Generate access token with 1-hour expiration
    const token = JWT.sign({ _id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "365d", // 1 hour
    });

    // Generate refresh token with 1-year expiration
    const refreshToken = JWT.sign({ _id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "365d", // 1 year
    });
 
    // Send success response with user details, token and refresh token
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        _id: newUser._id,
        user_fullname: newUser.user_fullname,
        email_id: newUser.email_id,
        mobile_no: newUser.mobile_no,
        address: newUser.address,
        pincode: newUser.pincode,
        city: newUser.city,
        landmark: newUser.landmark,
        state: newUser.state
      },
      token,
      refreshToken,
    });
 
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Registration failed. Try again later.", 
      error: error.message
    });
  }
 };

// Login with email_id and password
export const loginController = async (req, res) => {
  try {
    const { email_id, password } = req.body;

    // Validate input fields
    if (!email_id || !password) {
      return res.status(400).send({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user by email
    const user = await userModel.findOne({ email_id }).maxTimeMS(5000);

    if (!user) {
      return res.status(404).send({
        success: false,
        message: "Email is not registered",
      });
    }

    if (!user.password) {
      return res.status(400).send({
        success: false,
        message: "Password not set for this account",
      });
    }

    // Direct password check
    if (password !== user.password) {
      return res.status(401).send({
        success: false,
        message: "Invalid Password",
      });
    }

    // Generate access token with 1-hour expiration
    const token = JWT.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "365", // 1 hour
    });
    
    // Generate refresh token with 1-year expiration
    const refreshToken = JWT.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "365d", // 1 year
    });

    // Return user details with token and refresh token
    res.status(200).send({
      success: true,
      message: "Login successful",
      token,
      refreshToken,
      user: {
        _id: user._id,
        user_fullname: user.user_fullname,
        email_id: user.email_id,
        mobile_no: user.mobile_no,
        address: user.address,
        role: user.role,
        pincode: user.pincode,
        order_type: user.order_type,
      },
    });
  } catch (error) {
    console.error('Login error:', error);

    res.status(500).send({
      success: false,
      message: "Error in login",
      error: error.message,
    });
  }
};



// Forgot Password
export const forgotPasswordController = async (req, res) => {
  try {
    const { email_id, answer, newPassword } = req.body;

    if (!email_id) {
      res.status(400).send({ message: "Email is required" });
    }
    if (!answer) {
      res.status(400).send({ message: "Answer is required" });
    }
    if (!newPassword) {
      res.status(400).send({ message: "New Password is required" });
    }

    const user = await userModel.findOne({ email_id, answer });
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "Wrong Email Or Answer",
      });
    }

    const hashed = await hashPassword(newPassword);
    await userModel.findByIdAndUpdate(user._id, { password: hashed });

    res.status(200).send({
      success: true,
      message: "Password Reset Successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Something went wrong",
      error,
    });
  }
};

// Update Profile
export const updateProfileController = async (req, res) => {
  try {
    const { user_fullname, email_id, password, address, phone, pincode,state,city,landmark } = req.body; // Include pincode
    const user = await userModel.findById(req.user._id);

    if (password && password.length < 6) {
      return res.json({ error: "Password is required and should be 6 characters long" });
    }

    const hashedPassword = password ? await hashPassword(password) : undefined;

    const updatedUser = await userModel.findByIdAndUpdate(
      req.user._id,
      {
        user_fullname: user_fullname || user.user_fullname,
        password: hashedPassword || user.password,
        phone: phone || user.phone,
        address: address || user.address,
        city:city||user.city,
        state:state||user.state,
        landmark:landmark||user.landmark,

        pincode: pincode || user.pincode, // Update pincode
      },
      { new: true }
    );

    res.status(200).send({
      success: true,
      message: "Profile Updated Successfully",
      updatedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(400).send({
      success: false,
      message: "Error While Updating Profile",
      error,
    });
  }
};

export const getOrdersController = async (req, res) => {
  try {
    // Get user_id from route params
    const { user_id } = req.params;

    // Fetch orders based on the user_id passed in the route
    const orders = await orderModel
      .find({ buyer: user_id })
      .populate("buyer", "user_fullname address mobile_no pincode ,city,state,landmark") // Use the user_id directly
      .populate({
        path: "products.product",
        select: "name photos price  sku"
        // Populate all fields in Product schema
      }); // Include only `user_fullname` for the buyer

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error While Getting Orders",
      error,
    });
  }
};
// export const getOrdersController = async (req, res) => {
//   try {
//     const { search } = req.query;

//     // Build search query with more flexible matching
//     const searchQuery = search ? {
//       $or: [
//         { _id: search }, // Exact match for order ID
//         { 'buyer.user_fullname': { $regex: `^${search}`, $options: 'i' } }, // Starts with search term
//         { 
//           'buyer.mobile_no': search.length > 0 
//             ? { 
//                 $expr: { 
//                   $regexMatch: { 
//                     input: { $toString: "$buyer.mobile_no" }, 
//                     regex: search 
//                   } 
//                 } 
//               }
//             : {} 
//         }, // Partial match for mobile number
//         { 'payment.transactionId': { $regex: `^${search}`, $options: 'i' } }
//       ]
//     } : {};

//     const orders = await orderModel
//       .find(searchQuery)
//       .populate("buyer", "user_fullname address mobile_no pincode")
//       .populate({
//         path: "products.product",
//         select: "name photos price sku"
//       });

//     res.json(orders);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send({
//       success: false,
//       message: "Error While Getting Orders",
//       error,
//     });
//   }
// };
export const getAllOrdersController = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, search = "" } = req.query;
    const pageNumber = Math.max(1, parseInt(page, 10)) || 1;
    const limitNumber = Math.max(1, parseInt(limit, 10)) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    let query = {};
    if (status && status !== "all-orders") {
      query.status = status;
    }

    const userSearchQuery = search
      ? {
          $or: [
            { user_fullname: { $regex: search, $options: "i" } },
            // Search mobile_no with regex for partial matches
            { mobile_no: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    let matchingUserIds = [];
    if (search) {
      const matchingUsers = await mongoose.model("User").find(userSearchQuery).select("_id");
      matchingUserIds = matchingUsers.map((user) => user._id);

      // Build search conditions
      const searchConditions = [
        // Order ID search (if valid ObjectId)
        ...(mongoose.Types.ObjectId.isValid(search) ? [{ _id: new mongoose.Types.ObjectId(search) }] : []),
        
        // User-related searches
        ...(matchingUserIds.length > 0 ? [{ buyer: { $in: matchingUserIds } }] : []),
        
        // Direct user info search (in case populate is not working)
        { "buyerInfo.mobile_no": { $regex: search, $options: "i" } },
        { "buyerInfo.user_fullname": { $regex: search, $options: "i" } },
        
        // Tracking and payment info
        { "tracking.id": { $regex: search, $options: "i" } },
        { "tracking.company": { $regex: search, $options: "i" } },
        { "payment.transactionId": { $regex: search, $options: "i" } },
        
        // Search in order items
        { "products.name": { $regex: search, $options: "i" } },
        { "products.sku": { $regex: search, $options: "i" } }
      ];
      
      // Only add $or if we have search conditions
      if (searchConditions.length > 0) {
        query.$or = searchConditions;
      }
    }

    const total = await orderModel.countDocuments(query);

    const orders = await orderModel
      .find(query)
      .populate({
        path: "buyer",
        select: "user_fullname email_id mobile_no address city state landmark pincode gst amount",
      })
      .populate({
        path: "products.product",
        select: "name photos gst price unitSet bulkProducts perPiecePrice mrp stock isActive",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    res.json({
      success: true,
      total,
      orders,
    });
  } catch (error) {
    console.error("Error in getAllOrdersController:", error);
    res.status(500).json({
      success: false,
      message: "Error while fetching orders",
      error: error.message,
    });
  }
};

export const addProductToOrderController = async (req, res) => {
  try {
    const { orderId } = req.params
    const { productId, quantity, price } = req.body;

    // Validate input parameters
    if (!orderId || !productId || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format"
      });
    }

    // Find the existing order
    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Find the product with necessary fields
    const product = await productModel.findById(productId).select('+isActive +stock');
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Check product availability
    const errorMessages = [];
    if (product.isActive === "0") {
      errorMessages.push("product is inactive");
    }
    if (product.stock < quantity) {  // Changed to check against quantity being added
      errorMessages.push("insufficient stock");
    }
    
    if (errorMessages.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot add product: ${errorMessages.join(" and ")}`
      });
    }

    // Check if product already exists in order
    const existingProductIndex = order.products.findIndex(
      p => p.product && p.product.toString() === productId.toString()
    );

    // Update or add product
    if (existingProductIndex !== -1) {
      order.products[existingProductIndex].quantity += quantity;
    } else {
      order.products.push({
        product: productId,
        quantity,
        price
      });
    }

    // Recalculate total amount with error handling
    const totalAmount = order.products.reduce(
      (total, product) => {
        const productPrice = parseFloat(product.price) || 0;
        const productQuantity = parseInt(product.quantity) || 0;
        return total + (productQuantity * productPrice);
      }, 
      0
    );
    order.amount = totalAmount;

    // Save updated order
    await order.save();

    // Update product stock  ********** KEY ADDITION **********
    await productModel.findByIdAndUpdate(
      productId,
      { $inc: { stock: -quantity } }, // Decrease stock by ordered quantity
      { new: true }
    );

    // Populate the updated order
    const updatedOrder = await orderModel
      .findById(orderId)
      .populate({
        path: "products.product",
        select: "name photo price images sku gst isActive stock"
      })
      .populate("buyer", "name email");

    res.json({
      success: true,
      message: "Product added to order successfully",
      order: updatedOrder
    });

  } catch (error) {
    console.error("Error adding product to order:", error);
    res.status(500).json({
      success: false,
      message: "Error adding product to order",
      error: error.message
    });
  }
};
//order status'
export const orderStatusController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    // Validate orderId format
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format"
      });
    }

    // Validate status value
    const validStatuses = [
      "Pending", "Completed", "Cash on Delivery", "Confirmed", 
      "Accepted", "Cancelled", "Rejected", "Dispatched", 
      "Delivered", "Returned"
    ];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value"
      });
    }

    const order = await orderModel.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).send({
        success: false,
        message: 'Order not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      order,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: 'Error while updating order',
      error,
    });
  }
};


// In your orderController.js file
export const addTrackingInfo = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { company, id } = req.body;

    const updatedOrder = await orderModel.findByIdAndUpdate(
      orderId,
      { tracking: { company, id } },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).send({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).send({
      success: true,
      message: "Tracking information added successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error adding tracking information",
      error,
    });
  }
};

export const updateOrderController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryCharges, codCharges, discount, amount, products } = req.body;

    // Validate orderId format
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format"
      });
    }

    const order = await orderModel.findById(orderId).populate('products.product');

    if (!order) {
      return res.status(404).send({
        success: false,
        message: "Order not found",
      });
    }

    // Update products while preserving existing product details
    order.products = products.map((updatedProduct, index) => {
      const existingProduct = order.products[index];
      return {
        product: existingProduct?.product?._id || updatedProduct.product,
        quantity: updatedProduct.quantity,
        price: updatedProduct.price
      };
    });

    // Calculate total product amount
    const totalProductAmount = products.reduce((total, product) => {
      return total + (Number(product.price) * Number(product.quantity));
    }, 0);

    // Update order fields
    order.deliveryCharges = Number(deliveryCharges) || 0;
    order.codCharges = Number(codCharges) || 0;
    order.discount = Number(discount) || 0;
    order.amount = Number(amount) || 0;

    // Calculate new total amount
    const newTotalAmount = totalProductAmount + order.deliveryCharges + order.codCharges - order.discount;

    // Calculate amount pending
    order.amountPending = newTotalAmount - order.amount;

    // Save the updated order
    const updatedOrder = await order.save();

    res.status(200).send({
      success: true,
      message: "Order updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error in updating order:", error);
    res.status(500).send({
      success: false,
      message: "Error in updating order",
      error: error.message,
    });
  }
};

export const deleteProductFromOrderController = async (req, res) => {
  try {
    const { orderId, productId } = req.params;

    // Validate input parameters
    if (!orderId || !productId) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters: orderId and productId"
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format"
      });
    }

    // Find the order
    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(404).send({
        success: false,
        message: "Order not found"
      });
    }

    // Check for the product in the order - handle both product._id and order item._id
    let productIndex = order.products.findIndex(
      (item) => item.product && item.product.toString() === productId.toString()
    );

    // If not found by product._id, try to find by order item._id
    if (productIndex === -1) {
      productIndex = order.products.findIndex(
        (item) => item._id && item._id.toString() === productId.toString()
      );
    }

    if (productIndex === -1) {
      return res.status(404).send({
        success: false,
        message: "Product not found in this order"
      });
    }

    // Calculate price to subtract
    const productToRemove = order.products[productIndex];
    const priceToSubtract = (productToRemove.price || 0) * (productToRemove.quantity || 0);

    // Remove the product from the array
    order.products.splice(productIndex, 1);

    // Update order totals
    order.amount = Math.max(0, order.amount - priceToSubtract);
    order.amountPending = Math.max(0, order.amountPending - priceToSubtract);

    // Save the updated order
    await order.save();

    // Load the updated order with populated data for response
    const updatedOrder = await orderModel.findById(orderId)
      .populate("products.product")
      .populate("buyer");

    res.status(200).send({
      success: true,
      message: "Product removed from order successfully",
      order: updatedOrder
    });
  } catch (error) {
    console.error("Error removing product from order:", error);
    res.status(500).send({
      success: false,
      message: "Error removing product from order",
      error: error.message
    });
  }
};

// router.get("/order/:orderId/invoice", requireSignIn, async (req, res) => {
//   try {
//     const order = await orderModel.findById(req.params.orderId).populate('buyer').populate('products');
//     if (!order) {
//       return res.status(404).json({ success: false, message: 'Order not found' });
//     }

//     // Create a PDF invoice
//     // ...

//     res.download(pdfPath, 'invoice.pdf');
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: 'Error generating invoice' });
//   }
// });

// Refresh token controller to handle token refreshing
export const refreshTokenController = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).send({
        success: false,
        message: "Refresh token is required"
      });
    }

    // Verify the refresh token
    let decoded;
    try {
      decoded = JWT.verify(refreshToken, process.env.JWT_SECRET);
    } catch (tokenError) {
      // Handle specific JWT verification errors
      if (tokenError.name === "TokenExpiredError") {
        return res.status(401).send({
          success: false,
          message: "Refresh token has expired, please login again",
          code: "REFRESH_TOKEN_EXPIRED"
        });
      } else {
        return res.status(401).send({
          success: false,
          message: "Invalid refresh token",
          code: "INVALID_REFRESH_TOKEN"
        });
      }
    }
    
    // Check if user exists
    const user = await userModel.findById(decoded._id);
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
        code: "USER_NOT_FOUND"
      });
    }

    // Check if user is active
    if (user.status !== "active" && user.status) {
      return res.status(403).send({
        success: false,
        message: "Account is not active",
        code: "ACCOUNT_INACTIVE"
      });
    }

    // Generate a new access token with 1-hour expiration
    const newAccessToken = JWT.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "365d" // 1 hour
    });

    // Generate a new refresh token with 1-year expiration
    // Creating a new refresh token on each refresh adds an extra layer of security
    const newRefreshToken = JWT.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "365d" // 1 year
    });

    // Add useful data about token expiration for the client
    const decodedAccess = JWT.decode(newAccessToken);
    const decodedRefresh = JWT.decode(newRefreshToken);

    res.status(200).send({
      success: true,
      message: "Token refreshed successfully",
      token: newAccessToken,
      refreshToken: newRefreshToken,
      tokenExpiry: decodedAccess.exp * 1000, // Convert to milliseconds
      refreshTokenExpiry: decodedRefresh.exp * 1000, // Convert to milliseconds
      user: {
        _id: user._id,
        user_fullname: user.user_fullname,
        email_id: user.email_id,
        mobile_no: user.mobile_no,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    
    res.status(500).send({
      success: false,
      message: "Error refreshing token",
      error: error.message,
      code: "SERVER_ERROR"
    });
  }
};