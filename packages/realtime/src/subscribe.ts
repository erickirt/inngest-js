import debug from "debug";
import { type Inngest } from "inngest";
import { topic } from "./topic";
import { Realtime } from "./types";
import { createDeferredPromise } from "./util";

/**
 * TODO
 */
export const subscribe = async <
  const InputChannel extends Realtime.Channel | string,
  const InputTopics extends (keyof Realtime.Channel.InferTopics<
    Realtime.Channel.AsChannel<InputChannel>
  > &
    string)[],
  const TToken extends Realtime.Subscribe.Token<
    Realtime.Channel.AsChannel<InputChannel>,
    InputTopics
  >,
  const TOutput extends Realtime.Subscribe.StreamSubscription<TToken>,
>(
  /**
   * TODO
   */
  app: Inngest.Like,

  /**
   * TODO
   */
  token: {
    /**
     * TODO
     */
    channel: Realtime.Subscribe.InferChannelInput<InputChannel>;

    /**
     * TODO
     */
    topics: InputTopics;
  },

  /**
   * TODO
   */
  callback?: Realtime.Subscribe.Callback<TToken>,
): Promise<TOutput> => {
  const subscription = new TokenSubscription(
    app,
    token as Realtime.Subscribe.Token,
  );
  const iterator = subscription.getIterator(subscription.getStream());

  await subscription.connect();

  const extras = {
    close: () => Promise.resolve(subscription.close()),
    cancel: () => subscription.close(),
    getStream: () => subscription.getStream(),
  };

  if (callback) {
    subscription.useCallback(subscription.getStream(), callback);
  }

  return Object.assign(iterator, extras) as unknown as TOutput;
};

/**
 * TODO
 */
export const getSubscriptionToken = async <
  const InputChannel extends Realtime.Channel | string,
  const InputTopics extends (keyof Realtime.Channel.InferTopics<
    Realtime.Channel.AsChannel<InputChannel>
  > &
    string)[],
  const TToken extends Realtime.Subscribe.Token<
    Realtime.Channel.AsChannel<InputChannel>,
    InputTopics
  >,
>(
  /**
   * TODO
   */
  app: Inngest.Like,

  /**
   * TODO
   */
  args: {
    /**
     * TODO
     */
    channel: Realtime.Subscribe.InferChannelInput<InputChannel>;

    /**
     * TODO
     */
    topics: InputTopics;
  },
): Promise<TToken> => {
  const channelId =
    typeof args.channel === "string" ? args.channel : args.channel.name;

  if (!channelId) {
    throw new Error("Channel ID is required to create a subscription token");
  }

  const key = await (app as Inngest.Any)["inngestApi"].getSubscriptionToken(
    channelId,
    args.topics,
  );

  const token = {
    channel: channelId,
    topics: args.topics,
    key,
  } as TToken;

  return token;
};

// Must be a new connection for every token used.
class TokenSubscription {
  #debug = debug("inngest:realtime");

  #running = false;

  #sourceStreamContoller: ReadableStreamDefaultController<Realtime.Message> | null =
    null;

