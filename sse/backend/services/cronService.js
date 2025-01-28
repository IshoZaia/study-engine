const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Function to send emails with personalized links
async function sendEmail({ to, subject, html }) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    };

    console.log(`Sending email to: ${to}`); // Log for debugging

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`); // Success log
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error.message);
    throw error;
  }
}

module.exports = sendEmail;
