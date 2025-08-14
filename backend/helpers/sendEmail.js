const nodemailer = require("nodemailer");

const ejs = require("ejs");

const sendEmail = async ({ viewFilename, data, from, to }) => {
  const transport = nodemailer.createTransport({
    host: process.env.CUSTOM_HOST,
    port: process.env.CUSTOM_PORT,
    auth: {
      user: process.env.CUSTOM_USER,
      pass: process.env.CUSTOM_PASS,
    },
  });

  const dataString = await ejs.renderFile(
    "./views/" + viewFilename + ".ejs",
    data
  );
  try {
    const info = await transport.sendMail({
      from,
      to,
      subject: "Verify Your Email",
      text: `Your verification code is ${data}`,
      html: dataString,
    });
    console.log("Message sent: %s", dataString);
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = sendEmail;
