require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const routes = require("./routes");
const cron = require("node-cron");

const { loop } = require("./services/bot");

const app = express();
app.use(express.json());
app.use("/", routes);

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Mongo conectado");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // 🔥 CRON FORA DO LISTEN (CORRETO)
    cron.schedule("* * * * *", async () => {
      console.log("🤖 Rodando bot...");
      await loop();
    });
  } catch (err) {
    console.error("Erro inicializando app:", err);
    process.exit(1);
  }
}

start();
