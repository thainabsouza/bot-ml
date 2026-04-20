const axios = require("axios");
const { getValidToken } = require("./auth");

async function listarPerguntas(conta) {
  const token = await getValidToken(conta);

  const limit = 10;

  const url = `https://api.mercadolibre.com/questions/search?seller_id=${conta.mercadoLivre.userId}&limit=${limit}&sort=date_created_desc`;

  const res = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const perguntas = res.data.questions;

  console.log("📩 TOTAL PERGUNTAS:", perguntas.length);

  return perguntas;
}

async function responder(id, texto, conta) {
  const token = await getValidToken(conta); // 🔥 CORRETO

  await axios.post(
    "https://api.mercadolibre.com/answers",
    {
      question_id: id,
      text: texto,
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
}

async function verUsuario(token) {
  const res = await axios.get("https://api.mercadolibre.com/users/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log("USUÁRIO LOGADO:");
  //console.log("📦 RESPOSTA COMPLETA:", res.data); // 👈 AQUI
  // console.log("📩 PERGUNTAS:", res.data.questions); // 👈 AQUI
}

module.exports = { listarPerguntas, responder };
