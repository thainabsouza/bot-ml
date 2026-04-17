const axios = require("axios");
const qs = require("querystring");
const fs = require("fs");
const Conta = require("../models/conta");

const TOKEN_PATH = "token.json";

/**
 * 🔐 Troca o CODE pelo access_token (PRIMEIRO LOGIN)
 */
async function trocarCodePorToken(code) {
  try {
    // 🔁 Trocar code por token
    const response = await axios.post(
      "https://api.mercadolibre.com/oauth/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        code: code,
        redirect_uri: process.env.REDIRECT_URI,
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      },
    );

    const data = response.data;

    console.log("TOKEN RECEBIDO:", data);

    // 🔥 Buscar dados do usuário
    const user = await axios.get("https://api.mercadolibre.com/users/me", {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
      },
    });

    console.log("USUÁRIO:", user.data);

    // 🔥 Salvar no Mongo
    await Conta.findOneAndUpdate(
      { "mercadoLivre.userId": user.data.id },
      {
        nome: user.data.nickname,
        mercadoLivre: {
          userId: user.data.id,
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
        },
      },
      { upsert: true, new: true },
    );

    console.log("✅ Conta salva com sucesso!");
  } catch (error) {
    console.error(
      "❌ Erro ao trocar code por token:",
      error.response?.data || error.message,
    );
    throw error;
  }
}

module.exports = { trocarCodePorToken };
/**
 * 🔄 Atualiza token expirado
 */
async function refreshAccessToken() {
  try {
    const data = JSON.parse(fs.readFileSync(TOKEN_PATH));

    const res = await axios.post(
      "https://api.mercadolibre.com/oauth/token",
      qs.stringify({
        grant_type: "refresh_token",
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        refresh_token: data.refreshToken,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    const newData = {
      accessToken: res.data.access_token,
      refreshToken: res.data.refresh_token,
    };

    fs.writeFileSync(TOKEN_PATH, JSON.stringify(newData));

    console.log("🔄 Token atualizado");

    return newData.accessToken;
  } catch (err) {
    console.error(
      "❌ ERRO AO ATUALIZAR TOKEN:",
      err.response?.data || err.message,
    );
    throw err;
  }
}

/**
 * 📥 Pega token do arquivo
 */
async function getAccessToken() {
  try {
    const data = JSON.parse(fs.readFileSync(TOKEN_PATH));
    return data.accessToken;
  } catch {
    console.log("⚠️ Token não encontrado. Precisa autenticar.");
    return null;
  }
}

/**
 * 🚀 Função principal (usa em todo o projeto)
 */
async function getValidToken(conta) {
  try {
    await axios.get("https://api.mercadolibre.com/users/me", {
      headers: {
        Authorization: `Bearer ${conta.mercadoLivre.accessToken}`,
      },
    });

    return conta.mercadoLivre.accessToken;
  } catch (err) {
    if (err.response?.status === 401) {
      console.log("🔄 Token expirado, renovando...");

      const res = await axios.post(
        "https://api.mercadolibre.com/oauth/token",
        qs.stringify({
          grant_type: "refresh_token",
          client_id: process.env.CLIENT_ID,
          client_secret: process.env.CLIENT_SECRET,
          refresh_token: conta.mercadoLivre.refreshToken,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      conta.mercadoLivre.accessToken = res.data.access_token;
      conta.mercadoLivre.refreshToken = res.data.refresh_token;

      await conta.save();

      return conta.mercadoLivre.accessToken;
    }

    throw err;
  }
}

async function pegarUsuario() {
  const token = await getAccessToken(); // ✅ correto

  const res = await axios.get("https://api.mercadolibre.com/users/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log(res.data);
}

//pegarUsuario();

module.exports = {
  trocarCodePorToken,
  getAccessToken,
  refreshAccessToken,
  getValidToken,
};
