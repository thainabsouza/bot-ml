const axios = require("axios");
const { getValidToken } = require("./auth");

// 📩 LISTAR PERGUNTAS
async function listarPerguntas(conta) {
  try {
    const token = await getValidToken(conta);

    const limit = 10;

    const url = `https://api.mercadolibre.com/questions/search?seller_id=${conta.mercadoLivre.userId}&limit=${limit}&sort=date_created_desc`;

    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("📩 TOTAL PERGUNTAS:", res.data.questions.length);

    return res.data.questions;
  } catch (err) {
    if (err.response?.status === 401 || err.response?.status === 403) {
      console.log("⛔ Token expirado da conta:", conta.nome);
      return [];
    }

    console.log("❌ Erro listar perguntas:", err.response?.data || err.message);

    return [];
  }
}

// 💬 RESPONDER PERGUNTA
async function responder(id, texto, conta) {
  try {
    if (!texto?.trim()) {
      console.log("❌ Texto inválido");
      return;
    }

    const token = await getValidToken(conta);

    const body = {
      question_id: Number(id),
      text: texto.trim(),
    };

    console.log("📤 ENVIANDO:", body);

    await axios.post("https://api.mercadolibre.com/answers", body, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("✅ Resposta enviada");
  } catch (err) {
    console.log("❌ Erro responder:", err.response?.data || err.message);
  }
}

module.exports = {
  listarPerguntas,
  responder,
};
