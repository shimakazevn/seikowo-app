type EventCallback<T = any> = (data: T) => void;

interface EventEmitter {
  events: Record<string, EventCallback[]>;
  subscribe: <T = any>(event: string, callback: EventCallback<T>) => () => void;
  emit: <T = any>(event: string, data: T) => void;
}

const Emitter: EventEmitter = {
  events: {},
  subscribe: <T = any>(event: string, callback: EventCallback<T>) => {
    if (!Emitter.events[event]) Emitter.events[event] = [];
    Emitter.events[event].push(callback as EventCallback);
    return () => {
      Emitter.events[event] = Emitter.events[event].filter(cb => cb !== callback);
      if (Emitter.events[event].length === 0) delete Emitter.events[event];
    };
  },
  emit: <T = any>(event: string, data: T) => {
    if (Emitter.events[event]) {
      Emitter.events[event].forEach(callback => callback(data));
    }
  }
};

export default Emitter;
export const GoogleAuthEvents = Emitter; 