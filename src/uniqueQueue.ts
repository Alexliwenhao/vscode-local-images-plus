export class UniqueQueue<T> {
    private items: Map<string, T>;
    private maxAttempts: number;
    private attempts: Map<string, number>;

    constructor(maxAttempts: number = 3) {
        this.items = new Map();
        this.maxAttempts = maxAttempts;
        this.attempts = new Map();
    }

    push(item: T, id?: string): void {
        const itemId = id || JSON.stringify(item);
        if (!this.items.has(itemId)) {
            this.items.set(itemId, item);
            this.attempts.set(itemId, 0);
        }
    }

    pop(): T | undefined {
        const entries = Array.from(this.items.entries());
        if (entries.length === 0) return undefined;

        const [id, item] = entries[0];
        const attemptCount = this.attempts.get(id) || 0;

        if (attemptCount >= this.maxAttempts) {
            this.items.delete(id);
            this.attempts.delete(id);
            return undefined;
        }

        this.attempts.set(id, attemptCount + 1);
        return item;
    }

    clear(): void {
        this.items.clear();
        this.attempts.clear();
    }

    size(): number {
        return this.items.size;
    }
}
