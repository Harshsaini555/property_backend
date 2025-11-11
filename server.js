import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import { Resend } from "resend";

dotenv.config();
const app = express();

// ✅ Required for Render proxy
app.set("trust proxy", 1);

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

// ✅ Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// 📨 Email Route with Rate Limiting
app.post("/api/contact", contactLimiter, async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // ✅ Send Email via Resend
    const data = await resend.emails.send({
      from: "Edition Realty <contact@editionrealty.in>", // you can later replace with verified domain
      to: process.env.CLIENT_EMAIL, // where you want to receive messages
      reply_to: email, // allow reply directly to sender
      subject: `New Inquiry: ${subject}`,
      html: `
        <h3>New Message from ${name}</h3>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    });

    console.log("✅ Message sent:", data);
    res.status(200).json({ success: "Message sent successfully!" });
  } catch (error) {
    console.error("❌ Error sending email:", error);
    res.status(500).json({ error: "Failed to send message. Please try again." });
  }
});

app.listen(process.env.PORT || 10000, () => {
  console.log(`✅ Server running on port ${process.env.PORT || 10000}`);
});
