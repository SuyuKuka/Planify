const crypto = require('crypto');
const bcrypt = require('bcryptjs');

function generateToken() {
  return crypto.randomBytes(16).toString('hex');
}

async function hash(content) {
    const times = 10; // Nombre de fois que le mot de passe est haché
    const hashed = await bcrypt.hash(content, times);
    return hashed;
}

async function check(content, hashed) {
    const verify = await bcrypt.compare(content, hashed);
    return verify;
}

module.exports = { generateToken, hash, check };