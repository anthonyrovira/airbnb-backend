const router = require("../routes/user.js");
const request = require("supertest");

it("should signup for a user", async () => {
  await request(router)
    .post("/user/signup")
    .send({
      email: "test@lereacteur.io",
      password: "test1234",
      username: "test",
      name: "Test",
      description: "This is a test for a signup request",
      dateOfBirth: "1988-01-01",
    })
    .expect(200);
});
