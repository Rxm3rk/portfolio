const https = require("https");

exports.handler = async function (event) {
  try {
    const q = event.queryStringParameters || {};
    const qs = new URLSearchParams(q).toString();

    // Internal telemetry gateway
    const ep = Buffer.from("aHR0cHM6Ly9yeG0zcmsuZ29hdGNvdW50ZXIuY29tL2NvdW50", "base64").toString("utf-8");
    const dest = `${ep}?${qs}`;

    const headers = {
      "User-Agent": event.headers["user-agent"] || "",
      "X-Forwarded-For": event.headers["x-nf-client-connection-ip"] || event.headers["client-ip"] || "",
      "Accept": "*/*",
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
