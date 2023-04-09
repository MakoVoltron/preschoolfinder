const nodemailer = require("nodemailer");

const sendEmail = async (email, subject, text, html) => {
    try {
        const transporter = nodemailer.createTransport({
            // host:
            service: 'gmail',
            // port:
            // secure:
            auth: {
                user: process.env.MAIL_USERNAME,
                pass: process.env.MAIL_PASSWORD
            }
        });

        await transporter.sendMail({
            from: 'Preschool Finder <hello.preschoolfinder@gmail.com>',
            to: email,
            subject: subject,
            text: text,
            html: html
        });
        console.log("Email sent succesfully");
    } catch (error) {
        console.log("email not sent :(")
        console.log(error);
    }
};

module.exports = sendEmail;