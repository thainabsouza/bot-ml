const mongoose = require("mongoose");

const LockSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  lockedAt: Date,
});

module.exports = mongoose.model("Lock", LockSchema);
