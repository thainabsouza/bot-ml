const { listarPerguntas, responder } = require("./mercadoLivre");
const Question = require("../models/Question");
const Conta = require("../models/Conta");

const OpenAI = require("openai");
require("dotenv").config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ⏳ sleep helper
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 🤖 IA
async function gerarResposta(pergunta) {
  try {
    const response = await client.responses.create({
      model: "gpt-5.4-mini",
      max_output_tokens: 80,
      input: [
        {
          role: "system",
          content: `
Você é um atendente de uma loja de autopeças.

Responda em português, de forma educada e direta.
Se for compatibilidade, peça modelo, ano e versão.
          `,
        },
        {
          role: "user",
          content: pergunta,
        },
      ],
    });

    return response.output_text || "Olá! Pode me dar mais detalhes?";
  } catch (error) {
    console.error("❌ Erro na IA:", error.message);
    return "Olá! Pode informar modelo, ano e versão do veículo? 😊";
  }
}

// 🚀 BOT
async function executarBot() {
  console.log("🔄 Rodando bot...");

  const contas = await Conta.find();

  for (const conta of contas) {
    try {
      const perguntas = await listarPerguntas(conta);

      console.log("📩 Perguntas:", perguntas.length);

      for (const p of perguntas) {
        await sleep(3000);

        console.log("🧠 Pergunta:", p.id, p.status, p.text);

        // 👉 IGNORA só se já respondeu no ML
        if (p.status === "ANSWERED") {
          console.log("⏭️ Já respondida no ML:", p.id);
          continue;
        }

        // 💾 salva (sem duplicar crash)
        await Question.updateOne(
          { questionId: p.id, contaId: conta._id },
          {
            $set: {
              text: p.text,
              status: p.status,
            },
          },
          { upsert: true },
        );

        // 🤖 gera resposta
        const resposta = await gerarResposta(p.text);

        try {
          console.log("🤖 Respondendo:", p.id);

          await responder(p.id, resposta, conta);

          // 💾 salva resposta
          await Question.updateOne(
            { questionId: p.id, contaId: conta._id },
            { answer: resposta, status: "ANSWERED" },
          );

          console.log("✅ Respondida!");
        } catch (err) {
          console.error(
            "❌ ERRO AO RESPONDER:",
            err.response?.data || err.message,
          );
        }
      }
    } catch (err) {
      console.error("❌ Erro na conta:", err.message);
    }
  }

  console.log("⏳ Aguardando 10 segundos...");
  await sleep(10000);

  executarBot();
}

module.exports = { executarBot };
