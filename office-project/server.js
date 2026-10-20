const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const publicFolder = path.join(__dirname, "public");
const PORT = 3000;

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg"
};

const server = http.createServer((request, response) => {
  if (!["GET", "HEAD"].includes(request.method)) {
    response.writeHead(405);
    response.end("Method not allowed");
    return;
  }

  let pathname;

  try {
    const url = new URL(request.url, "http://localhost");
    pathname = decodeURIComponent(url.pathname);
  } catch {
    response.writeHead(400);
    response.end("Invalid request");
    return;
  }

  if (pathname === "/") {
    pathname = "/index.html";
  }

  const filePath = path.resolve(publicFolder, "." + pathname);

  if (!filePath.startsWith(publicFolder + path.sep)) {
    response.writeHead(403);
    response.end("Access denied");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(404, {
        "Content-Type": "text/plain; charset=utf-8"
      });

      response.end("File not found");
      return;
    }

    const extension = path.extname(filePath);

    response.writeHead(200, {
      "Content-Type": contentTypes[extension] || "application/octet-stream",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    });

    response.end(request.method === "HEAD" ? undefined : content);
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Smart Office is running at http://localhost:${PORT}`);
});
