/**
 * @jest-environment node
 */
import http from "node:http";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import { fetchHtml, MAX_HTML_BYTES } from "@/lib/analysis";

jest.mock("@/lib/ssrf", () => ({
  MAX_REDIRECTS: 5,
  resolveSafeAddress: jest.fn().mockResolvedValue({ address: "1.1.1.1", family: 4 }),
}));

function mockResponse(headers, body = "<html>article</html>") {
  return jest.spyOn(http, "get").mockImplementation((_url, _options, onResponse) => {
    const request = new EventEmitter();
    request.destroy = jest.fn();
    process.nextTick(() => {
      const response = new PassThrough();
      response.statusCode = 200;
      response.headers = headers;
      onResponse(response);
      response.end(body);
    });
    return request;
  });
}

afterEach(() => jest.restoreAllMocks());

test("connects to the vetted address while retaining the original URL host", async () => {
  const get = mockResponse({});
  await expect(fetchHtml("http://example.com/article")).resolves.toBe("<html>article</html>");
  expect(get.mock.calls[0][0].hostname).toBe("example.com");
  const lookup = get.mock.calls[0][1].lookup;
  await new Promise((resolve) => {
    lookup("example.com", {}, (_error, address, family) => {
      expect(address).toBe("1.1.1.1");
      expect(family).toBe(4);
      resolve();
    });
  });
});

test("rejects an oversized response before reading its body", async () => {
  mockResponse({ "content-length": String(MAX_HTML_BYTES + 1) });
  await expect(fetchHtml("http://example.com/article")).rejects.toMatchObject({
    code: "URL_FETCH_FAILED",
    status: 413,
  });
});
