const axios = require("axios");
const { getValidToken } = require("./auth");

async function listarPerguntas(conta) {
  const token = await getValidToken(conta);

  let todasPerguntas = [];
  let offset = 0;
  const limit = 50;

  while (true) {
    const url = `https://api.mercadolibre.com/questions/search?seller_id=${conta.mercadoLivre.userId}&limit=${limit}&offset=${offset}`;

    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const perguntas = res.data.questions;

    if (!perguntas.length) break;

    todasPerguntas.push(...perguntas);

    offset += limit;

    // 🔥 proteção pra não explodir
    if (offset > 200) break;
  }

  console.log("📩 TOTAL PERGUNTAS:", todasPerguntas.length);

  return todasPerguntas;
  console.log("🧠 STATUS:", p.id, p.status, p.text);
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
