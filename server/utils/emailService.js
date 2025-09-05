const nodemailer = require("nodemailer");
require("dotenv").config();

console.log('Step 1: Email service initialization started');
console.log('Step 2: Environment variables verification:');
console.log('   - ADMIN_GMAIL_USER:', process.env.ADMIN_GMAIL_USER ? 'Set' : 'Missing');
console.log('   - ADMIN_GMAIL_PASS:', process.env.ADMIN_GMAIL_PASS ? 'Set (length: ' + process.env.ADMIN_GMAIL_PASS.length + ')' : 'Missing');
console.log('   - GMAIL_USER:', process.env.GMAIL_USER ? 'Set' : 'Missing');
console.log('   - GMAIL_PASS:', process.env.GMAIL_PASS ? 'Set (length: ' + process.env.GMAIL_PASS.length + ')' : 'Missing');

// Set up the email transporters
console.log('Step 3: Creating SCUNC transporter configuration');
const transporterSCUNC = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.ADMIN_GMAIL_USER,
    pass: process.env.ADMIN_GMAIL_PASS,
  },
});

console.log('Step 4: Creating personal transporter configuration');
const transporterME = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

console.log('Step 5: Email transporters created successfully');

// Verify transporter connections
console.log('Step 6: Testing transporter connections');
transporterSCUNC.verify((error, success) => {
  if (error) {
    console.error('Step 7: SCUNC transporter verification failed:', error.message);
  } else {
    console.log('Step 7: SCUNC transporter ready to send emails');
  }
});

transporterME.verify((error, success) => {
  if (error) {
    console.error('Step 8: Personal transporter verification failed:', error.message);
  } else {
    console.log('Step 8: Personal transporter ready to send emails');
  }
});

// Email service for contact form (SCUNC) - Express route handler
const sendContactEmail = async (req, res) => {
  console.log('Step 9: Contact email route handler called');
  console.log('Step 10: Request body received:', req.body);
  
  try {
    const result = await sendContactEmailCore(req.body);
    res.status(200).json(result);
  } catch (error) {
    console.error('Step 11: Contact email route error:', error.message);
    res.status(400).json({ error: error.message });
  }
};

// Email service for business inquiries - Express route handler
const sendBusinessEmail = async (req, res) => {
  console.log('Step 12: Business email route handler called');
  console.log('Step 13: Request body received:', req.body);
  
  try {
    const result = await sendBusinessEmailCore(req.body);
    res.status(200).json(result);
  } catch (error) {
    console.error('Step 14: Business email route error:', error.message);
    res.status(400).json({ error: error.message });
  }
};

// Core contact email function - accepts formData object
const sendContactEmailCore = async (formData) => {
  console.log('Step 15: Starting sendContactEmailCore function');
  console.log('Step 16: Form data received:', formData);
  console.log('Step 17: Form data type:', typeof formData);
  console.log('Step 18: Form data keys:', Object.keys(formData));
  
  // Extract data from formData object
  const { name, email, subject, message } = formData;
  
  console.log('Step 19: Extracted contact email parameters:');
  console.log('   - Name:', name);
  console.log('   - Email:', email);
  console.log('   - Subject:', subject);
  console.log('   - Message length:', message ? message.length : 0);
  console.log('   - Recipient:', process.env.ADMIN_GMAIL_USER);

  // Validate required parameters
  if (!name || !email || !subject || !message) {
    console.error('Step 20: Missing required parameters');
    console.log('   - Name provided:', !!name);
    console.log('   - Email provided:', !!email);
    console.log('   - Subject provided:', !!subject);
    console.log('   - Message provided:', !!message);
    throw new Error('Missing required email parameters');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error('Step 21: Invalid email format:', email);
    throw new Error('Invalid email format');
  }

  const mailOptions = {
    from: `"${name}" <${email}>`,
    to: process.env.ADMIN_GMAIL_USER,
    subject,
    text: message,
    replyTo: email,
  };

  console.log('Step 22: Mail options configured:');
  console.log('   - From:', mailOptions.from);
  console.log('   - To:', mailOptions.to);
  console.log('   - Subject:', mailOptions.subject);
  console.log('   - Reply-To:', mailOptions.replyTo);
  console.log('   - Text length:', mailOptions.text.length);

  try {
    console.log('Step 23: Attempting to send contact email');
    const info = await transporterSCUNC.sendMail(mailOptions);
    console.log('Step 24: Contact email sent successfully');
    console.log('Step 25: Send info details:');
    console.log('   - Message ID:', info.messageId);
    console.log('   - Response:', info.response);
    console.log('   - Accepted recipients:', info.accepted?.length || 0);
    console.log('   - Rejected recipients:', info.rejected?.length || 0);
    
    return { success: true, message: "Email sent successfully!" };
  } catch (error) {
    console.error('Step 26: Error sending contact email:', error);
    console.error('Step 27: Error details:');
    console.error('   - Error code:', error.code);
    console.error('   - Error command:', error.command);
    console.error('   - Error response:', error.response);
    console.error('   - Error responseCode:', error.responseCode);
    console.error('   - Full error:', error.message);
    throw new Error("Error sending email");
  }
};

