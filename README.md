# ThreadBurst

This repository provides a simple and efficient implementation of a **ThreadPool** for handling asynchronous tasks using **worker threads** in Node.js. Additionally, it includes a **MemoryCache** to optimize task execution by caching results and preventing redundant calculations.

## Features

- **ThreadPool**:
  - Executes tasks in a pool of worker threads.
  - Automatically manages the number of concurrent workers based on available CPU cores or a custom maximum number of threads.
  - Tasks can be cached for faster execution if the same task and data are requested again.

- **MemoryCache**:
  - Stores task results in memory with an optional time-to-live (TTL) and maximum size.
  - Automatically cleans up expired cache entries and evicts the oldest entries when the cache exceeds the maximum size.

## Installation

To use the ThreadPool and MemoryCache classes in your Node.js project, follow these steps:

1. Install the package via npm or yarn.

```bash
npm install thread-burst
``` 

2. Alternatively, you can download the files and integrate them into your project.


## Usage

**Example: Using the `ThreadPool` and `MemoryCache` **

```javascript

import { ThreadPool, MemoryCache } from 'thread-burst';

// Create a new ThreadPool instance
const threadPool = new ThreadPool({
  maxThreads: 4, // Maximum number of threads (default is number of CPU cores)
  cache: {
    ttl: 3600000, // 1 hour TTL for cache
    maxSize: 1000, // Maximum cache size
  }
});

// Example task to run
const task = async (data: string) => {
  return new Promise<string>((resolve) => {
    setTimeout(() => {
      resolve(`Processed: ${data}`);
    }, 1000); // Simulate async work
  });
};

// Execute the task with the ThreadPool
threadPool.execute(task, 'Hello, World!')
  .then((result) => {
    console.log(result); // Output: Processed: Hello, World!
  })
  .catch((error) => {
    console.error('Error executing task:', error);
  });
```

**Using `MemoryCache` to Store and Retrieve Cached Results**

```javascript

import { MemoryCache } from 'threadpool-memorycache';

// Create a new MemoryCache instance
const cache = new MemoryCache({
  ttl: 300000, // 5 minutes TTL
  maxSize: 500, // Maximum cache size
});

// Set an item in the cache
cache.set('key1', 'value1');

// Get an item from the cache
const value = cache.get('key1');
console.log(value); // Output: value1

// Get an item from the cache that doesn't exist
const nonExistent = cache.get('key2');
console.log(nonExistent); // Output: null

```

## API Documentation

`ThreadPool`

__Constructor__ : `ThreadPool(options: { maxThreads?: number; cache?: CacheOptions })`
+ `maxThreads`: Maximum number of worker threads in the pool. Defaults to the number of CPU cores available.
+ `cache`: Options for the cache (optional). Includes ttl (time-to-live in milliseconds) and maxSize (maximum number of items to store).

__Method__ : `execute<T>(task: (data: any) => Promise<T>, data: any): Promise<T>`
+ `task`: A function that returns a Promise and takes the task data as an argument.
+ `data`: Data to be passed to the task function.
Returns a `Promise<T>` that resolves with the result of the task.

__Method__ : `shutdown(): void`
Terminates all worker threads and clears the task queue.

`MemoryCache`

__Constructor__ : `MemoryCache(options: CacheOptions)`
+ `ttl`: Time-to-live for cache items in milliseconds. Defaults to 1 hour (3600000ms).
+ `maxSize`: Maximum number of items the cache can store. Defaults to 1000.

__Method__: `set(key: string, value: any, ttl?: number): void`
+ `key`: Cache key.
+ `value`: Value to store.
+ `ttl`: Optional TTL for the cache item. Defaults to the cache's TTL.

__Method__: `get(key: string): any | null`
+ `key`: Cache key.
+ Returns the cached value or `null` if the item is expired or doesn't exist.


## License
This project is licensed under the MIT License 


## Contributing
Feel free to fork this repository and submit pull requests for improvements or bug fixes.

1. Fork the repository
2. Create a new branch (git checkout -b feature/your-feature)
3. Commit your changes (git commit -am 'Add new feature')
4. Push to the branch (git push origin feature/your-feature)