  #sourceStream = new ReadableStream<Realtime.Message>({
    start: (controller) => {
      this.#sourceStreamContoller = controller;
    },
  });

  #createdStreamControllers = new Set<ReadableStreamDefaultController>();

  #ws: WebSocket | null = null;

  #chunkStreams = new Map<
    string,
    { stream: ReadableStream; controller: ReadableStreamDefaultController }
  >();

  #channelId: string;
  #topics: Map<string, Realtime.Topic.Definition>;

  constructor(
    public app: Inngest.Like,
    public token: Realtime.Subscribe.Token,
  ) {
    if (typeof token.channel === "string") {
      this.#channelId = token.channel;

      this.#topics = this.token.topics.reduce<
        Map<string, Realtime.Topic.Definition>
      >((acc, name) => {
        acc.set(name, topic(name));

        return acc;
      }, new Map<string, Realtime.Topic.Definition>());
    } else {
      this.#channelId = token.channel.name;

      this.#topics = this.token.topics.reduce<
        Map<string, Realtime.Topic.Definition>
      >((acc, name) => {
        acc.set(name, token.channel.topics[name] ?? topic(name));

        return acc;
      }, new Map<string, Realtime.Topic.Definition>());
    }
  }

  public async connect() {
    this.#debug(
      `Establishing connection to channel "${
        this.#channelId
      }" with topics ${JSON.stringify(this.#topics)}...`,
    );

    if (typeof WebSocket === "undefined") {
      throw new Error("WebSockets not supported in current environment");
    }

    const key =
      this.token.key || (await getSubscriptionToken(this.app, this.token)).key;
    if (!key) {
      throw new Error(
        "No subscription token key passed and failed to retrieve one automatically",
      );
    }

    const ret = createDeferredPromise<void>();

    try {
      this.#ws = new WebSocket(
        `ws://localhost:8288/v1/realtime/connect?token=${key}`,
      );

      this.#ws.onopen = () => {
        this.#debug("WebSocket connection established");
        ret.resolve();
      };

      this.#ws.onmessage = async (event) => {
        const parseRes = await Realtime.messageSchema.safeParseAsync(
          JSON.parse(event.data as string),
        );

        if (!parseRes.success) {
          this.#debug("Received invalid message:", parseRes.error);
          return;
        }

        const msg = parseRes.data;

        if (!this.#running) {
          this.#debug(
            `Received message on channel "${msg.channel}" for topic "${msg.topic}" but stream is closed`,
          );
        }

        switch (msg.kind) {
          case "data": {
            if (!msg.channel) {
              this.#debug(
                `Received message on channel "${msg.channel}" with no channel`,
              );
              return;
            }

            if (!msg.topic) {
              this.#debug(
                `Received message on channel "${msg.channel}" with no topic`,
              );
              return;
            }

            const topic = this.#topics.get(msg.topic);
            if (!topic) {
              this.#debug(
                `Received message on channel "${msg.channel}" for unknown topic "${msg.topic}"`,
              );
              return;
            }

            const schema = topic.getSchema();
            if (schema) {
              const validateRes = await schema["~standard"].validate(msg.data);
              if (validateRes.issues) {
                console.error(
                  `Received message on channel "${msg.channel}" for topic "${msg.topic}" that failed schema validation:`,
                  validateRes.issues,
                );
                return;
              }

              msg.data = validateRes.value;
            }

            this.#debug(
              `Received message on channel "${msg.channel}" for topic "${msg.topic}":`,
              msg.data,
            );
            return this.#sourceStreamContoller?.enqueue({
              channel: msg.channel,
              topic: msg.topic,

              data: msg.data,
              fnId: msg.fn_id,
              createdAt: msg.created_at || new Date(),
              runId: msg.run_id,
              kind: "data",
              envId: msg.env_id,
            });
          }

          case "datastream-start": {
            if (!msg.channel) {
              this.#debug(
                `Received message on channel "${msg.channel}" with no channel`,
              );
              return;
            }

            if (!msg.topic) {
              this.#debug(
                `Received message on channel "${msg.channel}" with no topic`,
              );
              return;
            }

            const streamId: unknown = msg.data;
            if (typeof streamId !== "string" || !streamId) {
              this.#debug(
                `Received message on channel "${msg.channel}" with no stream ID`,
              );
              return;
            }

            // `data` is a stream ID that we'll start receiving chunks with
            if (this.#chunkStreams.has(streamId)) {
              this.#debug(
                `Received message on channel "${msg.channel}" to create stream ID "${streamId}" that already exists`,
              );
              return;
            }

            const stream = new ReadableStream({
              start: (controller) => {
                this.#chunkStreams.set(streamId, { stream, controller });
              },

              cancel: () => {
                this.#chunkStreams.delete(streamId);
              },
            });

            this.#debug(
              `Created stream ID "${streamId}" on channel "${msg.channel}"`,
            );
            return this.#sourceStreamContoller?.enqueue({
              channel: msg.channel,
              topic: msg.topic,
              kind: "datastream-start",
              data: streamId,
              streamId,
              fnId: msg.fn_id,
              runId: msg.run_id,
              stream,
            });
          }

          case "datastream-end": {
            if (!msg.channel) {
              this.#debug(
                `Received message on channel "${msg.channel}" with no channel`,
              );
              return;
            }

            if (!msg.topic) {
              this.#debug(
                `Received message on channel "${msg.channel}" with no topic`,
              );
              return;
            }

            const streamId: unknown = msg.data;
            if (typeof streamId !== "string" || !streamId) {
              this.#debug(
                `Received message on channel "${msg.channel}" with no stream ID`,
              );
              return;
            }

            // `data` is a stream ID that we'll stop receiving chunks with
            const stream = this.#chunkStreams.get(streamId);
            if (!stream) {
              this.#debug(
                `Received message on channel "${msg.channel}" to close stream ID "${streamId}" that doesn't exist`,
              );
              return;
            }

            stream.controller.close();
            this.#chunkStreams.delete(streamId);

            this.#debug(
              `Closed stream ID "${streamId}" on channel "${msg.channel}"`,
            );
            return this.#sourceStreamContoller?.enqueue({
              channel: msg.channel,
              topic: msg.topic,
              kind: "datastream-end",
              data: streamId,
              streamId,
              fnId: msg.fn_id,
              runId: msg.run_id,
              stream: stream.stream,
            });
          }

          case "chunk": {
            if (!msg.channel) {
              this.#debug(
                `Received message on channel "${msg.channel}" with no channel`,
              );
              return;
            }

            if (!msg.topic) {
              this.#debug(
                `Received message on channel "${msg.channel}" with no topic`,
              );
              return;
            }

            // `stream_id` is the ID of the stream we're receiving chunks for
            if (!msg.stream_id) {
              this.#debug(
                `Received message on channel "${msg.channel}" with no stream ID`,
              );
              return;
            }

            const stream = this.#chunkStreams.get(msg.stream_id);
            if (!stream) {
              this.#debug(
                `Received message on channel "${msg.channel}" for unknown stream ID "${msg.stream_id}"`,
              );
              return;
            }

            this.#debug(
              `Received chunk on channel "${msg.channel}" for stream ID "${msg.stream_id}":`,
              msg.data,
            );

            stream.controller.enqueue(msg.data);

            return this.#sourceStreamContoller?.enqueue({
              channel: msg.channel,
              topic: msg.topic,
              kind: "chunk",

              data: msg.data,
              streamId: msg.stream_id,
              fnId: msg.fn_id,
              runId: msg.run_id,
              stream: stream.stream,
            });
          }

          default: {
            this.#debug(
              `Received message on channel "${msg.channel}" with unhandled kind "${msg.kind}"`,
            );
            return;
          }
        }
      };

      this.#ws.onerror = (event) => {
        console.error("WebSocket error observed:", event);
        ret.reject(event);
      };

      this.#ws.onclose = (event) => {
        this.#debug("WebSocket closed:", event.reason);
        this.close();
      };

      this.#running = true;
    } catch (err) {
      ret.reject(err);
    }

    void (async () => {
      const reader = this.#sourceStream.getReader();

      while (this.#running) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        for (const controller of this.#createdStreamControllers) {
          controller.enqueue(value);
        }
      }
    })();

    return ret.promise;
  }

  public close(reason: string = "Userland closed connection") {
    if (!this.#running) {
      return;
    }

    this.#debug("close() called; closing connection...");
    this.#running = false;
    this.#ws?.close(1000, reason);

    this.#debug(`Closing ${this.#createdStreamControllers.size} streams...`);
    this.#sourceStreamContoller?.close();
    this.#createdStreamControllers.forEach((controller) => controller.close());
  }

  public getStream() {
    let controller: ReadableStreamDefaultController;

    const stream = new ReadableStream<Realtime.Message>({
      start: (_controller) => {
        controller = _controller;
        this.#createdStreamControllers.add(controller);
      },

      cancel: () => {
        this.#createdStreamControllers.delete(controller);
      },
    });

    return stream;
  }

  public getIterator(stream: ReadableStream<Realtime.Message>) {
    return {
      [Symbol.asyncIterator]: () => {
        const reader = stream.getReader();

        return {
          next: () => {
            return reader.read();
          },

          return: () => {
            reader.releaseLock();
            return Promise.resolve({ done: true, value: undefined });
          },
        };
      },
    };
  }

  public useCallback(
    stream: ReadableStream<Realtime.Message>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: Realtime.Subscribe.Callback<any>,
  ) {
    void (async () => {
      const reader = stream.getReader();

      for (;;) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        callback(value);
      }
    })();
  }
}
