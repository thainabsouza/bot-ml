require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const routes = require("./routes");

const { executarBot } = require("./services/bot");
const { loop } = require("./services/bot");

const app = express();
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Mongo conectado");

    // 🚀 inicia o bot só depois do banco conectar
    //executarBot();
    loop();
  })
  .catch((err) => console.error("Erro Mongo:", err));

app.use("/", routes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Servidor rodando na porta", PORT);
});
