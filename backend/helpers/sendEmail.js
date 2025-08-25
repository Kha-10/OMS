const nodemailer = require("nodemailer");

const ejs = require("ejs");

// const sendEmail = async ({ viewFilename, data, from, to }) => {
//   const transport = nodemailer.createTransport({
//     host: process.env.CUSTOM_HOST,
//     port: process.env.CUSTOM_PORT,
//     auth: {
//       user: process.env.CUSTOM_USER,
//       pass: process.env.CUSTOM_PASS,
//     },
//   });

//   const dataString = await ejs.renderFile(
//     "./views/" + viewFilename + ".ejs",
//     data
//   );
//   try {
//     const info = await transport.sendMail({
//       from,
//       to,
//       subject: "Verify Your Email",
//       text: `Your verification code is ${data}`,
//       html: dataString,
//     });
//     console.log("Message sent: %s", dataString);
//   } catch (error) {
//     throw new Error(error);
//   }
// };

const Mailjet = require("node-mailjet");

const mailjet = Mailjet.apiConnect(process.env.MJ_APIKEY_PUBLIC, process.env.MJ_APIKEY_PRIVATE);

const sendTemplateEmail = async (toEmail, toName, templateId, variables) => {
  console.log("variables",variables);
  try {
    const request = await mailjet.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: { Email: "august810.a@gmail.com", Name: "Nexora" },
          To: [{ Email: toEmail, Name: toName }],
          TemplateID: templateId,
          TemplateLanguage: true,
          Subject: "Your Verification Email",
          Variables: variables,
        },
      ],
    });
    return request.body;
  } catch (err) {
    console.error("Mailjet error:", err);
    throw err;
  }
};

module.exports = sendTemplateEmail;
