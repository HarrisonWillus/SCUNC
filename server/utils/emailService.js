const nodemailer = require("nodemailer");
require("dotenv").config();

console.log('📧 EMAIL_SERVICE: Initializing email service...');
console.log('🔑 EMAIL_SERVICE: Environment variables check:');
console.log('   - ADMIN_GMAIL_USER:', process.env.ADMIN_GMAIL_USER ? 'Set' : 'Missing');
console.log('   - ADMIN_GMAIL_PASS:', process.env.ADMIN_GMAIL_PASS ? 'Set (length: ' + process.env.ADMIN_GMAIL_PASS.length + ')' : 'Missing');
console.log('   - GMAIL_USER:', process.env.GMAIL_USER ? 'Set' : 'Missing');
console.log('   - GMAIL_PASS:', process.env.GMAIL_PASS ? 'Set (length: ' + process.env.GMAIL_PASS.length + ')' : 'Missing');

// Set up the email transporters
console.log('⚙️ EMAIL_SERVICE: Creating SCUNC transporter...');
const transporterSCUNC = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.ADMIN_GMAIL_USER,
    pass: process.env.ADMIN_GMAIL_PASS,
  },
});

console.log('⚙️ EMAIL_SERVICE: Creating personal transporter...');
const transporterME = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

console.log('✅ EMAIL_SERVICE: Email transporters created successfully');

// Verify transporter connections
console.log('🧪 EMAIL_SERVICE: Testing transporter connections...');
transporterSCUNC.verify((error, success) => {
  if (error) {
    console.error('❌ EMAIL_SERVICE: SCUNC transporter verification failed:', error.message);
  } else {
    console.log('✅ EMAIL_SERVICE: SCUNC transporter ready to send emails');
  }
});

transporterME.verify((error, success) => {
  if (error) {
    console.error('❌ EMAIL_SERVICE: Personal transporter verification failed:', error.message);
  } else {
    console.log('✅ EMAIL_SERVICE: Personal transporter ready to send emails');
  }
});

// Email service for contact form (SCUNC)
const sendContactEmail = async (name, email, subject, message) => {
  console.log('📧 EMAIL_SERVICE: Starting sendContactEmail...');
  console.log('📋 EMAIL_SERVICE: Contact email parameters:');
  console.log('   - Name:', name);
  console.log('   - Email:', email);
  console.log('   - Subject:', subject);
  console.log('   - Message length:', message ? message.length : 0);
  console.log('   - Recipient:', process.env.ADMIN_GMAIL_USER);

  // Validate required parameters
  if (!name || !email || !subject || !message) {
    console.error('❌ EMAIL_SERVICE: Missing required parameters');
    console.log('   - Name provided:', !!name);
    console.log('   - Email provided:', !!email);
    console.log('   - Subject provided:', !!subject);
    console.log('   - Message provided:', !!message);
    throw new Error('Missing required email parameters');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error('❌ EMAIL_SERVICE: Invalid email format:', email);
    throw new Error('Invalid email format');
  }

  const mailOptions = {
    from: `"${name}" <${email}>`,
    to: process.env.ADMIN_GMAIL_USER,
    subject,
    text: message,
    replyTo: email,
  };

  console.log('📮 EMAIL_SERVICE: Mail options configured:');
  console.log('   - From:', mailOptions.from);
  console.log('   - To:', mailOptions.to);
  console.log('   - Subject:', mailOptions.subject);
  console.log('   - Reply-To:', mailOptions.replyTo);
  console.log('   - Text length:', mailOptions.text.length);

  try {
    console.log('🚀 EMAIL_SERVICE: Attempting to send contact email...');
    const info = await transporterSCUNC.sendMail(mailOptions);
    console.log('✅ EMAIL_SERVICE: Contact email sent successfully!');
    console.log('📊 EMAIL_SERVICE: Send info:');
    console.log('   - Message ID:', info.messageId);
    console.log('   - Response:', info.response);
    console.log('   - Accepted recipients:', info.accepted?.length || 0);
    console.log('   - Rejected recipients:', info.rejected?.length || 0);
    
    return { success: true, message: "Email sent successfully!" };
  } catch (error) {
    console.error('💥 EMAIL_SERVICE: Error sending contact email:', error);
    console.error('🔍 EMAIL_SERVICE: Error details:');
    console.error('   - Error code:', error.code);
    console.error('   - Error command:', error.command);
    console.error('   - Error response:', error.response);
    console.error('   - Error responseCode:', error.responseCode);
    console.error('   - Full error:', error.message);
    throw new Error("Error sending email");
  }
};

