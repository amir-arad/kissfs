import {makeEventsEmitter} from "./utils";

import {EventEmitter, Events} from "./api";
import {delayedPromise} from "./promise-utils";


export interface EventHandler<S extends keyof Events> {
    types: S[];
    filter: (e: Events[S]) => boolean;
    apply: (e: Events[S]) => Events[S] | void;
}

interface RegisteredEventHandler extends EventHandler<any> {
    timer: NodeJS.Timer;
}

export namespace EventsManager {
    export interface Options {
        delay?: number
    }
}

export class EventsManager {
    public readonly events: EventEmitter = makeEventsEmitter();
    private eventHandlers = new Set<RegisteredEventHandler>();

    constructor(private options: EventsManager.Options = {}) {

    }

    emit(e: Events[keyof Events]) {
        if (this.options.delay) {
            delayedPromise(this.options.delay)
                .then(() => this._emit(e));
        } else {
            this._emit(e);
        }
    }

    addEventHandler<S extends keyof Events>(handler: EventHandler<S>, timeout?: number) {
        let _handler = handler as RegisteredEventHandler;
        if (timeout) {
            (_handler).timer = setTimeout(() => this.eventHandlers.delete(_handler), timeout);
        }
        this.eventHandlers.add(_handler);
    }

    removeEventHandler<S extends keyof Events>(handler: EventHandler<S>) {
        this.eventHandlers.delete(handler as RegisteredEventHandler);
        clearTimeout((handler as RegisteredEventHandler).timer);
    }

    private _emit(e: Events[keyof Events]) {
        this.eventHandlers.forEach(handler => {
            if (e && ~handler.types.indexOf(e.type) && handler.filter(e)) {
                e = handler.apply(e);
            }
        });
        if (e) {
            (this.events as any).emit(e.type, e);
        }
    }
}
