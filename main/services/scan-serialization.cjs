/**
 * Serialize heavy filesystem / shell scans so concurrent IPC calls do not peak disk/CPU together.
 */

let chain = Promise.resolve();

function runExclusive(fn) {
  const next = chain.then(() => fn());
  chain = next.catch(() => {});
  return next;
}

module.exports = {
  runExclusive,
};
