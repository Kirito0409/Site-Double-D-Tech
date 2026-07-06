import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';

export const prerender = false;

interface ContactPayload {
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  need?: string;
  message?: string;
  website?: string; // honeypot
}

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const POST: APIRoute = async ({ request }) => {
  let data: ContactPayload;
  try {
    data = (await request.json()) as ContactPayload;
  } catch {
    return json({ error: 'Requête invalide.' }, 400);
  }

  // Honeypot: silently accept bots without sending anything.
  if (data.website && data.website.trim() !== '') {
    return json({ ok: true });
  }

  const name = (data.name ?? '').trim();
  const email = (data.email ?? '').trim();
  const company = (data.company ?? '').trim();
  const phone = (data.phone ?? '').trim();
  const need = (data.need ?? '').trim();
  const message = (data.message ?? '').trim();

  // Validation
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!name || !emailOk) {
    return json({ error: 'Merci de renseigner au minimum un nom et un email valide.' }, 400);
  }

  // SMTP configuration from environment variables.
  // Read process.env first (runtime: Docker env_file, `node --env-file`),
  // then fall back to import.meta.env (dev server / build-time).
  const env = (key: string): string | undefined =>
    process.env[key] ?? (import.meta.env as Record<string, string | undefined>)[key];

  const SMTP_HOST = env('SMTP_HOST');
  const SMTP_PORT = env('SMTP_PORT');
  const SMTP_USER = env('SMTP_USER');
  const SMTP_PASS = env('SMTP_PASS');
  const SMTP_SECURE = env('SMTP_SECURE');
  const CONTACT_TO = env('CONTACT_TO');
  const CONTACT_FROM = env('CONTACT_FROM');

  const to = CONTACT_TO || SMTP_USER;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !to) {
    console.error(
      '[contact] SMTP non configuré. Renseignez SMTP_HOST, SMTP_USER, SMTP_PASS et CONTACT_TO dans .env'
    );
    return json(
      {
        error:
          "Le service d'envoi n'est pas encore configuré. Contactez-nous directement par email en attendant.",
      },
      500
    );
  }

  const port = Number(SMTP_PORT) || 587;
  const secure = SMTP_SECURE ? SMTP_SECURE === 'true' : port === 465;

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  const subject = `Nouvelle demande — ${need || 'Contact'} — ${name}`;

  const textBody = [
    `Nouvelle demande depuis le site Double D Tech`,
    ``,
    `Nom        : ${name}`,
    `Entreprise : ${company || '—'}`,
    `Email      : ${email}`,
    `Téléphone  : ${phone || '—'}`,
    `Besoin     : ${need || '—'}`,
    ``,
    `Message :`,
    message || '—',
  ].join('\n');

  const htmlBody = `
    <div style="font-family:system-ui,sans-serif;max-width:600px;color:#0b1a13;">
      <h2 style="color:#00a152;margin:0 0 16px;">Nouvelle demande — Double D Tech</h2>
      <table style="border-collapse:collapse;width:100%;font-size:14px;">
        <tr><td style="padding:6px 10px;font-weight:600;">Nom</td><td style="padding:6px 10px;">${escapeHtml(name)}</td></tr>
        <tr><td style="padding:6px 10px;font-weight:600;">Entreprise</td><td style="padding:6px 10px;">${escapeHtml(company) || '—'}</td></tr>
        <tr><td style="padding:6px 10px;font-weight:600;">Email</td><td style="padding:6px 10px;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
        <tr><td style="padding:6px 10px;font-weight:600;">Téléphone</td><td style="padding:6px 10px;">${escapeHtml(phone) || '—'}</td></tr>
        <tr><td style="padding:6px 10px;font-weight:600;">Besoin</td><td style="padding:6px 10px;">${escapeHtml(need) || '—'}</td></tr>
      </table>
      <h3 style="margin:20px 0 8px;">Message</h3>
      <p style="white-space:pre-wrap;font-size:14px;line-height:1.6;">${escapeHtml(message) || '—'}</p>
    </div>`;

  try {
    await transporter.sendMail({
      from: CONTACT_FROM || `"Double D Tech — Site" <${SMTP_USER}>`,
      to,
      replyTo: `"${name}" <${email}>`,
      subject,
      text: textBody,
      html: htmlBody,
    });
    return json({ ok: true });
  } catch (err) {
    console.error('[contact] Échec de l’envoi:', err);
    // Give a clearer hint when the SMTP credentials are wrong.
    const code = (err as { code?: string; responseCode?: number })?.code;
    const responseCode = (err as { responseCode?: number })?.responseCode;
    if (code === 'EAUTH' || responseCode === 535) {
      return json(
        {
          error:
            "Identifiants email refusés par le serveur. Vérifiez SMTP_USER / SMTP_PASS dans .env.",
        },
        502
      );
    }
    return json({ error: "L'envoi a échoué. Merci de réessayer plus tard." }, 502);
  }
};
