import { toast } from 'sonner';

export async function sendDocumentEmail(email: string, documentNumber: string, type: string, extraData?: any) {
  if (!email) {
    toast.error('No email address provided for this customer');
    return false;
  }

  const promise = async () => {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: email,
        subject: `${type.toUpperCase()} #${documentNumber} - Insika Kitchen`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #3d2b1f;">
            <h1 style="color: #7a2b22; text-align: center;">${type.toUpperCase()}</h1>
            <p>Dear Customer,</p>
            <p>Please find the details for your ${type} below:</p>
            
            <div style="background-color: #fdfcf0; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <p><strong>Document Number:</strong> #${documentNumber}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>

            ${extraData?.items ? `
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                  <tr style="border-bottom: 2px solid #7a2b22;">
                    <th style="text-align: left; padding: 10px;">Item</th>
                    <th style="text-align: center; padding: 10px;">Qty</th>
                    <th style="text-align: right; padding: 10px;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${extraData.items.map((item: any) => `
                    <tr style="border-bottom: 1px solid #eee;">
                      <td style="padding: 10px;">${item.name}</td>
                      <td style="padding: 10px; text-align: center;">${item.quantity}</td>
                      <td style="padding: 10px; text-align: right;">E ${item.price.toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Total:</td>
                    <td style="padding: 10px; text-align: right; font-weight: bold; color: #7a2b22; font-size: 18px;">E ${extraData.total.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            ` : ''}

            <p>Thank you for choosing Insika Kitchen!</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 10px; color: #999; text-align: center;">
              This is an automated message from Insika Kitchen POS system.<br/>
              © ${new Date().getFullYear()} Insika Kitchen
            </p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send email');
    }

    return response.json();
  };

  toast.promise(promise(), {
    loading: `Sending ${type} #${documentNumber} to ${email}...`,
    success: () => {
      return `${type} sent successfully to ${email}`;
    },
    error: (err) => {
      if (err.message.toLowerCase().includes('validation_error')) {
        return `Email failed: Validation Error. If you're on a trial, you can only send to your own email.`;
      }
      return `Email failed: ${err.message}`;
    },
  });

  return true;
}
