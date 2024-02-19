const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const app = express();
const port = 3000;

app.use(bodyParser.json());

// File path
const filePath = path.join(__dirname, "fileSystem", "product.json");
const cartFilePath = path.join(__dirname, "fileSystem", "cart.json");
const orderFilePath = path.join(__dirname, "filesystem", "order.json");

// API endpoint to append data to product.json file
app.post("/product", (req, res) => {
  try {
    const newData = req.body;

    // Read existing data from product.json file
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Error reading file", error: err });
      }

      let existingData = [];
      if (data) {
        existingData = JSON.parse(data);
      }

      // Append new data to existing data
      existingData.push(newData);

      // Write updated data to product.json file
      fs.writeFile(filePath, JSON.stringify(existingData), "utf8", (err) => {
        if (err) {
          return res
            .status(500)
            .json({ message: "Error writing file", error: err });
        }
        res.status(200).json({ message: "Data appended successfully" });
      });
    });
  } catch (error) {
    // Error handling: If there's an error, send an error response
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error });
  }
});

// API endpoint to fetch all products
app.get("/products", (req, res) => {
  try {
    // Read data from product.json file
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Error reading file", error: err });
      }

      // Parse the JSON data
      const products = JSON.parse(data);

      // Send the products as JSON response
      res.status(200).json(products);
    });
  } catch (error) {
    // Error handling: If there's an error, send an error response
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error });
  }
});

// API endpoint to search for a particular product by name
app.get("/search", (req, res) => {
  try {
    const productName = req.query.name;

    if (!productName) {
      return res
        .status(400)
        .json({ message: "Product name is required as a query parameter" });
    }

    // Read data from product.json file
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Error reading file", error: err });
      }

      // Parse the JSON data
      const products = JSON.parse(data);

      // Search for the product by name
      const product = products.find(
        (product) => product.name.toLowerCase() === productName.toLowerCase()
      );

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Send the product as JSON response
      res.status(200).json(product);
    });
  } catch (error) {
    // Error handling: If there's an error, send an error response
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error });
  }
});

// API endpoint to delete a product by ID
app.delete("/deleteProduct", (req, res) => {
  try {
    const productId = parseInt(req.query.id);

    // Read data from product.json file
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Error reading file", error: err });
      }

      // Parse the JSON data
      const products = JSON.parse(data);

      // Find the index of the product with the specified ID
      const index = products.findIndex((product) => product.id === productId);

      if (index === -1) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Remove the product from the array
      products.splice(index, 1);

      // Write the updated data back to the product.json file
      fs.writeFile(filePath, JSON.stringify(products), "utf8", (err) => {
        if (err) {
          return res
            .status(500)
            .json({ message: "Error writing file", error: err });
        }
        res.status(200).json({ message: "Product deleted successfully" });
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error });
  }
});

app.post("/cart", async (req, res) => {
  try {
    const productId = req.query.id;
    const { quantity } = req.body;

    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Error reading product file", error: err });
      }

      const products = JSON.parse(data);
      const product = products.find(
        (product) => product.id === parseInt(productId)
      );

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (product.stock < quantity) {
        return res.status(400).json({ message: "Insufficient stock" });
      }

      const totalPrice = product.price * quantity;

      // Update the stock quantity in the product data
      product.stock -= quantity;

      fs.writeFile(filePath, JSON.stringify(products), "utf8", (err) => {
        if (err) {
          return res
            .status(500)
            .json({ message: "Error writing product file", error: err });
        }

        const newCartItem = {
          c_id: Date.now(), // Generate a unique checkout ID
          p_id: productId,
          price: totalPrice,
          quantity,
        };

        fs.readFile(cartFilePath, "utf8", (err, cartData) => {
          if (err) {
            return res
              .status(500)
              .json({ message: "Error reading cart file", error: err });
          }

          let cartItems = [];
          if (cartData) {
            cartItems = JSON.parse(cartData);
          }

          cartItems.push(newCartItem);

          fs.writeFile(
            cartFilePath,
            JSON.stringify(cartItems),
            "utf8",
            (err) => {
              if (err) {
                return res
                  .status(500)
                  .json({ message: "Error writing cart file", error: err });
              }
              res.status(200).json({
                message: "Product added to cart successfully",
                cartItem: newCartItem,
              });
            }
          );
        });
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error });
  }
});

app.post("/checkout/order", async (req, res) => {
  try {
    // Read the contents of the cart.json file
    fs.readFile(cartFilePath, "utf8", (err, data) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Error reading cart file", error: err });
      }

      // Parse the JSON data
      const cartItems = JSON.parse(data);

      if (cartItems.length === 0) {
        return res.status(400).json({ message: "No items in the cart" });
      }

      // Calculate total cost
      let totalCost = 0;
      cartItems.forEach((item) => {
        totalCost += item.price;
      });

      // Create a new order object
      const newOrder = {
        o_id: Date.now(), // Generate a unique order ID
        o_date: new Date(),
        o_address: req.body.address,
        o_status: "Pending",
        o_totalcost: totalCost,
      };

      // Write the new order object to the order.json file
      fs.writeFile(orderFilePath, JSON.stringify(newOrder), "utf8", (err) => {
        if (err) {
          return res
            .status(500)
            .json({ message: "Error writing order file", error: err });
        }

        // Clear the contents of the cart.json file
        fs.writeFile(cartFilePath, JSON.stringify([]), "utf8", (err) => {
          if (err) {
            return res
              .status(500)
              .json({ message: "Error clearing cart file", error: err });
          }

          res
            .status(200)
            .json({ message: "Order created successfully", order: newOrder });
        });
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error });
  }
});

app.get("/orders/status", async (req, res) => {
  try {
    const orderId = req.query.id;

    // Read the contents of the order.json file
    fs.readFile(orderFilePath, "utf8", (err, data) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Error reading order file", error: err });
      }

      try {
        // Parse the JSON data
        const orders = JSON.parse(data);

        // Ensure that orders is an array
        if (!Array.isArray(orders)) {
          throw new Error("Data is not in expected format");
        }

        // Find the order by ID
        const order = orders.find((order) => order.o_id === parseInt(orderId));

        if (!order) {
          return res.status(404).json({ message: "Order not found" });
        }

        // Return the status of the order
        res.status(200).json({ status: order.o_status });
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .json({ message: "Internal server error", error: error });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error });
  }
});

app.delete("/orders/cancel", async (req, res) => {
  try {
    const orderId = req.query.id;

    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    // Read the contents of the order.json file
    fs.readFile(orderFilePath, "utf8", (err, data) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Error reading order file", error: err });
      }

      try {
        // Parse the JSON data
        const orders = JSON.parse(data);

        // Find the index of the order by ID
        const index = orders.findIndex(
          (order) => order.o_id === parseInt(orderId)
        );

        if (index === -1) {
          return res.status(404).json({ message: "Order not found" });
        }

        // Remove the order from the list of orders
        orders.splice(index, 1);

        // Write the updated list of orders back to the order.json file
        fs.writeFile(orderFilePath, JSON.stringify(orders), "utf8", (err) => {
          if (err) {
            return res
              .status(500)
              .json({ message: "Error writing order file", error: err });
          }
          res.status(200).json({ message: "Order deleted successfully" });
        });
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .json({ message: "Internal server error", error: error });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error });
  }
});
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
