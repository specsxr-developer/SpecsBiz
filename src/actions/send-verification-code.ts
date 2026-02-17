
'use server';

import nodemailer from 'nodemailer';

/**
 * @fileOverview Server Action to send a 6-digit verification code to users during registration.
 */

export async function sendVerificationCode(toEmail: string, code: string) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER || 'specsxr@gmail.com',
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const mailOptions = {
    from: '"SpecsBiz Security" <specsxr@gmail.com>',
    to: toEmail,
    subject: `${code} is your SpecsBiz Verification Code 🛡️`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: auto; border: 1px solid #e0f7f7; padding: 0; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); background-color: #ffffff;">
        <div style="background-color: #191970; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">SpecsBiz Security</h1>
        </div>
        
        <div style="padding: 40px 30px; color: #333333; line-height: 1.6; text-align: center;">
          <h2 style="color: #191970; font-size: 20px; margin-bottom: 10px;">নমস্কার স্যার,</h2>
          <p style="font-size: 15px;">আপনার SpecsBiz একাউন্টটি সুরক্ষিতভাবে তৈরি করার জন্য নিচের ভেরিফিকেশন কোডটি ব্যবহার করুন:</p>
          
          <div style="background-color: #f0ffff; border: 2px dashed #008080; padding: 20px; margin: 30px 0; border-radius: 15px;">
            <h1 style="margin: 0; font-size: 42px; color: #008080; letter-spacing: 10px; font-family: monospace;">${code}</h1>
          </div>
          
          <p style="font-size: 13px; color: #777;">এই কোডটি ১০ মিনিটের জন্য কার্যকর থাকবে। নিরাপত্তা রক্ষার্থে কোডটি কাউকে শেয়ার করবেন না।</p>
          
          <p style="margin-top: 40px; font-size: 14px; color: #999;">ধন্যবাদ,<br><strong style="color: #191970;">SpecsXR Security Team</strong></p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error: any) {
    console.error("OTP Email Error:", error.message);
    return { success: false, error: error.message };
  }
}
