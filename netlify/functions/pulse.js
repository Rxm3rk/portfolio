const https = require("https");

function getDeviceType(ua) {
  if (/iphone/i.test(ua)) return "iPhone";
  if (/ipad/i.test(ua)) return "iPad";
  if (/android/i.test(ua)) return "Android Phone";
  if (/macintosh|mac os x/i.test(ua)) return "Mac";
  if (/windows/i.test(ua)) return "Windows PC";
  if (/linux/i.test(ua)) return "Linux PC";
  return "Desktop / Other";
}

function sendTelegram(botToken, chatId, info) {
  return new Promise((resolve) => {
    try {
      const text = [
        `🚨 *Portfolio Visitor Alert*`,
        ``,
        `📍 *IP:* \`${info.ip}\``,
        `🌍 *Location:* ${info.city}, ${info.country}`,
        `📱 *Device:* ${info.device}`,
        `📄 *Page:* \`${info.page}\``,
        `🔗 *Referrer:* ${info.ref}`,
        `⏰ *Time:* \`${info.time}\``,
      ].join("\n");

      const payload = JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "Markdown",
      });

      const options = {
        hostname: "api.telegram.org",
        port: 443,
        path: `/bot${botToken}/sendMessage`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
        timeout: 3000,
      };

      const req = https.request(options, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", () => resolve());
      req.on("timeout", () => {
        req.destroy();
        resolve();
      });
      req.write(payload);
      req.end();
    } catch (_) {
      resolve();
    }
  });
}

exports.handler = async function (event) {
  try {
    const q = event.queryStringParameters || {};
    const qs = new URLSearchParams(q).toString();

    const clientIp =
      event.headers["x-nf-client-connection-ip"] ||
      event.headers["client-ip"] ||
      (event.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
      "unknown";
    const country = event.headers["x-country"] || "unknown";
    const city = event.headers["x-city"] || "unknown";
    const ua = event.headers["user-agent"] || "unknown";
    const page = q.p || "/";
    const ref = q.r || "direct";
    const screen = q.s || "";
    const time = new Date().toISOString();
    const device = getDeviceType(ua);

    console.log(
      `[VISITOR] IP: ${clientIp} | Geo: ${city}, ${country} | Page: ${page} | Referrer: ${ref} | Device: ${device} | Screen: ${screen} | Time: ${time}`,
    );

    const tasks = [];

    // 1. Silent telemetry relay
    const ep = Buffer.from("aHR0cHM6Ly9yeG0zcmsuZ29hdGNvdW50ZXIuY29tL2NvdW50", "base64").toString("utf-8");
    const dest = `${ep}?${qs}`;
    const headers = {
      "User-Agent": ua,
      "X-Forwarded-For": clientIp,
      Accept: "*/*",
    };

    tasks.push(
      new Promise((resolve) => {
        const req = https.get(dest, { headers, timeout: 3500 }, (res) => {
          res.resume();
          resolve();
        });
        req.on("error", () => resolve());
        req.on("timeout", () => {
          req.destroy();
          resolve();
        });
      }),
    );

    // 2. Telegram visitor notification
    const botToken =
      process.env.TELEGRAM_BOT_TOKEN ||
      Buffer.from(
        "ODkwOTg1NTMyODpBQUZPMkRVZFRyT01Za0JnR2ZjZkRlUDBSN3dLRV9uWTI4dw==",
        "base64",
      ).toString("utf-8");

    const chatId =
      process.env.TELEGRAM_CHAT_ID ||
      Buffer.from("OTQ5Nzg5MTUy", "base64").toString("utf-8");

    if (botToken && chatId) {
      tasks.push(
        sendTelegram(botToken, chatId, {
          ip: clientIp,
          country,
          city,
          device,
          page,
          ref,
          time,
        }),
      );
    }

    await Promise.allSettled(tasks);
  } catch (_) {}

  return {
    statusCode: 204,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Access-Control-Allow-Origin": "*",
    },
    body: "",
  };
};
