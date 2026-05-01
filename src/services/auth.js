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

    console.log("TOKEN DATA:", data);

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

    await Conta.findOneAndUpdate(
      { "mercadoLivre.userId": user.id },
      {
        nome: user.nickname,
        mercadoLivre: {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          userId: user.id,
        },
      },
      { upsert: true, new: true },
    );

    if (data.refresh_token) {
      await Conta.updateOne(
        { "mercadoLivre.userId": user.id },
        {
          $set: {
            "mercadoLivre.refreshToken": data.refresh_token,
          },
        },
      );
    }

    console.log("✅ Conta salva com sucesso");
  } catch (error) {
    console.error(
      "❌ Erro ao trocar code por token:",
      error.response?.data || error.message,
    );

    throw error;
  }
} // 👈 FECHOU A FUNÇÃO AQUI

/**
 * 🔑 Retorna token válido
 */
async function getValidToken(conta) {
  try {
    const accessToken = conta?.mercadoLivre?.accessToken;

    if (!accessToken) {
      throw new Error("❌ Access token ausente");
    }

    await axios.get("https://api.mercadolibre.com/users/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return accessToken;
  } catch (err) {
    if (err.response?.status === 401) {
      console.log("🔄 Access token expirado");

      const refreshToken = conta?.mercadoLivre?.refreshToken;

      if (!refreshToken) {
        console.log("⚠️ Conta sem refresh token → precisa relogar");

        throw new Error("Conta sem refresh token");
      }

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

      await Conta.updateOne(
        { _id: conta._id },
        {
          $set: {
            "mercadoLivre.accessToken": response.data.access_token,
            "mercadoLivre.refreshToken":
              response.data.refresh_token || refreshToken,
          },
        },
      );

      conta.mercadoLivre.accessToken = response.data.access_token;

      if (response.data.refresh_token) {
        conta.mercadoLivre.refreshToken = response.data.refresh_token;
      }

      await conta.save();

      return conta.mercadoLivre.accessToken;
    }

    throw err;
  }
}

// ✅ EXPORT FORA DA FUNÇÃO
module.exports = {
  trocarCodePorToken,
  getValidToken,
};
