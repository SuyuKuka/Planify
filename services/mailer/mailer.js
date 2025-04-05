const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: 'programmationwebprojet@gmail.com',
        pass: 'xzxk lzqe yrmu dhhn' 
    }
});