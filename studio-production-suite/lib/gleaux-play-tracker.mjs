// One ID per playback, not per browser. Pause and buffering retain the ID.
export function createPlayTracker(send, newId) {
  let current = null;
  return {
    started() {
      if (current) return;
      const id = newId();
      current = id;
      // A retry uses the same ID so a lost response cannot double-count.
      void Promise.resolve().then(() => send(id)).catch(() => send(id)).catch(() => {});
    },
    reset() { current = null; },
  };
}
