const express = require("express");
const app = express();
const port = 3000;

const mongoose = require("mongoose");
mongoose.connect(
  "mongodb+srv://mugdhapadgelwar2002:Mugdha123@cluster0.2mjqkrn.mongodb.net/?retryWrites=true&w=majority"
);

const Product = require("./model/userModel");
const Checkout = require("./model/checkoutModel");
const Order = require("./model/orderModel");

app.use(express.json());

app.post("/product", async (req, res) => {
  try {
    const { id, name, description, price, stock, image } = req.body;

    // Validation: Check if all required fields are present
    if (!id || !name || !description || !price || !stock || !image) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Create a new product object
    const newProduct = new Product({
      id,
      name,
      description,
      price,
      stock,
      image,
    });

    // Save the new product to the database
    await newProduct.save();

    res
      .status(201)
      .json({ message: "Product added successfully", product: newProduct });
  } catch (error) {
    // Error handling: If there's an error, send an error response
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/products", async (req, res) => {
  try {
    // Fetch all products from the database
    const products = await Product.find({});
    res.status(200).json(products);
  } catch (error) {
    // Error handling: If there's an error, send an error response
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/search", async (req, res) => {
  try {
    const { query } = req.query;

    // Validate the search query
    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    // Perform a case-insensitive search on both name and description fields
    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
    });

    res.status(200).json(products);
  } catch (error) {
    // Error handling: If there's an error, send an error response
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.delete("/delete", async (req, res) => {
  try {
    const productId = req.query.id;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    // Find the product by ID and delete it
    const deletedProduct = await Product.findOneAndDelete({ id: productId });

    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      message: "Product deleted successfully",
      product: deletedProduct,
    });
  } catch (error) {
    // Error handling: If there's an error, send an error response
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.put("/product/update", async (req, res) => {
  try {
    const productId = req.query.id;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    // Find the product by ID and update it with the provided information
    const updatedProduct = await Product.findOneAndUpdate(
      { id: productId },
      req.body,
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    // Error handling: If there's an error, send an error response
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// API endpoint to checkout a product
app.post("/cart", async (req, res) => {
  try {
    const productId = req.query.id;
    const { quantity } = req.body;

    // Find the product by ID
    const product = await Product.findOne({ id: productId });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if there is enough stock
    if (product.stock < quantity) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    // Calculate the price for the checkout record
    const totalPrice = product.price * quantity;

    // Create a new checkout record
    const newCheckout = new Checkout({
      c_id: Date.now(), // Generate a unique checkout ID
      p_id: productId,
      price: totalPrice,
      quantity,
    });

    // Save the checkout record to the database
    await newCheckout.save();

    // Update the stock of the product
    product.stock -= quantity;
    await product.save();

    res
      .status(200)
      .json({ message: "Checkout created successful", checkout: newCheckout });
  } catch (error) {
    // Error handling: If there's an error, send an error response
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/checkout/order", async (req, res) => {
  try {
    // Get all items from the checkout collection
    const checkoutItems = await Checkout.find({});

    if (checkoutItems.length === 0) {
      return res
        .status(400)
        .json({ message: "No items in the checkout collection" });
    }

    // Calculate total cost
    let totalCost = 0;
    checkoutItems.forEach((item) => {
      totalCost += item.price;
    });

    // Create a new order
    const newOrder = new Order({
      o_id: Date.now(), // Generate a unique order ID
      o_date: new Date(),
      o_address: req.body.address,
      o_status: "Pending",
      o_totalcost: totalCost,
    });

    // Save the order to the database
    await newOrder.save();

    // Delete items from the checkout collection
    await Checkout.deleteMany({});

    res
      .status(200)
      .json({ message: "Order created successfully", order: newOrder });
  } catch (error) {
    // Error handling: If there's an error, send an error response
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/orders/status", async (req, res) => {
  try {
    const orderId = req.query.id;

    // Find the order by ID
    const order = await Order.findOne({ o_id: orderId });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Return the status of the order
    res.status(200).json({ status: order.o_status });
  } catch (error) {
    // Error handling: If there's an error, send an error response
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.delete("/orders/cancle", async (req, res) => {
  try {
    const orderId = req.query.id;

    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    // Find and delete the order by ID
    const deletedOrder = await Order.findOneAndDelete({ o_id: orderId });

    if (!deletedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    // Error handling: If there's an error, send an error response
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
