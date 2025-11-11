import express from "express";
import nodemailer from "nodemailer";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

dotenv.config();
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Rate Limiter — 1 request per 30 seconds per IP
const contactLimiter = rateLimit({
  windowMs: 30 * 1000, // 30 seconds
  max: 1, // limit each IP to 1 request per windowMs
  message: {
    error: "Too many requests. Please wait a moment before trying again.",
  },
});

// 📨 Email Route with Rate Limiting
app.post("/api/contact", contactLimiter, async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Setup Gmail transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_USER,
      replyTo: email, // so client can reply directly to sender
      to: process.env.CLIENT_EMAIL,
      subject: `New Inquiry: ${subject}`,
      html: `
        <h3>New Message from ${name}</h3>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Message sent from ${email}`);

    res.status(200).json({ success: "Message sent successfully!" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: "Failed to send message. Please try again." });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
