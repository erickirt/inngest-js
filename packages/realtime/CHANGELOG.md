# @inngest/realtime

## 0.3.1

### Patch Changes

- [#960](https://github.com/inngest/inngest-js/pull/960) [`fc966ca`](https://github.com/inngest/inngest-js/commit/fc966ca94f699d6534f2fc5c85bbcf5be3c6795a) Thanks [@jpwilliams](https://github.com/jpwilliams)! - Fix requiring signing key for dev in `@inngest/realtime`

- [#965](https://github.com/inngest/inngest-js/pull/965) [`e55d93e`](https://github.com/inngest/inngest-js/commit/e55d93ef481010e677623978ec89e918fcdd606e) Thanks [@jpwilliams](https://github.com/jpwilliams)! - Fix throw of `TypeError: Failed to execute 'cancel' on 'ReadableStream': Cannot cancel a locked stream` when unmounting or cancelling a stream utilizing the callback feature

- [#964](https://github.com/inngest/inngest-js/pull/964) [`e674884`](https://github.com/inngest/inngest-js/commit/e67488412e4d052ce161f6d5ea719db6786880de) Thanks [@jpwilliams](https://github.com/jpwilliams)! - Fix fanout writers throwing during some closures

- [#959](https://github.com/inngest/inngest-js/pull/959) [`50d627e`](https://github.com/inngest/inngest-js/commit/50d627ecdc2fc28ebca046e3a4ab9980f1714132) Thanks [@jpwilliams](https://github.com/jpwilliams)! - Fix being unable to access environment variables in some bundled environments

- [#960](https://github.com/inngest/inngest-js/pull/960) [`fc966ca`](https://github.com/inngest/inngest-js/commit/fc966ca94f699d6534f2fc5c85bbcf5be3c6795a) Thanks [@jpwilliams](https://github.com/jpwilliams)! - Fix debug log incorrectly displaying topics we're subscribing to

## 0.3.0

### Minor Changes

- [#949](https://github.com/inngest/inngest-js/pull/949) [`d18006d`](https://github.com/inngest/inngest-js/commit/d18006dbffe7501b145f914992951439a9859261) Thanks [@jpwilliams](https://github.com/jpwilliams)! - `useInngestSubscription()` no longer accepts an `app`; always use a `token` when subscribing on the client

- [#949](https://github.com/inngest/inngest-js/pull/949) [`d18006d`](https://github.com/inngest/inngest-js/commit/d18006dbffe7501b145f914992951439a9859261) Thanks [@jpwilliams](https://github.com/jpwilliams)! - `subscribe()` call no longer accepts an `app` as the first parameter

  One can be passed alongside other arguments, e.g.

  ```ts
  subscribe({
    app,
    channel: "hello-world",
    topics: ["messages"],
  });
  ```

  An app is still required if you are not using a token retrieved from `getSubscriptionToken()`.

### Patch Changes

- [#949](https://github.com/inngest/inngest-js/pull/949) [`d18006d`](https://github.com/inngest/inngest-js/commit/d18006dbffe7501b145f914992951439a9859261) Thanks [@jpwilliams](https://github.com/jpwilliams)! - Public environment variables (such as `NEXT_PUBLIC_*`) are now also accessed when looking for Inngest during subscriptions

- [#949](https://github.com/inngest/inngest-js/pull/949) [`d18006d`](https://github.com/inngest/inngest-js/commit/d18006dbffe7501b145f914992951439a9859261) Thanks [@jpwilliams](https://github.com/jpwilliams)! - Environment variables are also now captured in Deno and Netlify

## 0.2.0

### Minor Changes

- [#930](https://github.com/inngest/inngest-js/pull/930) [`8e71cdd`](https://github.com/inngest/inngest-js/commit/8e71cddda13289bcc3a1f0bff7cff9cec54439ae) Thanks [@jpwilliams](https://github.com/jpwilliams)! - `fnId` and `runId` in streamed messages are now optional

### Patch Changes

- [#930](https://github.com/inngest/inngest-js/pull/930) [`8e71cdd`](https://github.com/inngest/inngest-js/commit/8e71cddda13289bcc3a1f0bff7cff9cec54439ae) Thanks [@jpwilliams](https://github.com/jpwilliams)! - Fix bad parsing of some message types

## 0.1.2

### Patch Changes

- [#927](https://github.com/inngest/inngest-js/pull/927) [`dc00cbf`](https://github.com/inngest/inngest-js/commit/dc00cbf197c776b8ff04fb67cbc1d3a62569f6d0) Thanks [@jpwilliams](https://github.com/jpwilliams)! - Fix connecting to production; avoid `ws://` `301` redirect

## 0.1.1

### Patch Changes

- [#914](https://github.com/inngest/inngest-js/pull/914) [`9a5dd61`](https://github.com/inngest/inngest-js/commit/9a5dd61abb03936bf2df6196ee48e626508b70bf) Thanks [@tonyhb](https://github.com/tonyhb)! - Allow customization of the dev server URL in realtime

- Updated dependencies [[`9a5dd61`](https://github.com/inngest/inngest-js/commit/9a5dd61abb03936bf2df6196ee48e626508b70bf)]:
  - inngest@3.32.9

## 0.1.0

### Minor Changes

- [#907](https://github.com/inngest/inngest-js/pull/907) [`b283b22`](https://github.com/inngest/inngest-js/commit/b283b221723d27e9d64e5f36e3751a9c697a4c09) Thanks [@jpwilliams](https://github.com/jpwilliams)! - Remove `stream.getIterator()`; `ReadableStream` is iterable from Node 18+, which is our target

- [#907](https://github.com/inngest/inngest-js/pull/907) [`b283b22`](https://github.com/inngest/inngest-js/commit/b283b221723d27e9d64e5f36e3751a9c697a4c09) Thanks [@jpwilliams](https://github.com/jpwilliams)! - Renamed `stream.get*Stream()` methods to be more explicit about what each chunk of the stream will contain:

  - `stream.getStream()` is now `stream.getJsonStream()`
  - `stream.getWebStream()` is now `stream.getEncodedStream()` (making sure this isn't confused with generic Web APIs)

### Patch Changes

- [#905](https://github.com/inngest/inngest-js/pull/905) [`4ae971b`](https://github.com/inngest/inngest-js/commit/4ae971bda2141bf9e25a250783e5256d9b907d49) Thanks [@jpwilliams](https://github.com/jpwilliams)! - Add `getWebStream()`, used to generate a stream with `Uint8Array` encoding appropriate for use within a `Response`

- [#907](https://github.com/inngest/inngest-js/pull/907) [`b283b22`](https://github.com/inngest/inngest-js/commit/b283b221723d27e9d64e5f36e3751a9c697a4c09) Thanks [@jpwilliams](https://github.com/jpwilliams)! - Fix typing of retrieving a `Response`-compatible stream to be `ReadableStream<Uint8Array>`

- [#907](https://github.com/inngest/inngest-js/pull/907) [`b283b22`](https://github.com/inngest/inngest-js/commit/b283b221723d27e9d64e5f36e3751a9c697a4c09) Thanks [@jpwilliams](https://github.com/jpwilliams)! - Better handle backpressure when writing to many generated streams

## 0.0.3

### Patch Changes

- [#902](https://github.com/inngest/inngest-js/pull/902) [`9546be7`](https://github.com/inngest/inngest-js/commit/9546be72b03a01c0f9d8efcf8ca5bb2639e23473) Thanks [@jpwilliams](https://github.com/jpwilliams)! - Allow connecting to cloud/dev in `@inngest/realtime`

## 0.0.2

### Patch Changes

- [#897](https://github.com/inngest/inngest-js/pull/897) [`2f7c89c`](https://github.com/inngest/inngest-js/commit/2f7c89c6c60668349f2cb792ed219b20c6c271f0) Thanks [@jpwilliams](https://github.com/jpwilliams)! - Loosen `react` peer dependency

- [#897](https://github.com/inngest/inngest-js/pull/897) [`2f7c89c`](https://github.com/inngest/inngest-js/commit/2f7c89c6c60668349f2cb792ed219b20c6c271f0) Thanks [@jpwilliams](https://github.com/jpwilliams)! - `app` is now optional when using `useInngestSubscription()`

## 0.0.1

### Patch Changes

- [#866](https://github.com/inngest/inngest-js/pull/866) [`98efeb4`](https://github.com/inngest/inngest-js/commit/98efeb4eb6f80f418251a22377f428b42b9fff37) Thanks [@jpwilliams](https://github.com/jpwilliams)! - Initial release of `@inngest/realtime` v0
