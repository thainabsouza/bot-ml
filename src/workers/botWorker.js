const mongoose = require("mongoose");
require("dotenv").config();

const { executarBot } = require("../services/bot");

// 🔥 CONECTAR NO MONGO AQUI
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Worker conectado ao Mongo"))
  .catch((err) => console.error("❌ Erro Mongo:", err));

async function startBotLoop() {
  while (true) {
    try {
      console.log("🔄 Rodando bot...");

      await executarBot();

      console.log("⏳ Aguardando 10 segundos...");
    } catch (err) {
      console.error("Erro no bot:", err.response?.data || err.message);
    }

    await new Promise((resolve) => setTimeout(resolve, 10000));
  }
}

startBotLoop();