// Core business email function - accepts formData object
const sendBusinessEmailCore = async (formData) => {
  console.log('Step 28: Starting sendBusinessEmailCore function');
  console.log('Step 29: Form data received:', formData);
  console.log('Step 30: Form data type:', typeof formData);
  console.log('Step 31: Form data keys:', Object.keys(formData));
  
  // Extract data from formData object
  const { name, email, subject, message, organization, referral } = formData;
  
  console.log('Step 32: Extracted business email parameters:');
  console.log('   - Name:', name);
  console.log('   - Email:', email);
  console.log('   - Subject:', subject);
  console.log('   - Message length:', message ? message.length : 0);
  console.log('   - Organization:', organization || 'Not provided');
  console.log('   - Referral:', referral || 'Not provided');
  console.log('   - Recipient:', process.env.GMAIL_USER);

  // Validate required parameters
  if (!name || !email || !subject || !message) {
    console.error('Step 33: Missing required parameters for business email');
    console.log('   - Name provided:', !!name);
    console.log('   - Email provided:', !!email);
    console.log('   - Subject provided:', !!subject);
    console.log('   - Message provided:', !!message);
    throw new Error('Missing required email parameters');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error('Step 34: Invalid email format for business email:', email);
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

  console.log('Step 35: Business mail options configured:');
  console.log('   - From:', mailOptions.from);
  console.log('   - To:', mailOptions.to);
  console.log('   - Subject:', mailOptions.subject);
  console.log('   - Reply-To:', mailOptions.replyTo);
  console.log('   - Text length:', mailOptions.text.length);
  console.log('Step 36: Email body preview:');
  console.log('   ' + emailBody.split('\n').join('\n   '));

  try {
    console.log('Step 37: Attempting to send business email');
    const info = await transporterME.sendMail(mailOptions);
    console.log('Step 38: Business email sent successfully');
    console.log('Step 39: Send info details:');
    console.log('   - Message ID:', info.messageId);
    console.log('   - Response:', info.response);
    console.log('   - Accepted recipients:', info.accepted?.length || 0);
    console.log('   - Rejected recipients:', info.rejected?.length || 0);
    
    return { success: true, message: "Email sent successfully!" };
  } catch (error) {
    console.error('Step 40: Error sending business email:', error);
    console.error('Step 41: Error details:');
    console.error('   - Error code:', error.code);
    console.error('   - Error command:', error.command);
    console.error('   - Error response:', error.response);
    console.error('   - Error responseCode:', error.responseCode);
    console.error('   - Full error:', error.message);
    throw new Error("Error sending email");
  }
};

console.log('Step 42: Exporting email service functions');
console.log('Step 43: Email service initialization complete');

module.exports = {
  sendContactEmail,
  sendBusinessEmail,
  sendContactEmailCore,
  sendBusinessEmailCore
};
