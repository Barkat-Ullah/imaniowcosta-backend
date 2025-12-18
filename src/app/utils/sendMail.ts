import nodemailer from 'nodemailer';

export const generateOtpEmail = (otp: string) => {
  return `
      <div style="font-family: Arial, sans-serif; color: #333; padding: 30px; background: linear-gradient(135deg, #6c63ff, #3f51b5); border-radius: 8px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px;">
            <h2 style="color: #ffffff; font-size: 28px; text-align: center; margin-bottom: 20px;">
                <span style="color: #ffeb3b;">OTP Verification</span>
            </h2>
            <p style="font-size: 16px; color: #333; line-height: 1.5; text-align: center;">
                Your OTP code is below.
            </p>
            <p style="font-size: 32px; font-weight: bold; color: #ff4081; text-align: center; margin: 20px 0;">
                ${otp}
            </p>
            <div style="text-align: center; margin-bottom: 20px;">
                <p style="font-size: 14px; color: #555; margin-bottom: 10px;">
                    This OTP will expire in <strong>10 minutes</strong>. If you did not request this, please ignore this email.
                </p>
                <p style="font-size: 14px; color: #555; margin-bottom: 10px;">
                    If you need assistance, feel free to contact us.
                </p>
            </div>
            <div style="text-align: center; margin-top: 30px;">
                <p style="font-size: 12px; color: #999; text-align: center;">
                    Best Regards,<br/>
                    <span style="font-weight: bold; color: #3f51b5;">Developer Team</span><br/>
                </p>
            </div>
        </div>
      </div>`;
};

export const inviteUserEmail = (
  fullName: string,
  email: string,
  password: string,
) => {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; padding: 40px 20px; background-color: #f4f6f9;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);">
        
        <div style="background: linear-gradient(135deg, #0d47a1, #1565c0); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 26px; font-weight: 600; margin: 0; letter-spacing: 0.5px;">
            Welcome to The Caribbean Note!
          </h1>
        </div>
        
        <div style="padding: 40px 30px;">
          <p style="font-size: 16px; color: #4a5568; line-height: 1.7; margin: 0 0 20px 0;">
            Hello <strong style="color: #0d47a1;">${fullName}</strong>,
          </p>

          <p style="font-size: 16px; color: #4a5568; line-height: 1.7; margin: 0 0 30px 0;">
            You have been added to the <strong>Auto Dealer</strong> system. You can now log in using the credentials provided below.
          </p>

          <div style="background: #f1f5f9; border-left: 4px solid #0d47a1; padding: 20px; margin: 25px 0; border-radius: 4px;">
            <p style="font-size: 15px; color: #0d47a1; font-weight: 600; margin: 0 0 15px 0;">
              Your Login Credentials:
            </p>
            <p style="font-size: 14px; color: #4a5568; margin: 8px 0;">
              <strong>Email:</strong> ${email}
            </p>
            <p style="font-size: 14px; color: #4a5568; margin: 8px 0;">
              <strong>Password:</strong> ${password}
            </p>
          </div>

          <p style="font-size: 15px; color: #4a5568; line-height: 1.7; margin: 25px 0 0 0;">
            If you have any questions or need help accessing your account, please feel free to contact our support team.
          </p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="font-size: 14px; color: #718096; margin: 0 0 8px 0;">
            Regards,
          </p>
          <p style="font-size: 15px; color: #0d47a1; font-weight: 600; margin: 0 0 20px 0;">
            Auto Dealer Team
          </p>
          <p style="font-size: 12px; color: #a0aec0; margin: 0; line-height: 1.6;">
            © ${new Date().getFullYear()} Auto Dealer. All rights reserved.
          </p>
        </div>
        
      </div>
    </div>
  `;
};

const emailSender = async (to: string, html: string, subject: string) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 2525,
      secure: false,
      auth: {
        user: '88803c001@smtp-brevo.com',
        pass: 'OzqM8PBhVxbNYEUt',
      },
    });
    const mailOptions = {
      from: '<akonhasan680@gmail.com>',
      to,
      subject,
      text: html.replace(/<[^>]+>/g, ''),
      html,
    };
    // Send the email
    const info = await transporter.sendMail(mailOptions);
    return info.messageId;
  } catch (error) {
    throw new Error('Failed to send email. Please try again later.');
  }
};
export default emailSender;
