const axios = require("axios");
const qs = require("querystring");
const Conta = require("../models/conta");

/**
 * 🔐 PRIMEIRO LOGIN
 */
async function trocarCodePorToken(code) {
  try {
    const response = await axios.post(
      "https://api.mercadolibre.com/oauth/token",
      qs.stringify({
        grant_type: "authorization_code",
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        code,
        redirect_uri: process.env.REDIRECT_URI,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    const data = response.data;

    console.log("✅ TOKEN RECEBIDO");

    // 👤 Busca usuário
    const userResponse = await axios.get(
      "https://api.mercadolibre.com/users/me",
      {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
      },
    );

    const user = userResponse.data;

    console.log("👤 USUÁRIO:", user.nickname);

    // 💾 Salva conta
    await Conta.findOneAndUpdate(
      {
        "mercadoLivre.userId": user.id,
      },
      {
        nome: user.nickname,

        mercadoLivre: {
          userId: user.id,
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
        },
      },
      {
        upsert: true,
        new: true,
      },
    );

    console.log("✅ Conta salva com sucesso");
  } catch (error) {
    console.error(
      "❌ Erro ao trocar code por token:",
      error.response?.data || error.message,
    );

    throw error;
  }
}

/**
 * 🔑 Retorna token válido
 */
async function getValidToken(conta) {
  try {
    const accessToken = conta?.mercadoLivre?.accessToken;

    if (!accessToken) {
      throw new Error("❌ Access token ausente");
    }

    // 🔎 testa token atual
    await axios.get("https://api.mercadolibre.com/users/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return accessToken;
  } catch (err) {
    const status = err.response?.status;

    // 🔄 token expirado
    if (status === 401) {
      console.log("🔄 Access token expirado");

      const refreshToken = conta?.mercadoLivre?.refreshToken;

      if (!refreshToken) {
        throw new Error("❌ Refresh token ausente. Faça login novamente.");
      }

      try {
        console.log("🔑 Atualizando token...");

        const response = await axios.post(
          "https://api.mercadolibre.com/oauth/token",
          qs.stringify({
            grant_type: "refresh_token",
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            refresh_token: refreshToken,
          }),
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          },
        );

        // 💾 salva novos tokens
        conta.mercadoLivre.accessToken = response.data.access_token;

        if (response.data.refresh_token) {
          conta.mercadoLivre.refreshToken = response.data.refresh_token;
        }

        await conta.save();

        console.log("✅ Token atualizado");

        return conta.mercadoLivre.accessToken;
      } catch (refreshError) {
        console.error(
          "❌ Erro ao atualizar token:",
          refreshError.response?.data || refreshError.message,
        );

        throw refreshError;
      }
    }

    console.error("❌ Erro getValidToken:", err.response?.data || err.message);

    throw err;
  }
}

module.exports = {
  trocarCodePorToken,
  getValidToken,
};
