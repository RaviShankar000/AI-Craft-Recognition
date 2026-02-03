/**
 * Integration tests for craft recognition API
 * Tests complete workflows for craft management
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const Craft = require('../../models/Craft');
const User = require('../../models/User');

// Mock AI service to avoid external API calls
jest.mock('../../services/aiService');

describe('Craft Recognition API Integration Tests', () => {
  let adminToken;
  let userToken;
  let adminUser;
  let normalUser;
  let testCraft;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Create test users
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'AdminPass123!',
      role: 'admin',
      active: true,
    });

    normalUser = await User.create({
      name: 'Normal User',
      email: 'user@test.com',
      password: 'UserPass123!',
      role: 'user',
      active: true,
    });

    // Generate tokens
    adminToken = adminUser.generateAuthToken();
    userToken = normalUser.generateAuthToken();
  });

  afterAll(async () => {
    // Cleanup
    await User.deleteMany({});
    await Craft.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear crafts before each test
    await Craft.deleteMany({});
  });

  describe('GET /api/crafts - Get all crafts', () => {
    beforeEach(async () => {
      // Seed test data
      await Craft.create([
        {
          name: 'Pottery',
          description: 'Traditional clay pottery',
          category: 'Ceramics',
          origin: 'Global',
          materials: ['clay', 'water'],
        },
        {
          name: 'Weaving',
          description: 'Textile weaving',
          category: 'Textiles',
          origin: 'Global',
          materials: ['yarn', 'thread'],
        },
      ]);
    });

    it('should return all crafts for public access', async () => {
      const response = await request(app)
        .get('/api/crafts')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0]).toHaveProperty('description');
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/crafts')
        .query({ limit: 1, page: 1 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get('/api/crafts')
        .query({ category: 'Ceramics' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Pottery');
    });

    it('should search by name', async () => {
      const response = await request(app)
        .get('/api/crafts')
        .query({ search: 'weaving' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Weaving');
    });
  });

  describe('GET /api/crafts/:id - Get craft by ID', () => {
    beforeEach(async () => {
      testCraft = await Craft.create({
        name: 'Embroidery',
        description: 'Traditional embroidery art',
        category: 'Textiles',
        origin: 'India',
        materials: ['thread', 'fabric'],
      });
    });

    it('should return craft details by valid ID', async () => {
      const response = await request(app)
        .get(`/api/crafts/${testCraft._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Embroidery');
      expect(response.body.data.origin).toBe('India');
    });

    it('should return 404 for non-existent craft', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/crafts/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/crafts/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/crafts - Create craft (Admin only)', () => {
    const validCraftData = {
      name: 'Woodcarving',
      description: 'Traditional wood carving techniques',
      category: 'Woodwork',
      origin: 'Scandinavia',
      materials: ['wood', 'tools'],
      techniques: ['carving', 'engraving'],
    };

    it('should allow admin to create new craft', async () => {
      const response = await request(app)
        .post('/api/crafts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validCraftData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Woodcarving');
      expect(response.body.data.origin).toBe('Scandinavia');

      // Verify craft was created in database
      const craft = await Craft.findById(response.body.data._id);
      expect(craft).toBeDefined();
      expect(craft.name).toBe('Woodcarving');
    });

    it('should reject craft creation by non-admin user', async () => {
      const response = await request(app)
        .post('/api/crafts')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validCraftData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not authorized');
    });

    it('should reject craft creation without authentication', async () => {
      const response = await request(app)
        .post('/api/crafts')
        .send(validCraftData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        name: 'Test',
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/crafts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should prevent duplicate craft names', async () => {
      // Create first craft
      await Craft.create(validCraftData);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/crafts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validCraftData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already exists');
    });
  });

  describe('PUT /api/crafts/:id - Update craft (Admin only)', () => {
    beforeEach(async () => {
      testCraft = await Craft.create({
        name: 'Glass Blowing',
        description: 'Traditional glass work',
        category: 'Glass',
        origin: 'Venice',
        materials: ['glass', 'tools'],
      });
    });

    it('should allow admin to update craft', async () => {
      const updateData = {
        description: 'Updated description for glass blowing',
        origin: 'Murano, Italy',
      };

      const response = await request(app)
        .put(`/api/crafts/${testCraft._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBe(updateData.description);
      expect(response.body.data.origin).toBe(updateData.origin);
      expect(response.body.data.name).toBe('Glass Blowing'); // Unchanged
    });

    it('should reject update by non-admin user', async () => {
      const response = await request(app)
        .put(`/api/crafts/${testCraft._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ description: 'Hacked' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/crafts/:id - Delete craft (Admin only)', () => {
    beforeEach(async () => {
      testCraft = await Craft.create({
        name: 'Test Craft',
        description: 'To be deleted',
        category: 'Test',
        origin: 'Test',
        materials: ['test'],
      });
    });

    it('should allow admin to delete craft', async () => {
      const response = await request(app)
        .delete(`/api/crafts/${testCraft._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify deletion
      const deletedCraft = await Craft.findById(testCraft._id);
      expect(deletedCraft).toBeNull();
    });

    it('should reject delete by non-admin user', async () => {
      const response = await request(app)
        .delete(`/api/crafts/${testCraft._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);

      // Verify craft still exists
      const craft = await Craft.findById(testCraft._id);
      expect(craft).toBeDefined();
    });
  });
});
