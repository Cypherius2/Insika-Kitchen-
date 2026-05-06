import { Resend } from 'resend';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('RESEND_API_KEY is not set. Email sending skipped.');
      return NextResponse.json({ message: 'Email skipped: No API key' }, { status: 200 });
    }

    const resend = new Resend(apiKey);
    const { orderData, customerEmail, ownerEmail, documentNumber } = await req.json();

    const { type, items, totalAmount, subtotal, vat } = orderData;

    const itemsHtml = items.map((item: any) => `
      <tr>
        <td style="padding: 12px 8px; border-bottom: 1px solid #f3f4f6; color: #374151; font-size: 14px;">
          <div style="font-weight: 600;">${item.name}</div>
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #f3f4f6; text-align: center; color: #6b7280; font-size: 14px;">${item.quantity}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #f3f4f6; text-align: right; color: #6b7280; font-size: 14px;">E${item.price.toFixed(2)}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #f3f4f6; text-align: right; color: #111827; font-weight: 600; font-size: 14px;">E${item.total.toFixed(2)}</td>
      </tr>
    `).join('');

    const accentColor = type === 'receipt' ? '#059669' : '#7a2b22';
    const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${typeLabel}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f9fafb; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                <!-- Header -->
                <tr>
                  <td style="background-color: ${accentColor}; padding: 40px 40px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em; font-family: 'Playfair Display', serif;">Insika Kitchen</h1>
                    <p style="color: rgba(255, 255, 255, 0.8); margin: 8px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700;">${typeLabel} Confirmation</p>
                  </td>
                </tr>
                
                <!-- Body -->
                <tr>
                  <td style="padding: 40px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td>
                          <h2 style="margin: 0; font-size: 18px; color: #111827;">Hello,</h2>
                          <p style="margin: 12px 0 0 0; font-size: 16px; line-height: 1.6; color: #4b5563;">Thank you for choosing Insika Kitchen. Your ${type} has been generated successfully.</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 32px 0; border-bottom: 2px solid #f3f4f6;">
                          <table width="100%" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                              <td style="color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700;">${typeLabel} Number</td>
                              <td align="right" style="color: #111827; font-size: 14px; font-weight: 600;">#${documentNumber}</td>
                            </tr>
                            <tr>
                              <td style="padding-top: 8px; color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700;">Date</td>
                              <td align="right" style="padding-top: 8px; color: #111827; font-size: 14px; font-weight: 600;">${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      
                      <!-- Items Table -->
                      <tr>
                        <td style="padding: 32px 0;">
                          <table width="100%" border="0" cellspacing="0" cellpadding="0">
                            <thead>
                              <tr>
                                <th align="left" style="padding-bottom: 12px; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Description</th>
                                <th align="center" style="padding-bottom: 12px; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Qty</th>
                                <th align="right" style="padding-bottom: 12px; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Price</th>
                                <th align="right" style="padding-bottom: 12px; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${itemsHtml}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                      
                      <!-- Summary -->
                      <tr>
                        <td align="right" style="padding-top: 16px;">
                          <table width="240" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                              <td style="padding: 4px 0; color: #6b7280; font-size: 14px;">Subtotal</td>
                              <td align="right" style="padding: 4px 0; color: #111827; font-size: 14px; font-weight: 500;">E${subtotal.toFixed(2)}</td>
                            </tr>
                            <tr>
                              <td style="padding: 4px 0; color: #6b7280; font-size: 14px;">VAT (15%)</td>
                              <td align="right" style="padding: 4px 0; color: #111827; font-size: 14px; font-weight: 500;">E${vat.toFixed(2)}</td>
                            </tr>
                            <tr>
                              <td style="padding: 16px 0 0 0; color: #111827; font-size: 18px; font-weight: 800;">Total Amount</td>
                              <td align="right" style="padding: 16px 0 0 0; color: ${accentColor}; font-size: 20px; font-weight: 800;">E${totalAmount.toFixed(2)}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 40px; text-align: center; border-top: 1px solid #f3f4f6;">
                    <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.5;">
                      If you have any questions, feel free to reply to this email or contact us directly.<br><br>
                      <strong>Insika Kitchen</strong><br>
                      Eswatini
                    </p>
                    <div style="margin-top: 24px;">
                      <a href="#" style="display: inline-block; padding: 8px 16px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; color: #374151; font-size: 12px; font-weight: 600; text-decoration: none; margin: 0 4px;">Visit Website</a>
                    </div>
                  </td>
                </tr>
              </table>
              <p style="margin-top: 32px; font-size: 12px; color: #9ca3af; text-align: center;">
                &copy; 2026 Insika Kitchen. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    let recipients = [ownerEmail];
    
    // Only add customer if it's a real-looking email and different from owner
    if (customerEmail && 
        customerEmail.includes('@') && 
        customerEmail !== ownerEmail && 
        !customerEmail.endsWith('@example.com')) {
      recipients.push(customerEmail.trim());
    }

    // Deduplicate and clean
    recipients = Array.from(new Set(recipients)).filter(Boolean);

    const emailPayload = {
      from: 'Insika Kitchen <onboarding@resend.dev>',
      to: recipients,
      subject: `${typeLabel} #${documentNumber} - Insika Kitchen`,
      html: html,
    };

    const { data, error } = await resend.emails.send(emailPayload);

    if (error) {
      // Handle the specific "validation_error" which usually means unauthorized recipient in onboarding mode
      if ((error as any).name === 'validation_error' || (error as any).message?.includes('authorized')) {
        console.warn('Resend Validation Error: Likely due to unverified domain or unauthorized recipient.');
        
        // Fallback: Send ONLY to the owner
        const fallback = await resend.emails.send({
          ...emailPayload,
          to: [ownerEmail],
          subject: `${typeLabel} #${documentNumber} - Insika Kitchen (Internal Copy)`,
          html: html + `
            <div style="margin-top: 40px; padding: 20px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; color: #92400e; font-size: 13px;">
              <strong>Note for Admin:</strong> We couldn't send the customer copy to <b>${customerEmail}</b>. 
              <br/>To send emails to your customers, please verify your domain in the <a href="https://resend.com/domains">Resend Dashboard</a>.
            </div>
          `,
        });
        
        return NextResponse.json({ 
          data: fallback.data, 
          status: 'partially_sent',
          message: 'Sent to owner only. Domain verification required for customer emails.' 
        });
      }
      
      console.error('Final Resend Error:', error);
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
