const mongoose = require("mongoose");

const checkoutSchema = new mongoose.Schema({
  c_id: Number,
  p_id: Number,
  price: Number,
  stock: Number,
});

module.exports = mongoose.model("Checkout", checkoutSchema);
