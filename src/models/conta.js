const mongoose = require("mongoose");

const ContaSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: true,
    },
    mercadoLivre: {
      accessToken: {
        type: String,
        required: true,
      },
      refreshToken: {
        type: String,
        required: true,
      },
      userId: {
        type: Number,
        required: true,
      },
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Conta", ContaSchema);

/*const mongoose = require("mongoose");

const ContaSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: true,
    },
    mercadoLivre: {
      accessToken: {
        type: String,
        required: true,
      },
      refreshToken: {
        type: String,
        required: true,
      },
      userId: {
        type: String,
        required: true,
      },
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Conta", ContaSchema);*/
