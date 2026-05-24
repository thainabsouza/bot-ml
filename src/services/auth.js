const axios = require("axios");
const qs = require("querystring");
const Conta = require("../models/conta");

require("dotenv").config();

const ML_URL = "https://api.mercadolibre.com";

/**
 * 🔐 LOGIN INICIAL
 */
async function trocarCodePorToken(code) {
  try {
    const response = await axios.post(
      `${ML_URL}/oauth/token`,
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

    console.log("✅ TOKEN GERADO");
    console.log("ACCESS:", data.access_token);
    console.log("REFRESH:", data.refresh_token);
    console.log("EXPIRES:", data.expires_in);

    const userResponse = await axios.get(`${ML_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
      },
    });

    const user = userResponse.data;

    console.log("👤 Usuário:", user.nickname);

    await Conta.findOneAndUpdate(
      { "mercadoLivre.userId": user.id },
      {
        $set: {
          nome: user.nickname,
          "mercadoLivre.userId": user.id,
          "mercadoLivre.accessToken": data.access_token,
          "mercadoLivre.expiresAt": new Date(
            Date.now() + data.expires_in * 1000,
          ),
        },
      },
      { upsert: true, new: true },
    );

    if (data.refresh_token) {
      await Conta.updateOne(
        { "mercadoLivre.userId": user.id },
        {
          $set: {
            "mercadoLivre.refreshToken":
              data.refresh_token || conta?.mercadoLivre?.refreshToken || null,
          },
        },
      );
    }

    console.log("✅ Conta salva no Mongo");

    return data;
  } catch (err) {
    console.error("❌ Erro OAuth:", err.response?.data || err.message);
    throw err;
  }
}

/**
 * 🔄 RENOVA ACCESS TOKEN
 */
async function refreshAccessToken(conta) {
  try {
    console.log("🔄 Renovando token:", conta.nome);

    const refreshToken = conta?.mercadoLivre?.refreshToken;

    if (!refreshToken) {
      throw new Error("Conta sem refresh token");
    }

    const response = await axios.post(
      `${ML_URL}/oauth/token`,
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

    const data = response.data;

    conta.mercadoLivre.accessToken = data.access_token;

    if (data.refresh_token) {
      conta.mercadoLivre.refreshToken = data.refresh_token;
    }

    conta.mercadoLivre.expiresAt = new Date(
      Date.now() + data.expires_in * 1000,
    );

    await conta.save();

    console.log("✅ Token renovado");

    return conta.mercadoLivre.accessToken;
  } catch (err) {
    console.log("❌ Erro refresh token:", err.response?.data || err.message);

    // 👇 ADICIONA ISSO
    if (err.response?.status === 401 || err.response?.status === 400) {
      console.log("🔴 Refresh token inválido → conta precisa relogar");

      await Conta.updateOne(
        { _id: conta._id },
        {
          $unset: {
            "mercadoLivre.accessToken": "",
            "mercadoLivre.refreshToken": "",
          },
        },
      );
    }

    throw err;
  }
}

/**
 * 🔑 RETORNA TOKEN VÁLIDO
 */
async function getValidToken(conta) {
  try {
    if (!conta?.mercadoLivre?.accessToken) {
      throw new Error("Conta sem access token");
    }

    const expiresAt = new Date(conta.mercadoLivre.expiresAt);

    const isExpired = Date.now() >= expiresAt.getTime() - 60000;

    if (!isExpired) {
      return conta.mercadoLivre.accessToken;
    }

    console.log("⛔ Token expirado:", conta.nome);

    return await refreshAccessToken(conta);
  } catch (err) {
    console.error("❌ Erro getValidToken:", err.message);
    throw err;
  }
}

module.exports = {
  trocarCodePorToken,
  refreshAccessToken,
  getValidToken,
};
