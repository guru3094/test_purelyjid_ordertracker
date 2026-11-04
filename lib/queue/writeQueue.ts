import { QueueItem } from "./queueTypes";

const queue: QueueItem[] = [];

export function enqueue(item: QueueItem) {

    queue.push(item);

}

export function dequeue() {

    return queue.shift();

}

export function getQueueSize() {

    return queue.length;

}

export function isQueueEmpty() {

    return queue.length === 0;

}
