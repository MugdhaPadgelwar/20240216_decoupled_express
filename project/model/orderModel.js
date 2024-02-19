const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  o_id: Number,
  o_date: Date,
  o_address: String,
  o_status: String,
  o_totalcost: Number,
});

module.exports = mongoose.model("Order", orderSchema);
