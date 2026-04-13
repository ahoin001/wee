import useConsolidatedAppStore from '../useConsolidatedAppStore';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function runSceneTransition(label, task, options = {}) {
  const enterDelayMs = Number(options.enterDelayMs ?? 140);
  const exitDelayMs = Number(options.exitDelayMs ?? 220);
  const key = Date.now();

  const { setUIState } = useConsolidatedAppStore.getState().actions;
  setUIState({
    sceneTransition: {
      active: true,
      label: label || 'Applying scene...',
      key,
    },
  });

  await sleep(enterDelayMs);
  try {
    await task();
  } finally {
    await sleep(exitDelayMs);
    setUIState((prev) => ({
      sceneTransition: {
        ...prev.sceneTransition,
        active: false,
        key: Date.now(),
      },
    }));
  }
}
