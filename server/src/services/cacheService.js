const { createClient } = require('redis');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.defaultTTL = 3600; // 1 hour
  }

  async connect() {
    if (this.client && this.isConnected) {
      return this.client;
    }

    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.error('Redis: Max reconnection attempts reached');
              return new Error('Max reconnection attempts reached');
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis: Connected');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        console.log('Redis: Disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
      return this.client;
    } catch (error) {
      console.error('Redis Connection Error:', error);
      this.isConnected = false;
      return null;
    }
  }

  async get(key) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      if (!this.client) return null;
      return await this.client.get(key);
    } catch (error) {
      console.error('Redis GET Error:', error);
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      if (!this.client) return false;
      
      if (ttl) {
        await this.client.setEx(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (error) {
      console.error('Redis SET Error:', error);
      return false;
    }
  }

  async delete(key) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      if (!this.client) return false;
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis DELETE Error:', error);
      return false;
    }
  }

  async deletePattern(pattern) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      if (!this.client) return false;

      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      console.error('Redis DELETE Pattern Error:', error);
      return false;
    }
  }

  async invalidateUserCache(userId) {
    return this.deletePattern(`*:${userId}:*`);
  }

  async getOrSet(key, fetchFn, ttl = this.defaultTTL) {
    const cached = await this.get(key);
    if (cached) {
      return JSON.parse(cached);
    }

    const data = await fetchFn();
    await this.set(key, JSON.stringify(data), ttl);
    return data;
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      this.client = null;
    }
  }

  async healthCheck() {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      if (!this.client) {
        return { status: 'unhealthy', message: 'Client not connected' };
      }
      await this.client.ping();
      return { status: 'healthy' };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}

module.exports = new CacheService();
