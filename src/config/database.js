const mongoose = require("mongoose");

async function conectarDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Mongo conectado");
  } catch (err) {
    console.error("❌ Erro ao conectar no Mongo:", err.message);
  }
}

module.exports = conectarDB;
