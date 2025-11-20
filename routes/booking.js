const express = require('express');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const Booking = require('../models/booking');

const router = express.Router();

// POST /api/booking
router.post('/', async (req, res) => {
  const {
    fullName,
    email,
    phone,
    service1,
    service2,
    appointmentType,
    locationDetail,
    date,
    time,
    occasion,
    notes,
  } = req.body;

  // Validate required fields
  if (!fullName || !email || !phone || !service1 || !appointmentType || !date || !time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (appointmentType === 'on-location' && !locationDetail) {
    return res.status(400).json({ error: 'Location address required for on-location bookings' });
  }

  try {
    // Save booking
    const booking = new Booking({
      fullName,
      email,
      phone,
      service1,
      service2,
      appointmentType,
      location: locationDetail || 'In-Studio',
      date,
      time,
      occasion,
      notes,
    });
    await booking.save();

    // Nodemailer setup
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const adminEmail = process.env.EMAIL_USER;
    const senderEmail = process.env.EMAIL_SENDER || adminEmail;

    // Send email to admin
    await transporter.sendMail({
      from: senderEmail,
      to: adminEmail,
      subject: `📥 New Booking from ${fullName}`,
      html: `<p><strong>Name:</strong> ${fullName}</p>
             <p><strong>Email:</strong> ${email}</p>
             <p><strong>Phone:</strong> ${phone}</p>
             <p><strong>Primary Service:</strong> ${service1}</p>
             <p><strong>Additional Service:</strong> ${service2 || 'N/A'}</p>
             <p><strong>Appointment Type:</strong> ${appointmentType}</p>
             <p><strong>Location:</strong> ${locationDetail || 'In-Studio'}</p>
             <p><strong>Date:</strong> ${date}</p>
             <p><strong>Time:</strong> ${time}</p>
             ${occasion ? `<p><strong>Occasion:</strong> ${occasion}</p>` : ''}
             ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}`,
    });

    // Send email to customer
    await transporter.sendMail({
      from: senderEmail,
      to: email,
      subject: `📌 Booking Confirmation - PABETT BEAUTY`,
      html: `<p>Hi ${fullName},</p>
             <p>Thank you for booking with Pabett Beauty! Here are your appointment details:</p>
             <ul>
               <li>Date: ${date}</li>
               <li>Time: ${time}</li>
               <li>Location: ${locationDetail || 'In-Studio'}</li>
               <li>Primary Service: ${service1}</li>
               <li>Additional Service: ${service2 || 'None'}</li>
             </ul>
             <p>We will contact you shortly to confirm your appointment.</p>`,
    });

    // Optional: WhatsApp notification via Twilio
    if (process.env.TWILIO_SID && process.env.TWILIO_AUTH_TOKEN) {
      const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

      const formatPhone = (raw) => {
        if (!raw) return null;
        raw = raw.replace(/\D/g, '');
        if (raw.startsWith('0')) return `+233${raw.slice(1)}`;
        if (raw.startsWith('233')) return `+${raw}`;
        if (raw.startsWith('+')) return raw;
        return null;
      };

      const customerPhone = formatPhone(phone);
      const adminPhone = formatPhone(process.env.ADMIN_WHATSAPP);

      const msgBody = `📢 New Booking from ${fullName}\nPrimary Service: ${service1}${service2 ? ` + ${service2}` : ''}\nDate: ${date} at ${time}\nLocation: ${locationDetail || 'In-Studio'}\nPhone: ${phone}`;

      if (customerPhone) {
        await client.messages.create({
          from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
          to: `whatsapp:${customerPhone}`,
          body: `Hi ${fullName}, thanks for booking with PABETT BEAUTY!\n${msgBody}`,
        });
      }
      if (adminPhone) {
        await client.messages.create({
          from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
          to: `whatsapp:${adminPhone}`,
          body: msgBody,
        });
      }
    }

    return res.status(200).json({ message: 'Booking received! We will contact you shortly.' });
  } catch (err) {
    console.error('Booking error:', err.message);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
});

module.exports = router;
