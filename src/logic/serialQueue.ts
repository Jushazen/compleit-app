/**
 * Returns an `enqueue` function that runs async tasks one at a time, in call
 * order. Each call settles with its own task's outcome; a failed task does not
 * stop the ones queued after it.
 */
export function createSerialQueue(): <T>(task: () => Promise<T>) => Promise<T> {
  let tail: Promise<unknown> = Promise.resolve();
  return task => {
    const run = tail.then(task);
    tail = run.catch(() => undefined);
    return run;
  };
}
