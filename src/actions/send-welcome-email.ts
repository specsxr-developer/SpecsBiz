
'use server';

import nodemailer from 'nodemailer';

/**
 * @fileOverview Server Action to send an official welcome email to new users.
 * Uses Gmail SMTP with App Passwords.
 */

export async function sendWelcomeEmail(toEmail: string) {
  // Using SpecsXR official email credentials from environment variables
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER || 'specsxr@gmail.com',
      pass: process.env.GMAIL_APP_PASSWORD, // Must be an App Password, not regular password
    },
  });

  const mailOptions = {
    from: '"SpecsBiz Official" <specsxr@gmail.com>',
    to: toEmail,
    subject: 'Welcome to SpecsBiz | Your Smart Business Partner 🚀',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0f7f7; padding: 0; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); background-color: #ffffff;">
        <div style="background-color: #191970; padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 32px; letter-spacing: -1px; text-transform: uppercase;">SpecsBiz</h1>
          <p style="color: #008080; margin: 5px 0 0 0; font-weight: bold; font-size: 12px; letter-spacing: 3px; text-transform: uppercase;">Smart Business Manager</p>
        </div>
        
        <div style="padding: 40px 30px; color: #333333; line-height: 1.6;">
          <h2 style="color: #191970; font-size: 20px; margin-bottom: 20px;">নমস্কার স্যার,</h2>
          <p style="font-size: 15px;">আপনার ডিজিটাল ব্যবসা যাত্রায় স্বাগতম! <strong>SpecsBiz</strong>-কে আপনার ব্যবসার সঙ্গী হিসেবে বেছে নেওয়ার জন্য আমরা আনন্দিত।</p>
          
          <p style="font-size: 15px;">আপনার সুরক্ষিত ক্লাউড একাউন্টটি এখন পুরোপুরি সক্রিয়। এখন থেকে আপনি আপনার দোকানের প্রতিটি মাল, কাস্টমার এবং বিক্রয়ের হিসাব পৃথিবীর যেকোনো প্রান্ত থেকে নিয়ন্ত্রণ করতে পারবেন।</p>
          
          <div style="background-color: #f0ffff; border-left: 4px solid #008080; padding: 20px; margin: 30px 0; border-radius: 0 15px 15px 0;">
            <p style="margin: 0; font-size: 14px; color: #191970;"><strong>আপনার জন্য আমাদের টিপস:</strong></p>
            <ul style="margin: 10px 0 0 0; padding-left: 20px; font-size: 13px; color: #555;">
              <li>প্রথমেই ইনভেন্টরি পেজে গিয়ে আপনার মালগুলো যোগ করুন।</li>
              <li>কাস্টমার পেজ থেকে বাকির হিসাব শুরু করুন।</li>
              <li>আপনার ব্যক্তিগত শপ ওয়েবসাইটটি সোশ্যাল মিডিয়ায় শেয়ার করুন।</li>
            </ul>
          </div>
          
          <p style="font-size: 15px;">যেকোনো প্রয়োজনে আমাদের অফিশিয়াল ইমেইলে সরাসরি যোগাযোগ করতে পারেন। আপনার ব্যবসার উত্তরোত্তর সমৃদ্ধি কামনা করছি।</p>
          
          <p style="margin-top: 40px; font-size: 14px; color: #777;">শুভেচ্ছান্তে,<br><strong style="color: #191970;">SpecsXR Team</strong></p>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
          <p style="margin: 0; font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 1px;">&copy; 2024 SpecsBiz by SpecsXR. All rights reserved.</p>
          <p style="margin: 5px 0 0 0; font-size: 10px; color: #bbb;">If you didn't create an account, please ignore this email.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error: any) {
    console.error("Email Error:", error.message);
    return { success: false, error: error.message };
  }
}
