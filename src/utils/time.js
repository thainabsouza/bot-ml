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
    return true;
  }

  const brasilDate = new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "America/Sao_Paulo",
    }),
  );

  const day = brasilDate.getDay();
  const hour = brasilDate.getHours();

  const mm = String(brasilDate.getMonth() + 1).padStart(2, "0");
  const dd = String(brasilDate.getDate()).padStart(2, "0");

  const mmdd = `${mm}-${dd}`;

  const isFeriado = feriadosBR.includes(mmdd);
  const isWeekend = day === 0 || day === 6;
  const isBusinessHours = hour >= 8 && hour < 18;

  const allowed = !isWeekend && !isFeriado && isBusinessHours;

  console.log({
    hour,
    day,
    mmdd,
    allowed,
  });

  return allowed;
}

module.exports = { isHorarioPermitido };
