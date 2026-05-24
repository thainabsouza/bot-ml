const axios = require("axios");
const { getValidToken } = require("./auth");

// 📩 LISTAR PERGUNTAS
async function listarPerguntas(conta) {
  try {
    const token = await getValidToken(conta);

    const url = `https://api.mercadolibre.com/questions/search?seller_id=${conta.mercadoLivre.userId}&limit=50&sort=date_created_desc`;

    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const perguntas = res.data.questions || [];

    // 🔥 FILTRA APENAS NÃO RESPONDIDAS
    const abertas = perguntas.filter((p) => !p.answer);

    console.log("📩 TOTAL BRUTO:", perguntas.length);
    console.log("📩 NÃO RESPONDIDAS:", abertas.length);

    return abertas;
  } catch (err) {
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
