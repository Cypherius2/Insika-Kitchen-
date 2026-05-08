import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { to, subject, html } = await req.json();

    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is missing');
      return NextResponse.json({ error: 'Mail server configuration missing' }, { status: 500 });
    }

    if (!to || !subject || !html) {
      return NextResponse.json({ error: 'Missing required fields (to, subject, or html)' }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: [to],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error('Full Resend error object:', JSON.stringify(error, null, 2));
      return NextResponse.json({ 
        error: error.message,
        details: error
      }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('Email API catch error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
