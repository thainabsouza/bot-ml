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
      model: "gpt-4.1-mini",
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
        Não precisa responder "se o anuncio é compativel" observe você se é compativel e apenas responde positivamente a compatibilidade.
        Se perguntar se pode retirar no local, responder que infelizmente não é possivel, só fazemos envio no momento.
        Se precisar comprar o par é só adicionar um produto de acordo com o anuncio de cada lado caso tenha disponivel.
        Se o cliente perguntar se a peças é lado esquerdo ou lado direiro, pode responder que ele pode escolher o lado nas variações disponiveis.

          `,
        },
        {
          role: "user",
          content: pergunta,
        },
      ],
    });

    return response.output_text || null;
  } catch (err) {
    console.error("❌ IA erro:", err.response?.data || err.message);
    return null;
  }
}

// 🔎 texto
function getText(p) {
  if (!p) return "";
  if (typeof p.text === "string") return p.text;

  return p.text?.plain_text || p.text?.text || p.text?.plain || "";
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

    console.log("📦 Contas encontradas:", contas.length);

    for (const conta of contas) {
      console.log("ML:", JSON.stringify(conta.mercadoLivre, null, 2));

      console.log("Tem token?", !!conta?.mercadoLivre?.accessToken);

      if (!conta?.mercadoLivre?.accessToken) {
        console.log("❌ Sem access token");
        continue;
      }

      console.log("✅ Token encontrado");

      const perguntas = await listarPerguntas(conta);
      let latestDate = lastProcessed[conta._id];

      for (const p of perguntas) {
        console.log("================================");
        console.log("ID:", p.id);
        console.log("STATUS:", p.status);
        console.log("ANSWER:", p.answer);
        console.log("TEXT:", getText(p));
        console.log("DATE:", p.date_created);
        console.log("RESPONDABLE:", isRespondable(p));

        if (!isRespondable(p)) continue;

        const dataPergunta = new Date(p.date_created);

        if (dataPergunta <= lastProcessed[conta._id]) {
          console.log("⏭️ Ignorada por lastProcessed");
          continue;
        }
        console.log("🤖 Gerando resposta...");

        const resposta = await gerarResposta(getText(p));
        console.log("🤖 Resposta gerada:", resposta);

        if (!resposta) {
          console.log("❌ IA não retornou resposta");
          continue;
        }

        await responder(p.id, resposta, conta);

        console.log("✅ Respondido:", p.id);
        console.log("🤖 Resposta IA:", resposta);

        if (!latestDate || dataPergunta > latestDate) {
          latestDate = dataPergunta;
        }

        await sleep(2000);
      }

      lastProcessed[conta._id] = latestDate;
    }
    //console.log("📥 PERGUNTAS RECEBIDAS:", perguntas?.length);
    //console.log("📥 PRIMEIRA PERGUNTA:", perguntas?.[0]);
  } catch (err) {
    botStatus.lastError = err.message;
    console.error("❌ Erro no bot:", err.response?.data || err.message);
  } finally {
    botStatus.running = false;
  }
}

// 🔁 LOOP
async function loop() {
  let locked = false;

  try {
    locked = await acquireLock("bot");

    if (!locked) {
      console.log("🔒 Outro worker rodando");
      return;
    }

    console.log("🕒 EXECUÇÃO:", new Date());

    const permitido = isHorarioPermitido();

    console.log("Resultado:", permitido);

    if (permitido) {
      await executarBot();
    } else {
      console.log("⛔ BLOQUEADO POR HORÁRIO");
    }
  } catch (err) {
    console.error("❌ erro:", err);
  } finally {
    if (locked) {
      await releaseLock("bot");
    }
  }
}

module.exports = { loop, botStatus };