// Email service for personal/business inquiries
const sendBusinessEmail = async (name, email, subject, message, organization, referral) => {
  console.log('💼 EMAIL_SERVICE: Starting sendBusinessEmail...');
  console.log('📋 EMAIL_SERVICE: Business email parameters:');
  console.log('   - Name:', name);
  console.log('   - Email:', email);
  console.log('   - Subject:', subject);
  console.log('   - Message length:', message ? message.length : 0);
  console.log('   - Organization:', organization || 'Not provided');
  console.log('   - Referral:', referral || 'Not provided');
  console.log('   - Recipient:', process.env.GMAIL_USER);

  // Validate required parameters
  if (!name || !email || !subject || !message) {
    console.error('❌ EMAIL_SERVICE: Missing required parameters for business email');
    console.log('   - Name provided:', !!name);
    console.log('   - Email provided:', !!email);
    console.log('   - Subject provided:', !!subject);
    console.log('   - Message provided:', !!message);
    throw new Error('Missing required email parameters');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error('❌ EMAIL_SERVICE: Invalid email format for business email:', email);
    throw new Error('Invalid email format');
  }

  const emailBody = `From: ${name} (${email}) 
Organization: ${organization || 'Not specified'} 
Message: ${message}
Referral: ${referral || 'Direct contact'}`;

  const mailOptions = {
    from: `"${name}" <${email}>`,
    to: process.env.GMAIL_USER,
    subject,
    text: emailBody,
    replyTo: email,
  };

  console.log('📮 EMAIL_SERVICE: Business mail options configured:');
  console.log('   - From:', mailOptions.from);
  console.log('   - To:', mailOptions.to);
  console.log('   - Subject:', mailOptions.subject);
  console.log('   - Reply-To:', mailOptions.replyTo);
  console.log('   - Text length:', mailOptions.text.length);
  console.log('📄 EMAIL_SERVICE: Email body preview:');
  console.log('   ' + emailBody.split('\n').join('\n   '));

  try {
    console.log('🚀 EMAIL_SERVICE: Attempting to send business email...');
    const info = await transporterME.sendMail(mailOptions);
    console.log('✅ EMAIL_SERVICE: Business email sent successfully!');
    console.log('📊 EMAIL_SERVICE: Send info:');
    console.log('   - Message ID:', info.messageId);
    console.log('   - Response:', info.response);
    console.log('   - Accepted recipients:', info.accepted?.length || 0);
    console.log('   - Rejected recipients:', info.rejected?.length || 0);
    
    return { success: true, message: "Email sent successfully!" };
  } catch (error) {
    console.error('💥 EMAIL_SERVICE: Error sending business email:', error);
    console.error('🔍 EMAIL_SERVICE: Error details:');
    console.error('   - Error code:', error.code);
    console.error('   - Error command:', error.command);
    console.error('   - Error response:', error.response);
    console.error('   - Error responseCode:', error.responseCode);
    console.error('   - Full error:', error.message);
    throw new Error("Error sending email");
  }
};

console.log('📦 EMAIL_SERVICE: Exporting email service functions...');
console.log('✅ EMAIL_SERVICE: Email service initialization complete');

module.exports = {
  sendContactEmail,
  sendBusinessEmail
};
