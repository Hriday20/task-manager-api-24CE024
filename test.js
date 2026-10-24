const http = require("http");
const request = require("supertest");

describe("Basic HTTP Server", () => {
  let server;

  beforeAll(() => {
    server = http.createServer((req, res) => {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("Hello from Node!");
    });
  });

  afterAll((done) => {
    if (server && server.listening) {
      server.close(done);
    } else {
      done();
    }
  });

  test("GET / returns status 200", async () => {
    const response = await request(server).get("/");

    expect(response.statusCode).toBe(200);
    expect(response.text).toBe("Hello from Node!");
  });
});