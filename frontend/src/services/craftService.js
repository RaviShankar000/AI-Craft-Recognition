import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class CraftService {
  constructor() {
    this.token = null;
  }

  /**
   * Set authentication token
   * @param {String} token - JWT token
   */
  setToken(token) {
    this.token = token;
  }

  /**
   * Get authentication headers
   * @returns {Object} Headers with authorization
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Search crafts by text query
   * @param {String} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise} Search results
   */
  async searchCrafts(query, options = {}) {
    try {
      const { state, category, page = 1, limit = 20 } = options;

      const params = new URLSearchParams({
        search: query,
        page: page.toString(),
        limit: limit.toString(),
      });

      if (state) {
        params.append('state', state);
      }

      if (category) {
        params.append('category', category);
      }

      const response = await axios.get(`${API_URL}/crafts?${params.toString()}`, {
        headers: this.getHeaders(),
      });

      return {
        success: true,
        data: response.data.data,
        count: response.data.count,
        total: response.data.total,
        page: response.data.page,
        pages: response.data.pages,
      };
    } catch (error) {
      console.error('Craft search error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to search crafts',
        message: error.message,
      };
    }
  }

  /**
   * Voice search crafts with enhanced sanitization
   * @param {String} query - Voice search query
   * @param {Object} options - Search options
   * @returns {Promise} Search results
   */
  async voiceSearchCrafts(query, options = {}) {
    try {
      const { state, category, page = 1, limit = 20 } = options;

      const params = new URLSearchParams({
        query: query,
        page: page.toString(),
        limit: limit.toString(),
      });

      if (state) {
        params.append('state', state);
      }

      if (category) {
        params.append('category', category);
      }

      const response = await axios.get(`${API_URL}/crafts/voice-search?${params.toString()}`, {
        headers: this.getHeaders(),
      });

      return {
        success: true,
        data: response.data.data,
        count: response.data.count,
        total: response.data.total,
        page: response.data.page,
        pages: response.data.pages,
        query: response.data.query,
      };
    } catch (error) {
      console.error('Voice search error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to search crafts',
        message: error.message,
      };
    }
  }

  /**
   * Get all crafts
   * @param {Object} options - Query options
   * @returns {Promise} Crafts list
   */
  async getAllCrafts(options = {}) {
    try {
      const { state, category, page = 1, limit = 10 } = options;

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (state) {
        params.append('state', state);
      }

      if (category) {
        params.append('category', category);
      }

      const response = await axios.get(`${API_URL}/crafts?${params.toString()}`, {
        headers: this.getHeaders(),
      });

      return {
        success: true,
        data: response.data.data,
        count: response.data.count,
        total: response.data.total,
        page: response.data.page,
        pages: response.data.pages,
      };
    } catch (error) {
      console.error('Get crafts error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get crafts',
        message: error.message,
      };
    }
  }

  /**
   * Get craft by ID
   * @param {String} id - Craft ID
   * @returns {Promise} Craft details
   */
  async getCraftById(id) {
    try {
      const response = await axios.get(`${API_URL}/crafts/${id}`, {
        headers: this.getHeaders(),
      });

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Get craft error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get craft',
        message: error.message,
      };
    }
  }

  /**
   * Create a new craft
   * @param {Object} craftData - Craft data
   * @returns {Promise} Created craft
   */
  async createCraft(craftData) {
    try {
      const response = await axios.post(`${API_URL}/crafts`, craftData, {
        headers: this.getHeaders(),
      });

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Create craft error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create craft',
        message: error.message,
      };
    }
  }

  /**
   * Update craft
   * @param {String} id - Craft ID
   * @param {Object} craftData - Updated craft data
   * @returns {Promise} Updated craft
   */
  async updateCraft(id, craftData) {
    try {
      const response = await axios.put(`${API_URL}/crafts/${id}`, craftData, {
        headers: this.getHeaders(),
      });

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Update craft error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update craft',
        message: error.message,
      };
    }
  }

  /**
   * Delete craft
   * @param {String} id - Craft ID
   * @returns {Promise} Deletion result
   */
  async deleteCraft(id) {
    try {
      const response = await axios.delete(`${API_URL}/crafts/${id}`, {
        headers: this.getHeaders(),
      });

      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Delete craft error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete craft',
        message: error.message,
      };
    }
  }
}

export default new CraftService();
