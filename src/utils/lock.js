const Lock = require("../models/Lock");

async function acquireLock(name) {
  try {
    await Lock.create({ name, lockedAt: new Date() });
    return true;
  } catch (err) {
    return false;
  }
}

async function releaseLock(name) {
  await Lock.deleteOne({ name });
}

module.exports = { acquireLock, releaseLock }; // ✅ ISSO É O MAIS IMPORTANTE
