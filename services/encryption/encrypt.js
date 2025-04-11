const crypto = require('crypto');
const bcrypt = require('bcryptjs');

function generateToken() {
    return crypto.randomBytes(20).toString('hex');
}

async function hashPassword(password) {
    const times = 10; // Nombre de fois que le mot de passe est haché
    const hashed = await bcrypt.hash(password, times);
    return hashed;
}

async function checkPassword(password, hashed) {
    const verify = await bcrypt.compare(password, hashed);
    return verify;
}

module.exports = { generateToken, hashPassword, checkPassword };