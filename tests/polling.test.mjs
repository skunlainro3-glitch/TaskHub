import test from 'node:test';
import assert from 'node:assert/strict';
import { startPolling } from '../src/polling.mjs';

function fakeBrowser() {
  const events = new EventTarget(), document = new EventTarget(), timers = new Map();
  document.hidden = false;
  let id = 0;
  return {
    document, navigator: { onLine: true }, timers,
    addEventListener: (...args) => events.addEventListener(...args),
    removeEventListener: (...args) => events.removeEventListener(...args),
    dispatch: (name) => events.dispatchEvent(new Event(name)),
    setTimeout(fn, delay) { timers.set(++id, { fn, delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    async next() {
      assert.equal(timers.size, 1);
      const [key, {fn}] = timers.entries().next().value;
      timers.delete(key);
      await fn();
    },
    delay() { return timers.values().next().value?.delay; },
  };
}
const settle = async () => { await Promise.resolve(); await Promise.resolve(); };

test('polls never overlap slow reads, and stopping prevents the next read', async () => {
  const env = fakeBrowser();
  let finish, calls = 0;
  const stop = startPolling(() => { calls++; return new Promise(r => { finish = r; }); }, {}, env);
  assert.equal(calls, 1);
  assert.equal(env.timers.size, 0);
  env.dispatch('online');
  env.document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(calls, 1);
  stop();
  finish();
  await settle();
  assert.equal(env.timers.size, 0);
  env.dispatch('online');
  assert.equal(calls, 1);
});

test('hidden and offline screens pause reads; returning refreshes without waiting', async () => {
  const env = fakeBrowser();
  env.document.hidden = true;
  let calls = 0;
  const stop = startPolling(async () => { calls++; }, {}, env);
  await env.next();
  assert.equal(calls, 0);
  env.document.hidden = false;
  env.navigator.onLine = false;
  env.document.dispatchEvent(new Event('visibilitychange'));
  await env.next();
  assert.equal(calls, 0);
  env.navigator.onLine = true;
  env.dispatch('online');
  await settle();
  assert.equal(calls, 1);
  assert.equal(env.delay(), 5000);
  env.document.hidden = true;
  await env.next();
  assert.equal(calls, 1);
  env.document.hidden = false;
  env.document.dispatchEvent(new Event('visibilitychange'));
  await settle();
  assert.equal(calls, 2);
  stop();
});

test('failed reads back off to 30 seconds and success restores normal refresh', async () => {
  const env = fakeBrowser(), errors = [];
  let fail = true, calls = 0;
  const stop = startPolling(async () => { calls++; if(fail) throw Error('offline'); }, { onError: e => errors.push(e.message) }, env);
  await settle();
  assert.equal(env.delay(), 10000);
  await env.next();
  assert.equal(env.delay(), 20000);
  await env.next();
  assert.equal(env.delay(), 30000);
  await env.next();
  assert.equal(env.delay(), 30000);
  fail = false;
  await env.next();
  assert.equal(env.delay(), 5000);
  assert.equal(errors.length, 4);
  assert.equal(calls, 5);
  stop();
});

test('a manual refresh in progress suppresses the automatic read', async () => {
  const env = fakeBrowser();
  let busy = true, calls = 0;
  const stop = startPolling(async () => { calls++; }, { isBusy: () => busy }, env);
  assert.equal(calls, 0);
  busy = false;
  await env.next();
  assert.equal(calls, 1);
  stop();
});
