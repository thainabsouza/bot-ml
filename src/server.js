const app = require("./app");
const mongoose = require("mongoose");
require("dotenv").config();

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("🚀 API rodando");
    app.listen(3000);
  })
  .catch((err) => console.error("❌ Mongo error:", err));
