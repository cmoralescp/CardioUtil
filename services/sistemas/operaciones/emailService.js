require("dotenv").config();
const nodemailer = require('nodemailer');
const emailService = {
  getTransport: () => {
    return {
      host: "smtp.office365.com", // Servidor SMTP de Microsoft
      port: 587, // Puerto estándar para STARTTLS
      secure: false, // true para puerto 465, false para otros
      auth: {
        user: process.env.OFFICE365SERVICE_SENDER, // Tu cuenta de Office 365
        pass: process.env.OFFICE365SERVICE_PASSWORD, // Tu contraseña
      },
      tls: {
        ciphers: "SSLv3", // Necesario para compatibilidad con O365
        rejectUnauthorized: false,
      },
    };
  },
  getMailOptions: (to, subject, text) => {
    return {
      from: '"Sistemas Cardio Perfusion" <soporte@cardioperfusion.com>',
      to,
      subject,
      text,
    };
  },
  send: async (to, subject, text, attachments = null) => {
    try {
      const transporter = nodemailer.createTransport(
        emailService.getTransport()
      );
      let mailOptions = emailService.getMailOptions(to, subject, text);
      if (attachments) {
        mailOptions.attachments = attachments;
      }
      await transporter.sendMail(mailOptions);
    } catch (error) {
        console.log(error);
        
    }
  },
};

module.exports = emailService;
