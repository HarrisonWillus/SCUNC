const nodemailer = require("nodemailer");
require("dotenv").config();

console.log('Step 1: Email service initialization started');

// Set up the email transporters
console.log('Step 2: Creating connecting to email service');
const transporterSCUNC = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

console.log('Step 3: Email transporter created successfully');

// Verify transporter connections
console.log('Step 4: Testing transporter connections');
transporterSCUNC.verify((error, success) => {
  if (error) {
    console.error('Step 5: SCUNC transporter verification failed:', error.message);
  } else {
    console.log('Step 5: SCUNC transporter ready to send emails');
  }
});

// Email service for contact form (SCUNC) - Express route handler
const sendContactEmail = async (req, res) => {
  console.log('Contact email route handler called');
  console.log('Request body received:', req.body);

  try {
    const result = await sendContactEmailCore(req.body);
    res.status(200).json(result);
  } catch (error) {
    console.error('Contact email route error:', error.message);
    res.status(400).json({ error: error.message });
  }
};

// Core contact email function - accepts formData object
const sendContactEmailCore = async (formData) => {
  console.log('Starting sendContactEmailCore function');
  console.log('Form data received:', formData);
  
  // Extract data from formData object
  const { name, email, subject, message } = formData;

  // Validate required parameters
  if (!name || !email || !subject || !message) {
    console.error('Missing required parameters');
    console.log('   - Name provided:', !!name);
    console.log('   - Email provided:', !!email);
    console.log('   - Subject provided:', !!subject);
    console.log('   - Message provided:', !!message);
    throw new Error('Missing required email parameters');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error('Invalid email format:', email);
    throw new Error('Invalid email format');
  }

  // Simple sanitization to avoid accidental HTML injection in the email body
  const escapeHtml = (unsafe) => {
    if (!unsafe && unsafe !== 0) return '';
    return String(unsafe)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const cleanName = escapeHtml(name);
  const cleanEmail = escapeHtml(email);
  const cleanSubject = escapeHtml(subject);
  const cleanMessage = escapeHtml(message).replace(/\n/g, '<br />');

  const receivedAt = new Date().toLocaleString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const htmlBody = `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #111; line-height:1.5;">
      <h2 style="margin-bottom:0.25rem; color:#0b5cff;">New contact form submission</h2>
      <p style="margin-top:0; color:#444;">A new message was submitted via the SCUNC contact form.</p>

      <table style="width:100%; border-collapse:collapse; margin-top:1rem;">
        <tr>
          <td style="padding:8px; vertical-align:top; width:140px; font-weight:600; color:#333;">From</td>
          <td style="padding:8px; vertical-align:top; color:#111;">${cleanName} &lt;${cleanEmail}&gt;</td>
        </tr>
        <tr style="background:#f7f7f9;">
          <td style="padding:8px; vertical-align:top; font-weight:600; color:#333;">Subject</td>
          <td style="padding:8px; vertical-align:top; color:#111;">${cleanSubject}</td>
        </tr>
        <tr>
          <td style="padding:8px; vertical-align:top; font-weight:600; color:#333;">Received</td>
          <td style="padding:8px; vertical-align:top; color:#111;">${receivedAt}</td>
        </tr>
      </table>

      <div style="margin-top:1rem; padding:12px; border-radius:6px; background:#ffffff; border:1px solid #ececec;">
        <p style="margin:0 0 0.5rem 0; color:#333; font-weight:600;">Message</p>
        <div style="color:#222;">${cleanMessage}</div>
      </div>

      <p style="margin-top:1rem; font-size:0.9rem; color:#666;">This email was generated automatically by the SCUNC website contact form.</p>
    </div>
  `;

  const textBody = `
New contact form submission

From: ${name} <${email}>
Subject: ${subject}
Received: ${receivedAt}

Message:
${message}

--
This email was generated automatically by the SCUNC website contact form.
  `;

  const mailOptions = {
    from: "SCUNC Contact Form <scuncmun@gmail.com>",
    to: process.env.ADMIN_GMAIL_USER,
    subject: cleanSubject || 'SCUNC Contact Form Submission',
    text: textBody,
    html: htmlBody,
    replyTo: cleanEmail,
  };

  try {
    console.log('Attempting to send contact email');
    const info = await transporterSCUNC.sendMail(mailOptions);
    console.log('Contact email sent successfully');
    console.log('Send info details:');
    console.log('   - Message ID:', info.messageId);
    console.log('   - Response:', info.response);
    
    return { success: true, message: "Email sent successfully!" };
  } catch (error) {
    console.error('Error sending contact email:', error);
    console.error('Error details:');
    console.error('   - Error code:', error.code);
    console.error('   - Error command:', error.command);
    console.error('   - Error response:', error.response);
    console.error('   - Error responseCode:', error.responseCode);
    console.error('   - Full error:', error.message);
    throw new Error("Error sending email");
  }
};

module.exports = {
  sendContactEmail,
  sendContactEmailCore,
};
