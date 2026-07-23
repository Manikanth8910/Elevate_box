export interface DomainEvent {
  eventName: string;
  payload: any;
  timestamp: string;
}

export type EventHandler = (event: DomainEvent) => Promise<void>;

export class EventBus {
  private subscribers: Map<string, EventHandler[]> = new Map();

  subscribe(eventName: string, handler: EventHandler): void {
    const handlers = this.subscribers.get(eventName) || [];
    handlers.push(handler);
    this.subscribers.set(eventName, handlers);
  }

  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.subscribers.get(event.eventName) || [];
    
    // Execute all handlers concurrently without blocking the main thread necessarily, 
    // or await them if strong consistency is required. 
    // For a robust system, these would be pushed to a queue (e.g., SQS, RabbitMQ).
    await Promise.allSettled(handlers.map(handler => handler(event)));
  }
}

export const globalEventBus = new EventBus();
