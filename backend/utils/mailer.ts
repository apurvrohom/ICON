import nodemailer from 'nodemailer';

const createTransporter = () => {
  // If SMTP configs are provided, create real transporter
  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  ) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return null;
};

export const sendOTPEmail = async (email: string, otp: string): Promise<void> => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"ICON Platform" <no-reply@icon-collab.com>`,
    to: email,
    subject: 'Verify Your Email - ICON OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #4F46E5; text-align: center;">Welcome to ICON!</h2>
        <p>Thank you for registering. Please use the following One-Time Password (OTP) to complete your verification. This OTP is valid for 10 minutes.</p>
        <div style="font-size: 24px; font-weight: bold; letter-spacing: 4px; text-align: center; margin: 30px 0; padding: 15px; background: #F3F4F6; border-radius: 6px; color: #1F2937;">
          ${otp}
        </div>
        <p>If you did not request this, you can safely ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;" />
        <p style="font-size: 12px; color: #9CA3AF; text-align: center;">ICON Collaboration Platform</p>
      </div>
    `,
  };

  if (transporter) {
    await transporter.sendMail(mailOptions);
    console.log(`Verification OTP email sent to ${email}`);
  } else {
    console.log('\n----------------------------------------');
    console.log(`[SMTP Not Configured] Verification Email to: ${email}`);
    console.log(`Verification OTP: ${otp}`);
    console.log('----------------------------------------\n');
  }
};

export const sendResetPasswordEmail = async (email: string, resetUrl: string): Promise<void> => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"ICON Platform" <no-reply@icon-collab.com>`,
    to: email,
    subject: 'Reset Password Request - ICON',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #4F46E5; text-align: center;">Reset Your Password</h2>
        <p>You requested to reset your password. Click the button below to set a new password. This link is valid for 1 hour.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" target="_blank" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p>If the button doesn't work, copy and paste this URL into your browser:</p>
        <p style="word-break: break-all; color: #2563EB;">${resetUrl}</p>
        <p>If you did not request this reset, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;" />
        <p style="font-size: 12px; color: #9CA3AF; text-align: center;">ICON Collaboration Platform</p>
      </div>
    `,
  };

  if (transporter) {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
  } else {
    console.log('\n----------------------------------------');
    console.log(`[SMTP Not Configured] Password Reset link to: ${email}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log('----------------------------------------\n');
  }
};
