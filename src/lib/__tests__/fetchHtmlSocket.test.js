/**
 * @jest-environment node
 */
import http from "node:http";
import { fetchHtml } from "@/lib/analysis";

// fetchHtml.test.js mocks http.get, so Node's own socket code never calls our
// lookup there. This test goes through real sockets to a local server, so a
// change in how Node calls lookup (as with autoSelectFamily's { all: true },
// NEUTRALEYE-WEB-3) fails here instead of in production.
jest.mock("@/lib/ssrf", () => ({
  MAX_REDIRECTS: 5,
  resolveSafeAddress: jest.fn().mockResolvedValue({ address: "127.0.0.1", family: 4 }),
}));

let server;
let port;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    if (req.url === "/moved") {
      res.writeHead(302, { Location: "/article" });
      res.end();
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`<html>article for ${req.headers.host}</html>`);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  port = server.address().port;
});

afterAll(() => new Promise((resolve) => server.close(resolve)));

test("fetches through a real socket to the vetted address, keeping the URL's host", async () => {
  await expect(fetchHtml(`http://news.example.test:${port}/article`)).resolves.toBe(
    `<html>article for news.example.test:${port}</html>`,
  );
});

test("follows a redirect through a real socket", async () => {
  await expect(fetchHtml(`http://news.example.test:${port}/moved`)).resolves.toBe(
    `<html>article for news.example.test:${port}</html>`,
  );
});
