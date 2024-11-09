import { Worker, parentPort, workerData } from 'worker_threads';
import { EventEmitter } from 'events';

interface CacheOptions {
    ttl?: number;
    maxSize?: number;
}

interface WorkerData {
    task: string;
    data: any;
}

interface Task<T> {
    task: (data: any) => Promise<T>;
    data: any;
    cacheKey: string;
    resolve: (value: T) => void;
    reject: (reason?: any) => void;
}

class MemoryCache {
    private cache = new Map<string, { value: any; expiry: number }>();
    private ttl: number;
    private maxSize: number;

    constructor(options: CacheOptions = {}) {
        this.ttl = options.ttl || 3600000; // Default 1 hour
        this.maxSize = options.maxSize || 1000;
        this._cleanup();
    }

    set(key: string, value: any, ttl: number = this.ttl): void {
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value as string;
            if (oldestKey) {
                this.cache.delete(oldestKey);
            }
        }

        this.cache.set(key, {
            value,
            expiry: Date.now() + ttl
        });
    }

    get(key: string): any | null {
        const item = this.cache.get(key);
        if (!item) return null;
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }
        return item.value;
    }

    private _cleanup(): void {
        setInterval(() => {
            const now = Date.now();
            for (const [key, item] of this.cache.entries()) {
                if (now > item.expiry) {
                    this.cache.delete(key);
                }
            }
        }, 60000); // Cleanup every minute
    }
}

class ThreadPool extends EventEmitter {
    private maxThreads: number;
    private workers: Map<Worker, Task<any>>;
    private taskQueue: Task<any>[];
    private cache: MemoryCache;
    private busy: boolean;

    constructor(options: { maxThreads?: number; cache?: CacheOptions } = {}) {
        super();
        this.maxThreads = options.maxThreads || 4; // Default 4 threads
        this.workers = new Map();
        this.taskQueue = [];
        this.cache = new MemoryCache(options.cache);
        this.busy = false;
    }

    execute<T>(task: (data: any) => Promise<T>, data: any): Promise<T> {
        const cacheKey = JSON.stringify({ task: task.toString(), data });
        const cachedResult = this.cache.get(cacheKey);

        if (cachedResult) {
            return Promise.resolve(cachedResult);
        }

        return new Promise((resolve, reject) => {
            const workItem: Task<T> = { task, data, cacheKey, resolve, reject };
            this.taskQueue.push(workItem);
            this._processQueue();
        });
    }

    private _processQueue(): void {
        if (this.busy || this.taskQueue.length === 0) return;
        this.busy = true;

        while (this.taskQueue.length > 0 && this.workers.size < this.maxThreads) {
            const workItem = this.taskQueue.shift();
            if (workItem) this._createWorker(workItem);
        }

        this.busy = false;
    }

    private _createWorker(workItem: Task<any>) {
        if (!workItem) {
            throw new Error("Work item is undefined");
        }

        const worker = new Worker(`
          const { parentPort, workerData } = require('worker_threads');
          async function executeTask() {
            const taskFn = new Function('return ' + workerData.task)();
            const result = await taskFn(workerData.data);
            parentPort.postMessage(result);
          }
          executeTask().catch(error => {
            parentPort.emit('error', error);
          });
        `, { eval: true, workerData: { task: workItem.task.toString(), data: workItem.data } });

        this.workers.set(worker, workItem);

        worker.on('message', (result) => {
            const workItem = this.workers.get(worker);
            if (!workItem) return; // Check if workItem is undefined before proceeding
            this.cache.set(workItem.cacheKey, result);
            workItem.resolve(result);
            this._cleanupWorker(worker);
        });

        worker.on('error', (error) => {
            const workItem = this.workers.get(worker);
            if (!workItem) return; // Check if workItem is undefined before proceeding
            workItem.reject(error);
            this._cleanupWorker(worker);
        });

        worker.on('exit', () => {
            this._cleanupWorker(worker);
        });
    }

    private _cleanupWorker(worker: Worker): void {
        this.workers.delete(worker);
        this._processQueue();
    }

    shutdown(): void {
        for (const worker of this.workers.keys()) {
            worker.terminate();
        }
        this.workers.clear();
        this.taskQueue = [];
    }
}

export { ThreadPool, MemoryCache };
