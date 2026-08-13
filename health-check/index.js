const os = require("os");

exports.handler = async (event) => {
  const http = event?.requestContext?.http ?? {};

  const response = {
    hostname: os.hostname(),
    timestamp: new Date().toISOString(),
    runtime: process.version,

    request: {
      method: http.method ?? null,
      path: http.path ?? null,
      protocol: http.protocol ?? null,
      clientIp: http.sourceIp ?? null,
      userAgent: http.userAgent ?? null
    }
  };

  console.log(JSON.stringify(response));

  return {
    statusCode: 200,

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify(response)
  };
};