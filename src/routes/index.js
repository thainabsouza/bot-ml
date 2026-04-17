const express = require("express");
const router = express.Router();
const processingCodes = new Set();

//const { executarBot } = require("../services/bot");
const { trocarCodePorToken, getValidToken } = require("../services/auth");

const Question = require("../models/Question");
const Conta = require("../models/conta");

require("dotenv").config();

const axios = require("axios");

// HOME
router.get("/", async (req, res) => {
  try {
    const perguntas = await Question.find().sort({ createdAt: -1 });

    console.log("PERGUNTAS:", perguntas);

    res.send(
      perguntas
        .map(
          (q) => `
        <p>
          <b>${q.text}</b><br>
          Status: ${q.status}<br>
          Resposta: ${q.answer || "—"}
        </p>
      `,
        )
        .join("<hr>"),
    );
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao buscar perguntas");
  }
});

// 🔐 CALLBACK DO MERCADO LIVRE (AQUI SALVA A CONTA)
router.get("/auth/callback", async (req, res) => {
  const { code } = req.query;

  if (!code) return res.send("❌ Sem code");

  if (processingCodes.has(code)) {
    return res.send("⚠️ Code já está sendo processado");
  }

  processingCodes.add(code);

  try {
    await trocarCodePorToken(code);
    return res.send("✅ Conta conectada com sucesso");
  } catch (err) {
    console.error("OAuth error:", err.response?.data || err.message);
    return res.send("❌ erro no OAuth");
  } finally {
    processingCodes.delete(code);
  }
});

// 🤖 EXECUTAR BOT
/*router.get("/run", async (req, res) => {
  try {
    await executarBot();
    res.send("🤖 Bot executado com sucesso!");
  } catch (err) {
    console.error(err.message);
    res.status(500).send(err.message);
  }
});*/

// 👤 DEBUG - VER USUÁRIO SALVO
router.get("/me", async (req, res) => {
  try {
    // 🔥 pega conta do banco (NÃO salva nada aqui)
    const conta = await Conta.findOne();

    if (!conta) {
      return res.send("❌ Nenhuma conta encontrada");
    }

    // 🔑 pega token válido
    const token = await getValidToken(conta);

    // 👤 busca usuário na API
    const response = await axios.get("https://api.mercadolibre.com/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("👤 USER:", response.data);

    res.json(response.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send("Erro ao buscar usuário");
  }
});

router.get("/auth/login", (req, res) => {
  const url = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${process.env.CLIENT_ID}&redirect_uri=${process.env.REDIRECT_URI}`;

  res.redirect(url);
});
const { botStatus } = require("../services/bot");

router.get("/bot/status", (req, res) => {
  res.json(botStatus);
});

module.exports = router;
