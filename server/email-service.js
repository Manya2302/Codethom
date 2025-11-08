import nodemailer from 'nodemailer';

const smtpPort = parseInt(process.env.SMTP_PORT || '587');
const isSecure = smtpPort === 465;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: isSecure,
  requireTLS: !isSecure && smtpPort === 587, // Gmail requires TLS on port 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false, // Allow self-signed certificates if needed
  },
});

// Verify transporter configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP configuration error:', error.message);
    console.error('Please check your SMTP credentials in .env file');
  } else {
    console.log('✅ SMTP server is ready to send emails');
  }
});

export async function sendOTPEmail(email, otpCode, type = 'signup') {
  const subject = type === 'signup' 
    ? 'Verify Your Email - Real Estate Platform'
    : 'Password Reset Code - Real Estate Platform';
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #667eea; margin: 20px 0; border-radius: 8px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .note { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏡 Real Estate Platform</h1>
        </div>
        <div class="content">
          <h2>Your Verification Code</h2>
          <p>Hello,</p>
          <p>Thank you for ${type === 'signup' ? 'signing up' : 'requesting a password reset'} with our Real Estate Platform. Please use the following verification code to complete your ${type === 'signup' ? 'registration' : 'password reset'}:</p>
          
          <div class="otp-box">${otpCode}</div>
          
          <div class="note">
            <strong>⏰ Important:</strong> This code will expire in 10 minutes.
          </div>
          
          <p>If you didn't request this code, please ignore this email and your account will remain secure.</p>
          
          <p>Best regards,<br>Real Estate Platform Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.error('❌ SMTP configuration missing. Please check your .env file.');
      return false;
    }

    await transporter.sendMail({
      from: `"Real Estate Platform" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: email,
      subject: subject,
      html: htmlContent,
    });
    console.log(`✅ OTP email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending OTP email:', error.message);
    if (error.response) {
      console.error('SMTP Response:', error.response);
    }
    if (error.code) {
      console.error('Error Code:', error.code);
    }
    return false;
  }
}

export async function sendReraConfirmationEmail(email, name, reraId, role) {
  const subject = 'RERA Verification Successful - TerriSmart Platform';
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .success-box { background: #d4edda; border: 2px solid #28a745; padding: 20px; text-align: center; color: #155724; margin: 20px 0; border-radius: 8px; }
        .rera-info { background: white; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏡 TerriSmart Platform</h1>
        </div>
        <div class="content">
          <h2>RERA Verification Successful!</h2>
          <p>Dear ${name},</p>
          <p>Congratulations! Your RERA credentials have been successfully verified.</p>
          
          <div class="success-box">
            <h3 style="margin: 0;">✓ Verification Complete</h3>
          </div>
          
          <div class="rera-info">
            <p><strong>Role:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)}</p>
            <p><strong>RERA ID:</strong> ${reraId}</p>
            <p><strong>Status:</strong> Verified</p>
          </div>
          
          <p>You can now access all premium features available for verified ${role}s on the TerriSmart platform.</p>
          
          <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          
          <p>Best regards,<br>TerriSmart Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"TerriSmart Platform" <${process.env.SMTP_FROM_EMAIL}>`,
      to: email,
      subject: subject,
      html: htmlContent,
    });
    console.log(`RERA confirmation email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending RERA confirmation email:', error);
    return false;
  }
}

