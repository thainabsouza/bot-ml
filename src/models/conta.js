const mongoose = require("mongoose");

const ContaSchema = new mongoose.Schema(
  {
    nome: String,

    mercadoLivre: {
      userId: String,

      accessToken: String,

      refreshToken: String,

      expiresAt: Date,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Conta", ContaSchema);
