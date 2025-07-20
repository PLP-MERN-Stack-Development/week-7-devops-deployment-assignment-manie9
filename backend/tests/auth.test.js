const request = require('supertest');
const app = require('../app'); // Assuming your Express app is exported from app.js or similar
const mongoose = require('mongoose');
const User = require('../models/User');

describe('Auth API', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI_TEST, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    // Disconnect from test database
    await mongoose.connection.close();
  });

  afterEach(async () => {
    // Clear users after each test
    await User.deleteMany({});
  });

  test('Register user and receive JWT token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'testuser@example.com',
        password: 'password123'
      });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('username', 'testuser');
  });

  test('Login user and receive JWT token', async () => {
    // First register user
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'testuser@example.com',
        password: 'password123'
      });

    // Then login
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'testuser@example.com',
        password: 'password123'
      });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('username', 'testuser');
  });

  test('Access protected route with valid token', async () => {
    // Register and login to get token
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'testuser@example.com',
        password: 'password123'
      });
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'testuser@example.com',
        password: 'password123'
      });
    const token = loginRes.body.token;

    // Access protected route
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.user).toHaveProperty('username', 'testuser');
  });

  test('Access protected route with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.statusCode).toBe(401);
  });

  test('Access protected route without token', async () => {
    const res = await request(app)
      .get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });
});
