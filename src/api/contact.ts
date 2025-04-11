import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import { Router } from 'express';

const router = Router();

// Set up CORS
router.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Handle preflight requests
router.options('/contact', (req, res) => {
  res.status(200).end();
});

// Contact form handler
router.post('/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validate input
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Create a transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: import.meta.env.VITE_EMAIL_USER,
        pass: import.meta.env.VITE_EMAIL_PASS,
      },
    });

    // Email content
    const mailOptions = {
      from: import.meta.env.VITE_EMAIL_USER,
      to: 'maharshi2406@gmail.com',
      subject: `New Contact Form Submission from ${name}`,
      text: `
        Name: ${name}
        Email: ${email}
        Message: ${message}
      `,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ message: 'Error sending email' });
  }
});

export default router; 