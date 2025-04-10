const nodemailer = require('nodemailer');

let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: 'programmationwebprojet@gmail.com',
        pass: 'xzxk lzqe yrmu dhhn'
    },
    tls: {
        rejectUnauthorized: false
    }
});

module.exports = { transporter };
