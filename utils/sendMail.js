// const nodemailer = require("nodemailer");
const postmark = require('postmark');

// Send an email
const client = new postmark.ServerClient(process.env.POSTMARK_TOKEN)

const sendEmail = async (email, subject, TextBody, HtmlBody) => {
    try {
        await client.sendEmail({
            "From": "hello@preschoolfinder.net",
            "To": email,
            "Subject": subject,
            "TextBody": TextBody,
            "HtmlBody": HtmlBody,
            "MessageStream": "outbound"
    
        });
        console.log("Email sent succesfully");
    } catch (error) {
        console.log("email not sent :(")
        console.log(error);
    }
    
}


module.exports = sendEmail;