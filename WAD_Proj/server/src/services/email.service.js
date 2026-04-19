const nodemailer = require('nodemailer');

// Create transporter — uses Gmail by default
// If EMAIL_USER / EMAIL_PASS are not set, emails are skipped silently
function createTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;

  // Auto-detect service based on email domain
  const email = process.env.EMAIL_USER.toLowerCase();
  let transportConfig;

  if (email.includes('@gmail.com')) {
    transportConfig = {
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    };
  } else if (email.includes('@outlook.com') || email.includes('@hotmail.com') || email.includes('@live.com')) {
    transportConfig = {
      service: 'hotmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    };
  } else {
    // Generic SMTP — try with port 587
    transportConfig = {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    };
  }

  return nodemailer.createTransport(transportConfig);
}

/**
 * Send order notification email to a farmer.
 *
 * @param {Object} params
 * @param {string} params.farmerEmail
 * @param {string} params.farmerName
 * @param {string} params.orderId
 * @param {Array}  params.items  — order items belonging to this farmer
 * @param {Object} params.deliveryAddress
 * @param {string} params.buyerName
 */
async function sendFarmerOrderNotification({
  farmerEmail,
  farmerName,
  orderId,
  items,
  deliveryAddress,
  buyerName,
}) {
  const transporter = createTransporter();
  if (!transporter) {
    console.log(`[Email] Skipped — EMAIL_USER/EMAIL_PASS not configured. Would notify: ${farmerEmail}`);
    return;
  }

  const itemRows = items.map(item =>
    `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0e8d8;">${item.productName}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0e8d8;text-align:center;">${item.quantity} kg</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0e8d8;text-align:right;">₹${item.lineTotal}</td>
    </tr>`
  ).join('');

  const address = deliveryAddress
    ? `${deliveryAddress.street}, ${deliveryAddress.city}, ${deliveryAddress.state} - ${deliveryAddress.pincode}`
    : 'Not provided';

  const totalAmount = items.reduce((sum, i) => sum + (i.lineTotal || 0), 0);

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background:#fdf8ee;font-family:Arial,sans-serif;">
      <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

        <!-- Header -->
        <div style="background:linear-gradient(135deg,#b45309,#d97706);padding:28px 32px;">
          <h1 style="margin:0;color:#fff;font-size:22px;">🌾 Siridhanya Santhe</h1>
          <p style="margin:4px 0 0;color:#fde68a;font-size:14px;">New Order Received!</p>
        </div>

        <!-- Body -->
        <div style="padding:28px 32px;">
          <p style="color:#374151;font-size:15px;">Dear <strong>${farmerName}</strong>,</p>
          <p style="color:#6b7280;font-size:14px;line-height:1.6;">
            Great news! You have received a new order on Siridhanya Santhe.
            Please process and ship the items as soon as possible.
          </p>

          <!-- Order ID -->
          <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;margin:20px 0;">
            <p style="margin:0;font-size:13px;color:#92400e;">Order ID</p>
            <p style="margin:4px 0 0;font-size:18px;font-weight:bold;color:#78350f;">${orderId}</p>
          </div>

          <!-- Buyer info -->
          <p style="color:#374151;font-size:14px;margin-bottom:4px;"><strong>Buyer:</strong> ${buyerName}</p>
          <p style="color:#374151;font-size:14px;margin-bottom:20px;"><strong>Delivery Address:</strong> ${address}</p>

          <!-- Items table -->
          <h3 style="color:#374151;font-size:15px;margin-bottom:10px;">Your Items in This Order</h3>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <thead>
              <tr style="background:#fef3c7;">
                <th style="padding:10px 12px;text-align:left;color:#92400e;">Product</th>
                <th style="padding:10px 12px;text-align:center;color:#92400e;">Qty</th>
                <th style="padding:10px 12px;text-align:right;color:#92400e;">Amount</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
            <tfoot>
              <tr style="background:#f9fafb;">
                <td colspan="2" style="padding:10px 12px;font-weight:bold;color:#374151;">Total</td>
                <td style="padding:10px 12px;font-weight:bold;color:#d97706;text-align:right;">₹${totalAmount}</td>
              </tr>
            </tfoot>
          </table>

          <!-- Action -->
          <div style="margin-top:24px;padding:16px;background:#f0fdf4;border-radius:10px;border:1px solid #bbf7d0;">
            <p style="margin:0;color:#166534;font-size:14px;">
              📦 Please log in to your dashboard to update the order status as you process and ship the items.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding:20px 32px;background:#fdf8ee;border-top:1px solid #fde68a;">
          <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
            Siridhanya Santhe — India's Millet Marketplace<br>
            This is an automated notification. Please do not reply to this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"Siridhanya Santhe" <${process.env.EMAIL_USER}>`,
      to: farmerEmail,
      subject: `🌾 New Order Received — ${orderId}`,
      html,
    });
    console.log(`[Email] Order notification sent to farmer: ${farmerEmail}`);
  } catch (err) {
    // Don't crash the order flow if email fails
    console.error(`[Email] Failed to send to ${farmerEmail}:`, err.message);
  }
}

module.exports = { sendFarmerOrderNotification };
