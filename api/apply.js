// Vercel Serverless Function: receives the store-plan apply form and emails it via Resend.
//
// Reached at /api/apply (Vercel maps the /api folder automatically).
//
// Required Vercel environment variables (Project → Settings → Environment Variables):
//   RESEND_API_KEY   – your Resend API key (re_...)
//   FORM_TO          – where submissions land (e.g. connect@myselfkart.com)
//   FORM_FROM        – verified sender on a Resend-verified domain
//                      (e.g. "MySelfKart <noreply@myselfkart.com>")
//
// The form posts as application/x-www-form-urlencoded and we 303-redirect
// to /thanks.html on success — same UX as before, no JS needed.

const SOURCE_LABELS = {
  instagram_whatsapp: "Instagram / WhatsApp",
  flipkart_amazon: "Flipkart / Amazon",
  offline_retail: "Offline retail",
};

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Read a field from Vercel's parsed body (object) or a raw urlencoded string.
function fieldReader(body) {
  if (body && typeof body === "object") {
    return (k) => (body[k] == null ? "" : String(body[k])).trim();
  }
  const params = new URLSearchParams(typeof body === "string" ? body : "");
  return (k) => (params.get(k) || "").trim();
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const get = fieldReader(req.body);

  // Honeypot: bots fill the hidden _honey field — silently "succeed".
  if (get("_honey")) {
    res.redirect(303, "/thanks.html");
    return;
  }

  const name = get("name");
  const phone = get("phone");
  const source = get("source");
  const notes = get("notes");

  if (!name || !phone) {
    res.status(400).send("Name and phone are required.");
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.FORM_TO || "connect@myselfkart.com";
  const from = process.env.FORM_FROM || "MySelfKart <noreply@myselfkart.com>";

  if (!apiKey) {
    console.error("RESEND_API_KEY is not set");
    res.status(500).send("Email service not configured.");
    return;
  }

  const sourceLabel = SOURCE_LABELS[source] || source || "—";
  const rows = [
    ["Name", name],
    ["WhatsApp", phone],
    ["Selling on", sourceLabel],
    ["Notes", notes || "—"],
  ]
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 14px;background:#f4f4f7;font-weight:700;border:1px solid #e5e5ea;">${esc(
          k
        )}</td><td style="padding:8px 14px;border:1px solid #e5e5ea;">${esc(
          v
        )}</td></tr>`
    )
    .join("");

  const html = `<div style="font-family:Arial,sans-serif;color:#16172b;">
    <h2 style="margin:0 0 12px;">New store-plan enquiry — MySelfKart</h2>
    <table style="border-collapse:collapse;font-size:15px;">${rows}</table>
  </div>`;

  const text =
    `New store-plan enquiry — MySelfKart\n\n` +
    `Name: ${name}\nWhatsApp: ${phone}\nSelling on: ${sourceLabel}\nNotes: ${notes || "—"}\n`;

  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `New store-plan enquiry — ${name}`,
        html,
        text,
      }),
    });

    if (!resp.ok) {
      const detail = await resp.text();
      console.error("Resend error", resp.status, detail);
      res.status(502).send("Could not send your enquiry. Please try again.");
      return;
    }
  } catch (err) {
    console.error("Resend request failed", err);
    res.status(502).send("Could not send your enquiry. Please try again.");
    return;
  }

  res.redirect(303, "/thanks.html");
};
