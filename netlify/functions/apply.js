// Netlify Function: receives the store-plan apply form and emails it via Resend.
//
// Required Netlify environment variables (Site settings → Environment variables):
//   RESEND_API_KEY   – your Resend API key (re_...)
//   FORM_TO          – where submissions land (e.g. connect@myselfkart.com)
//   FORM_FROM        – verified sender on a Resend-verified domain
//                      (e.g. "MySelfKart <noreply@myselfkart.com>")
//
// The form posts as application/x-www-form-urlencoded and we 302-redirect
// to /thanks.html on success — same UX as the old FormSubmit setup, no JS needed.

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

const redirect = (location) => ({
  statusCode: 303,
  headers: { Location: location },
  body: "",
});

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Parse the urlencoded form body.
  const params = new URLSearchParams(
    event.isBase64Encoded
      ? Buffer.from(event.body || "", "base64").toString("utf8")
      : event.body || ""
  );
  const get = (k) => (params.get(k) || "").trim();

  // Honeypot: bots fill the hidden _honey field — silently "succeed".
  if (get("_honey")) return redirect("/thanks.html");

  const name = get("name");
  const phone = get("phone");
  const source = get("source");
  const notes = get("notes");

  if (!name || !phone) {
    return { statusCode: 400, body: "Name and phone are required." };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.FORM_TO || "connect@myselfkart.com";
  const from = process.env.FORM_FROM || "MySelfKart <noreply@myselfkart.com>";

  if (!apiKey) {
    console.error("RESEND_API_KEY is not set");
    return { statusCode: 500, body: "Email service not configured." };
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
    const res = await fetch("https://api.resend.com/emails", {
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

    if (!res.ok) {
      const detail = await res.text();
      console.error("Resend error", res.status, detail);
      return { statusCode: 502, body: "Could not send your enquiry. Please try again." };
    }
  } catch (err) {
    console.error("Resend request failed", err);
    return { statusCode: 502, body: "Could not send your enquiry. Please try again." };
  }

  return redirect("/thanks.html");
};
