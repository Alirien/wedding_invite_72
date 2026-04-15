const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const dns = require("dns");

dns.setDefaultResultOrder("ipv4first");

const PORT = process.env.PORT || 3000;
const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL || "";
const PUBLIC_DIR = path.join(__dirname, "public");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": MIME_TYPES[".json"] });
  res.end(JSON.stringify(payload));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function sendToGoogleSheets({ guests, comment }) {
  if (!GOOGLE_SCRIPT_URL) {
    throw new Error("GOOGLE_SCRIPT_URL is not configured.");
  }
  let response;
  try {
    response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        submittedAt: new Date().toISOString(),
        comment,
        guests
      }),
      signal: AbortSignal.timeout(30000)
    });
  } catch (error) {
    if (error.cause && error.cause.code === "UND_ERR_CONNECT_TIMEOUT") {
      throw new Error("Нет соединения с Google Apps Script (таймаут подключения).");
    }
    throw error;
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google Sheets API error: ${response.status} ${body}`);
  }

  const responseText = await response.text();
  try {
    const parsed = JSON.parse(responseText);
    if (parsed && parsed.ok === false) {
      throw new Error(parsed.error || "Google Apps Script returned ok: false");
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Google Apps Script returned non-JSON response: ${responseText}`);
    }
    throw error;
  }
}

async function readRequestBody(req) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
  }
  return body;
}

async function handleApiRsvp(req, res) {
  try {
    const rawBody = await readRequestBody(req);
    const data = JSON.parse(rawBody);

    const guests = Array.isArray(data.guests) ? data.guests : [];
    const comment = (data.comment || "").trim();

    if (guests.length === 0) {
      sendJson(res, 400, { ok: false, message: "Please add at least one guest." });
      return;
    }

    const sanitizedGuests = guests.map((guest) => {
      const guestName = (guest.guestName || "").trim();
      const rawSelections = typeof guest.selections === "object" ? guest.selections : {};
      const selections = {};

      for (const [category, items] of Object.entries(rawSelections)) {
        if (!Array.isArray(items)) {
          continue;
        }
        selections[escapeHtml(category)] = items
          .map((item) => escapeHtml(String(item).trim()))
          .filter(Boolean);
      }

      return {
        guestName: escapeHtml(guestName),
        selections
      };
    });

    const isInvalidGuest = sanitizedGuests.some((guest) => {
      if (!guest.guestName) {
        return true;
      }
      return !Object.values(guest.selections).some((items) => items.length > 0);
    });

    if (isInvalidGuest) {
      sendJson(res, 400, { ok: false, message: "Each guest must have name and at least one dish." });
      return;
    }

    await sendToGoogleSheets({ guests: sanitizedGuests, comment: escapeHtml(comment) });

    sendJson(res, 200, { ok: true });
  } catch (error) {
    console.error("RSVP API error:", error);
    sendJson(res, 500, { ok: false, message: error.message });
  }
}

async function serveStaticFile(req, res) {
  const requestPath = req.url === "/" ? "/index.html" : req.url;
  const fullPath = path.join(PUBLIC_DIR, requestPath);
  const ext = path.extname(fullPath);

  try {
    const content = await fs.readFile(fullPath);
    res.writeHead(200, {
      "Content-Type": MIME_TYPES[ext] || "application/octet-stream"
    });
    res.end(content);
  } catch {
    sendJson(res, 404, { ok: false, message: "Not found" });
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/api/rsvp") {
    await handleApiRsvp(req, res);
    return;
  }

  if (req.method === "GET") {
    await serveStaticFile(req, res);
    return;
  }

  sendJson(res, 405, { ok: false, message: "Method not allowed" });
});

server.listen(PORT, () => {
  console.log(`Wedding invite is running on http://localhost:${PORT}`);
});
