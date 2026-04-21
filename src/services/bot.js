const { listarPerguntas, responder } = require("./mercadoLivre");
const Conta = require("../models/conta");
const { isHorarioPermitido } = require("../utils/time");
const { acquireLock, releaseLock } = require("../utils/lock");

const OpenAI = require("openai");
require("dotenv").config();
const VALID_STATUS = new Set(["UNANSWERED", "OPEN"]);
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const lastProcessed = {};

const botStatus = {
  running: false,
  lastRun: null,
  lastError: null,
};

// ⏳ sleep
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
        Você é um atendente da fecautopeças .
        Só trabalhamos com faróis, lanternas e lentes, todas as nossas peças são originais, pode sempre confirmar.
        Exemplo: Olá bom dia, sim produto original, aguardamos sua compra. Att fecautopeças.
        Responda curto, educado e direto.
        Se a pergunta for se o produto é original responder: Sim produto novo original Att fecautopeças.
        Se for compatível, incentive a compra e sempre coloque o Att fecautopeças.
        se a pergunta for sobre compatibilidade e no anuncio estiver compativel com a pergunta confirma exemplo:
        Bom dia, Boa tarde ou boa noite de acordo com o horario da pergunta, e responder sim é compativel,aguardamos sua compra, Att fecautopeças.
        Não precisa responder "se o anuncio é compativel" observe você se é compativel e apenas responde posivamente a compatibilidade.
        Se perguntar se pode retirar no local, responder que infelizmente não é possivel, só fazemos envio no momento.
        Se precisar comprar o par é só adicionar um produto de acordo com o anuncio de cada lado.
        Se o cliente perguntar se a peças é lado esquerdo ou lado direiro, pode responder que ele pode escolher o lado em variações

          `,
        },
        {
          role: "user",
          content: pergunta,
        },
      ],
    });

    return response.output_text || "Olá! Pode me dar mais detalhes?";
  } catch (err) {
    console.error("❌ IA erro:", err.message);
    return null;
  }
}

// 🔎 normaliza texto do ML
function getText(p) {
  return p?.text?.plain_text || p?.text?.text || p?.text || "";
}

// ✔️ valida pergunta
function isRespondable(p) {
  const text =
    typeof p.text === "string"
      ? p.text
      : p.text?.plain_text || p.text?.text || "";

  if (!text.trim()) return false;
  if (text.trim().length < 3) return false;
  if (!VALID_STATUS.has(p.status)) return false;
  if (p.answer) return false;

  return true;
}

// 🚀 BOT
async function executarBot() {
  botStatus.running = true;
  botStatus.lastRun = new Date();

  try {
    console.log("🔄 Rodando bot...");

    const contas = await Conta.find();

    for (const conta of contas) {
      const perguntas = await listarPerguntas(conta);

      if (!lastProcessed[conta._id]) {
        lastProcessed[conta._id] = new Date(0); // início do tempo
      }

      let latestDate = lastProcessed[conta._id];

      for (const p of perguntas) {
        if (!isRespondable(p)) continue;

        const dataPergunta = new Date(p.date_created);

        if (dataPergunta <= lastProcessed[conta._id]) continue;

        try {
          const resposta = await gerarResposta(p.text);
          if (!resposta) continue;

          await responder(p.id, resposta, conta);

          console.log("✅ Respondido:", p.id);

          // guarda a mais recente
          if (!latestDate || dataPergunta > latestDate) {
            latestDate = dataPergunta;
          }

          await sleep(2000);
        } catch (err) {
          console.log("❌ ERRO ML:", err.response?.data || err.message);
        }
      }

      // 🔥 atualiza só no final
      if (latestDate) {
        lastProcessed[conta._id] = latestDate;
      }
    }
  } catch (err) {
    botStatus.lastError = err.message;
    console.error("❌ Erro no bot:", err.message);
  } finally {
    botStatus.running = false;
  }
}

// 🔁 LOOP
async function loop() {
  while (true) {
    const locked = await acquireLock("bot");

    if (!locked) {
      console.log("🔒 Outro worker já está rodando");
      await sleep(10000);
      continue;
    }

    try {
      if (isHorarioPermitido()) {
        await executarBot();
      }
    } catch (err) {
      console.error("❌ erro:", err);
    } finally {
      await releaseLock("bot");
    }

    await sleep(60000);
  }
}

module.exports = { loop, botStatus };
