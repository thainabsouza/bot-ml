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

  const day = brasilDate.getDay(); // 0 domingo, 6 sábado
  const hour = brasilDate.getHours();

  const isWeekend = day === 0 || day === 6;

  // segunda a sexta
  const isWeekday = !isWeekend;

  // horário bloqueado: 08 até 17:59
  const isBlockedHours = hour >= 8 && hour < 18;

  // regra final:
  // libera sempre no fim de semana
  // libera fora do horário bloqueado durante semana
  const allowed = isWeekend || (isWeekday && !isBlockedHours);

  console.log({
    hour,
    day,
    isWeekend,
    isBlockedHours,
    allowed,
  });

  return allowed;
}

module.exports = { isHorarioPermitido };
