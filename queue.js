export class QueueNode {
    constructor(data) {
        this.data = data;
        this.next = null;
    }
}

export class Queue {
    constructor() {
        this.front = null;
        this.rear = null;
        this.size = 0;
    }

    // Enqueue: Add an element to the rear (O(1))
    enqueue(data) {
        const newNode = new QueueNode(data);
        if (this.size === 0) {
            this.front = this.rear = newNode;
        } else {
            this.rear.next = newNode;
            this.rear = newNode;
        }
        this.size++;
    }

    // Dequeue: Remove an element from the front (O(1))
    dequeue() {
        if (this.size === 0) {
            throw new Error("Queue is empty");
        }
        const removedNode = this.front;
        this.front = this.front.next;
        if (this.size === 1) {
            this.rear = null; // If there was only one element, set rear to null
        }
        this.size--;
        return removedNode.data;
    }

    // Peek: Get the front element without removing it (O(1))
    peek() {
        if (this.size === 0) {
            throw new Error("Queue is empty");
        }
        return this.front.data;
    }

    // Check if the queue is empty (O(1))
    isEmpty() {
        return this.size === 0;
    }

    // Get the size of the queue (O(1))
    getSize() {
        return this.size;
    }
}
