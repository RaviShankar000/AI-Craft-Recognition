/**
 * Integration tests for marketplace/product API
 * Tests complete workflows for product management and marketplace operations
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const Product = require('../../models/Product');
const User = require('../../models/User');
const Craft = require('../../models/Craft');

describe('Marketplace API Integration Tests', () => {
  let adminToken;
  let sellerToken;
  let userToken;
  let adminUser;
  let sellerUser;
  let normalUser;
  let testCraft;
  let testProduct;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Create test users
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@marketplace.test',
      password: 'AdminPass123!',
      role: 'admin',
      active: true,
    });

    sellerUser = await User.create({
      name: 'Seller User',
      email: 'seller@marketplace.test',
      password: 'SellerPass123!',
      role: 'seller',
      active: true,
    });

    normalUser = await User.create({
      name: 'Normal User',
      email: 'user@marketplace.test',
      password: 'UserPass123!',
      role: 'user',
      active: true,
    });

    // Create test craft
    testCraft = await Craft.create({
      name: 'Test Craft',
      description: 'Craft for testing',
      category: 'Test',
      origin: 'Test',
      materials: ['test'],
    });

    // Generate tokens
    adminToken = adminUser.generateAuthToken();
    sellerToken = sellerUser.generateAuthToken();
    userToken = normalUser.generateAuthToken();
  });

  afterAll(async () => {
    // Cleanup
    await User.deleteMany({});
    await Product.deleteMany({});
    await Craft.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear products before each test
    await Product.deleteMany({});
  });

  describe('GET /api/products - Get all products', () => {
    beforeEach(async () => {
      // Create approved products
      await Product.create([
        {
          name: 'Handmade Pottery Bowl',
          description: 'Beautiful ceramic bowl',
          price: 45.99,
          craft: testCraft._id,
          seller: sellerUser._id,
          stock: 10,
          status: 'approved',
        },
        {
          name: 'Woven Basket',
          description: 'Traditional basket',
          price: 35.50,
          craft: testCraft._id,
          seller: sellerUser._id,
          stock: 5,
          status: 'approved',
        },
        {
          name: 'Pending Product',
          description: 'Not yet approved',
          price: 25.00,
          craft: testCraft._id,
          seller: sellerUser._id,
          stock: 3,
          status: 'pending',
        },
      ]);
    });

    it('should return only approved products for public', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2); // Only approved
      expect(response.body.data.every(p => p.status === 'approved')).toBe(true);
    });

    it('should include seller own pending products when authenticated as seller', async () => {
      const response = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(3); // Approved + own pending
    });

    it('should filter by price range', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ minPrice: 40, maxPrice: 50 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Handmade Pottery Bowl');
    });

    it('should sort by price', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ sortBy: 'price', order: 'desc' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data[0].price).toBeGreaterThan(response.body.data[1].price);
    });
  });

  describe('POST /api/products - Create product', () => {
    const validProductData = {
      name: 'New Craft Product',
      description: 'A beautiful handmade product',
      price: 59.99,
      craft: null, // Will be set in test
      stock: 15,
      materials: ['wood', 'paint'],
      dimensions: { length: 10, width: 8, height: 5 },
    };

    beforeEach(() => {
      validProductData.craft = testCraft._id.toString();
    });

    it('should allow seller to create product', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(validProductData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('New Craft Product');
      expect(response.body.data.status).toBe('pending'); // Awaiting approval
      expect(response.body.data.seller.toString()).toBe(sellerUser._id.toString());
    });

    it('should allow admin to create product', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validProductData)
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should reject product creation by regular user', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validProductData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not authorized');
    });

    it('should validate price is positive', async () => {
      const invalidData = { ...validProductData, price: -10 };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate stock is non-negative', async () => {
      const invalidData = { ...validProductData, stock: -5 };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Product Moderation Flow', () => {
    beforeEach(async () => {
      testProduct = await Product.create({
        name: 'Pending Approval Product',
        description: 'Awaiting moderation',
        price: 49.99,
        craft: testCraft._id,
        seller: sellerUser._id,
        stock: 8,
        status: 'pending',
      });
    });

    describe('PATCH /api/products/:id/approve - Approve product', () => {
      it('should allow admin to approve product', async () => {
        const response = await request(app)
          .patch(`/api/products/${testProduct._id}/approve`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe('approved');

        // Verify in database
        const product = await Product.findById(testProduct._id);
        expect(product.status).toBe('approved');
      });

      it('should reject approval by seller', async () => {
        const response = await request(app)
          .patch(`/api/products/${testProduct._id}/approve`)
          .set('Authorization', `Bearer ${sellerToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
      });

      it('should reject approval by regular user', async () => {
        const response = await request(app)
          .patch(`/api/products/${testProduct._id}/approve`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
      });
    });

    describe('PATCH /api/products/:id/reject - Reject product', () => {
      it('should allow admin to reject product with reason', async () => {
        const response = await request(app)
          .patch(`/api/products/${testProduct._id}/reject`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ reason: 'Does not meet quality standards' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe('rejected');
        expect(response.body.data.rejectionReason).toBe('Does not meet quality standards');
      });

      it('should require rejection reason', async () => {
        const response = await request(app)
          .patch(`/api/products/${testProduct._id}/reject`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({})
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('PUT /api/products/:id - Update product', () => {
    beforeEach(async () => {
      testProduct = await Product.create({
        name: 'Editable Product',
        description: 'Can be edited',
        price: 39.99,
        craft: testCraft._id,
        seller: sellerUser._id,
        stock: 12,
        status: 'approved',
      });
    });

    it('should allow seller to update own product', async () => {
      const updateData = {
        description: 'Updated description',
        price: 44.99,
        stock: 15,
      };

      const response = await request(app)
        .put(`/api/products/${testProduct._id}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBe('Updated description');
      expect(response.body.data.price).toBe(44.99);
      expect(response.body.data.stock).toBe(15);
    });

    it('should prevent seller from updating other seller products', async () => {
      // Create another seller
      const otherSeller = await User.create({
        name: 'Other Seller',
        email: 'other@seller.test',
        password: 'Pass123!',
        role: 'seller',
      });
      const otherToken = otherSeller.generateAuthToken();

      const response = await request(app)
        .put(`/api/products/${testProduct._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ price: 1.00 })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should allow admin to update any product', async () => {
      const response = await request(app)
        .put(`/api/products/${testProduct._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 99.99 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.price).toBe(99.99);
    });
  });

  describe('DELETE /api/products/:id - Delete product', () => {
    beforeEach(async () => {
      testProduct = await Product.create({
        name: 'Deletable Product',
        description: 'Can be deleted',
        price: 29.99,
        craft: testCraft._id,
        seller: sellerUser._id,
        stock: 5,
        status: 'approved',
      });
    });

    it('should allow seller to delete own product', async () => {
      const response = await request(app)
        .delete(`/api/products/${testProduct._id}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify deletion
      const product = await Product.findById(testProduct._id);
      expect(product).toBeNull();
    });

    it('should allow admin to delete any product', async () => {
      const response = await request(app)
        .delete(`/api/products/${testProduct._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should prevent regular user from deleting products', async () => {
      const response = await request(app)
        .delete(`/api/products/${testProduct._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);

      // Verify product still exists
      const product = await Product.findById(testProduct._id);
      expect(product).toBeDefined();
    });
  });
});
