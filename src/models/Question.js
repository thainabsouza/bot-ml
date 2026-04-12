const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema(
  {
    contaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conta",
    },
    questionId: String,
    text: String,
    status: String,
    answer: String,
  },
  { timestamps: true },
);

// 🔥 índice único (ANTI DUPLICAÇÃO)
QuestionSchema.index({ questionId: 1, contaId: 1 }, { unique: true });

module.exports = mongoose.model("Question", QuestionSchema);
