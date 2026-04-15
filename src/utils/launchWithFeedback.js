export async function launchWithFeedback({
  launch,
  beginLaunchFeedback,
  endLaunchFeedback,
  showLaunchError,
  label,
  launchType,
  path,
  source = 'app',
}) {
  const feedbackToken = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  beginLaunchFeedback?.({
    token: feedbackToken,
    label: label || 'Launching app',
    launchType: launchType || 'app',
    path: path || '',
    source,
  });

  try {
    const result = await launch();
    if (result?.ok === false) {
      showLaunchError?.({
        technicalError: result?.error || 'Launch failed',
        launchType: launchType || 'app',
        path: path || '',
        source,
      });
    }
    return result;
  } catch (error) {
    showLaunchError?.({
      technicalError: error?.message || String(error),
      launchType: launchType || 'app',
      path: path || '',
      source,
    });
    return { ok: false, error: error?.message || String(error) };
  } finally {
    endLaunchFeedback?.(feedbackToken);
  }
}

export default launchWithFeedback;