export async function sendAccountApprovalEmail(email, name, role, reraId) {
  const subject = 'Account Approved - TerriSmart Platform';
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .header p { margin: 10px 0 0; opacity: 0.95; font-size: 14px; }
        .content { padding: 40px 30px; background: white; }
        .success-badge { background: #d4edda; border: 2px solid #28a745; padding: 20px; text-align: center; border-radius: 8px; margin: 25px 0; }
        .success-badge h2 { margin: 0; color: #155724; font-size: 24px; }
        .success-badge p { margin: 8px 0 0; color: #155724; font-size: 14px; }
        .info-box { background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 4px; }
        .info-box p { margin: 8px 0; color: #495057; }
        .info-box strong { color: #212529; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; margin: 25px 0; font-weight: 600; text-align: center; }
        .footer { background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #dee2e6; }
        .footer p { margin: 5px 0; color: #6c757d; font-size: 13px; }
        .divider { height: 1px; background: #dee2e6; margin: 25px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏡 TerriSmart</h1>
          <p>Smart Territory Management Platform</p>
        </div>
        <div class="content">
          <h2 style="color: #212529; margin-top: 0;">Welcome Aboard, ${name}!</h2>
          <p style="color: #495057; font-size: 15px;">We're excited to inform you that your account has been approved.</p>
          
          <div class="success-badge">
            <h2>✓ Account Verified</h2>
            <p>Your RERA credentials have been verified by our team</p>
          </div>
          
          <div class="info-box">
            <p><strong>Account Details:</strong></p>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Role:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)}</p>
            <p><strong>RERA ID:</strong> ${reraId}</p>
            <p><strong>Status:</strong> <span style="color: #28a745; font-weight: 600;">Active</span></p>
          </div>
          
          <p style="color: #495057;">You can now access your account and enjoy all the features available for verified ${role}s on the TerriSmart platform.</p>
          
          <div style="text-align: center;">
            <a href="${process.env.APP_URL || 'https://terrismart.repl.co'}/signin" class="cta-button">Sign In to Your Account</a>
          </div>
          
          <div class="divider"></div>
          
          <p style="color: #6c757d; font-size: 14px;">If you have any questions or need assistance getting started, our support team is here to help.</p>
          
          <p style="color: #495057; margin-top: 25px;">Best regards,<br><strong>The TerriSmart Team</strong></p>
        </div>
        <div class="footer">
          <p><strong>TerriSmart Platform</strong></p>
          <p>This is an automated email. Please do not reply to this message.</p>
          <p style="margin-top: 10px;">© ${new Date().getFullYear()} TerriSmart. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"TerriSmart Platform" <${process.env.SMTP_FROM_EMAIL}>`,
      to: email,
      subject: subject,
      html: htmlContent,
    });
    console.log(`Account approval email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending account approval email:', error);
    return false;
  }
}

export async function sendAccountRejectionEmail(email, name, role, reraId, reason) {
  const subject = 'Account Application Update - TerriSmart Platform';
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #6c757d 0%, #495057 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .header p { margin: 10px 0 0; opacity: 0.95; font-size: 14px; }
        .content { padding: 40px 30px; background: white; }
        .rejection-notice { background: #fff3cd; border: 2px solid #ffc107; padding: 20px; text-align: center; border-radius: 8px; margin: 25px 0; }
        .rejection-notice h2 { margin: 0; color: #856404; font-size: 22px; }
        .rejection-notice p { margin: 8px 0 0; color: #856404; font-size: 14px; }
        .info-box { background: #f8f9fa; border-left: 4px solid #dc3545; padding: 20px; margin: 25px 0; border-radius: 4px; }
        .info-box p { margin: 8px 0; color: #495057; }
        .info-box strong { color: #212529; }
        .reason-box { background: #fff; border: 2px solid #dc3545; padding: 20px; margin: 25px 0; border-radius: 8px; }
        .reason-box h3 { margin: 0 0 12px 0; color: #dc3545; font-size: 16px; }
        .reason-box p { margin: 0; color: #495057; line-height: 1.8; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; margin: 25px 0; font-weight: 600; }
        .footer { background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #dee2e6; }
        .footer p { margin: 5px 0; color: #6c757d; font-size: 13px; }
        .divider { height: 1px; background: #dee2e6; margin: 25px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏡 TerriSmart</h1>
          <p>Smart Territory Management Platform</p>
        </div>
        <div class="content">
          <h2 style="color: #212529; margin-top: 0;">Account Application Update</h2>
          <p style="color: #495057; font-size: 15px;">Dear ${name},</p>
          
          <div class="rejection-notice">
            <h2>Application Not Approved</h2>
            <p>We regret to inform you that your account application could not be approved at this time</p>
          </div>
          
          <div class="info-box">
            <p><strong>Application Details:</strong></p>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Role:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)}</p>
            <p><strong>RERA ID:</strong> ${reraId}</p>
          </div>
          
          <div class="reason-box">
            <h3>Reason for Rejection:</h3>
            <p>${reason}</p>
          </div>
          
          <p style="color: #495057;">We understand this may be disappointing. If you believe there has been an error or if you'd like to provide additional information, please don't hesitate to contact our support team.</p>
          
          <div style="text-align: center;">
            <a href="mailto:${process.env.SUPPORT_EMAIL || 'support@terrismart.com'}" class="cta-button">Contact Support</a>
          </div>
          
          <div class="divider"></div>
          
          <p style="color: #6c757d; font-size: 14px;"><strong>Next Steps:</strong></p>
          <ul style="color: #6c757d; font-size: 14px; line-height: 1.8;">
            <li>Verify your RERA ID is correctly registered with the relevant authority</li>
            <li>Ensure all provided information matches your official RERA registration</li>
            <li>Visit <a href="https://gujrera.gujarat.gov.in/" style="color: #667eea;">Gujarat RERA Website</a> to verify your registration status</li>
            <li>Contact our support team if you need assistance or have questions</li>
          </ul>
          
          <p style="color: #495057; margin-top: 25px;">We appreciate your interest in TerriSmart and hope to serve you in the future.</p>
          
          <p style="color: #495057; margin-top: 25px;">Best regards,<br><strong>The TerriSmart Team</strong></p>
        </div>
        <div class="footer">
          <p><strong>TerriSmart Platform</strong></p>
          <p>This is an automated email. Please do not reply to this message.</p>
          <p style="margin-top: 10px;">© ${new Date().getFullYear()} TerriSmart. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"TerriSmart Platform" <${process.env.SMTP_FROM_EMAIL}>`,
      to: email,
      subject: subject,
      html: htmlContent,
    });
    console.log(`Account rejection email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending account rejection email:', error);
    return false;
  }
}
