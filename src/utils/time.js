const feriadosBR = [
  "01-01",
  "04-21",
  "05-01",
  "09-07",
  "10-12",
  "11-02",
  "11-15",
  "12-25",
];

function isHorarioPermitido() {
  if (process.env.BOT_FORCE_RUN === "true") {
    console.log("⚡ FORCE RUN ATIVADO");
    return true;
  }

  const now = new Date();

  const hora = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }),
  );

  const day = hora.getDay();
  const hour = hora.getHours();

  const mmdd = hora
    .toLocaleDateString("en-CA", {
      timeZone: "America/Sao_Paulo",
    })
    .slice(5);

  const isFeriado = feriadosBR.includes(mmdd);
  const isWeekend = day === 0 || day === 6;
  const isWeekday = day >= 1 && day <= 5;

  const isBusinessHours = hour >= 8 && hour < 18;

  const isBlocked = !isFeriado && !isWeekend && isBusinessHours;

  const allowed = !isBlocked;

  console.log({
    day,
    hour,
    mmdd,
    isFeriado,
    isWeekend,
    isBusinessHours,
    allowed,
    force: process.env.BOT_FORCE_RUN,
  });

  return allowed;
}

module.exports = { isHorarioPermitido };
