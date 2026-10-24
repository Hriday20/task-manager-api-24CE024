const request = require("supertest");
const app = require("./app");

describe("Task Manager API", () => {
  test("GET / returns status 200 and API message", async () => {
    const response = await request(app).get("/");

    expect(response.statusCode).toBe(201);
    expect(response.body).toEqual({
      message: "Task Manager API is running!",
    });
  });

  test("Unknown route returns status 404", async () => {
    const response = await request(app).get("/this-route-does-not-exist");

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe("Route not found");
  });
});