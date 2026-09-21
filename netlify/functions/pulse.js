const https = require("https");

exports.handler = async function (event) {
  try {
    const q = event.queryStringParameters || {};
    const qs = new URLSearchParams(q).toString();

    // Internal telemetry gateway
    const ep = Buffer.from("aHR0cHM6Ly9yeG0zcmsuZ29hdGNvdW50ZXIuY29tL2NvdW50", "base64").toString("utf-8");
    const dest = `${ep}?${qs}`;

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

    console.log(
      `[VISITOR] IP: ${clientIp} | Geo: ${city}, ${country} | Page: ${page} | Referrer: ${ref} | Screen: ${screen} | UA: ${ua} | Time: ${time}`,
    );

    const headers = {
      "User-Agent": ua,
      "X-Forwarded-For": clientIp,
      Accept: "*/*",
    };

    await new Promise((resolve) => {
      const req = https.get(dest, { headers, timeout: 3500 }, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", () => resolve());
      req.on("timeout", () => {
        req.destroy();
        resolve();
      });
    });
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
