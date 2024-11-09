import { ThreadPool, MemoryCache } from '../index';


describe('ThreadPool', () => {
    let pool: ThreadPool;
  
    beforeEach(() => {
      pool = new ThreadPool({ maxThreads: 2 });
    });
  
    afterEach(() => {
      pool.shutdown();
    });
  
    it('executes tasks concurrently and returns results', async () => {
      const task = (data: number) => Promise.resolve(data * 2);
      const result1 = await pool.execute(task, 5);
      const result2 = await pool.execute(task, 10);
      
      expect(result1).toBe(10);
      expect(result2).toBe(20);
    });
  
    it('caches results for repeated tasks with same input', async () => {
      const task = (data: number) => Promise.resolve(data * 2);
      const result1 = await pool.execute(task, 5);
      const result2 = await pool.execute(task, 5);
  
      expect(result1).toBe(result2);
    });
  });

describe('MemoryCache', () => {
    let cache: MemoryCache;


  beforeEach(() => {
    cache = new MemoryCache({ ttl: 5000 });
  });

  it('stores and retrieves a value within TTL', () => {
    cache.set('testKey', 'testValue');
    expect(cache.get('testKey')).toBe('testValue');
  });

  it('expires a value after TTL', async () => {
    cache.set('testKey', 'testValue', 10);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(cache.get('testKey')).toBeNull();
  });
});
