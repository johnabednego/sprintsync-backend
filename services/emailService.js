const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});


exports.sendOTP = async (to, otp) => {
  const platformName = 'SprintSync'; 

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background: #f7f7f7; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
      <h2 style="color: #2c3e50;">Welcome to ${platformName}</h2>
      <p style="font-size: 16px; color: #333;">Hello,</p>
      <p style="font-size: 16px; color: #333;">
        Your One-Time Password (OTP) is:
        <strong style="display: block; font-size: 24px; color: #27ae60; margin: 10px 0;">${otp}</strong>
      </p>
      <p style="font-size: 14px; color: #666;">
        This code will expire in 10 minutes. If you did not request this, please ignore this email.
      </p>
      <hr style="margin: 30px 0;">
      <p style="font-size: 12px; color: #999; text-align: center;">
        &copy; ${new Date().getFullYear()} ${platformName}. All rights reserved.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: `${platformName} - Your OTP Code`,
    text: `Your OTP is ${otp}. It expires in 10 minutes.`,
    html
  });
};
