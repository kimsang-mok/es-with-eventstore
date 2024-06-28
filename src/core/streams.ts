import {
  EventType,
  RecordedEvent,
  ResolvedEvent,
  StreamingRead,
} from '@eventstore/db-client';

export type ApplyEvent<Entity, E extends EventType> = (
  currentState: Entity | undefined,
  event: RecordedEvent<E>,
) => Entity;

export const StreamAggregator =
  <Entity, E extends EventType>(when: ApplyEvent<Entity, E>) =>
  async (eventStream: StreamingRead<ResolvedEvent<E>>): Promise<Entity> => {
    let currentState: Entity | undefined = undefined;

    for await (const { event } of eventStream) {
      if (!event) continue;
      currentState = when(currentState, event);
    }

    if (currentState == null) throw new Error('Stream not found');

    return currentState;
  };
