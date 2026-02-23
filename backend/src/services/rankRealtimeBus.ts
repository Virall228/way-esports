import { EventEmitter } from 'events';

export type RankUpdateEvent = {
  userId?: string;
  previousRating: number;
  newRating: number;
  delta: number;
  at: string;
};

class RankRealtimeBus extends EventEmitter {
  emitRankUpdate(event: RankUpdateEvent) {
    this.emit('rank_update', event);
  }
}

export const rankRealtimeBus = new RankRealtimeBus();

