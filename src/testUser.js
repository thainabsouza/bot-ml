const axios = require("axios");
const { getAccessToken } = require("./services/auth");

async function pegarUsuario() {
  const token = await getAccessToken();

  const res = await axios.get("https://api.mercadolibre.com/users/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log(res.data);
}

//pegarUsuario();
