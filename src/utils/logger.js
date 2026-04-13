const formatMessage = (scope, message) => `[${scope}] ${message}`;

export const logError = (scope, message, error, metadata) => {
  const payload = {};
  if (error !== undefined) payload.error = error;
  if (metadata !== undefined) payload.metadata = metadata;

  if (Object.keys(payload).length > 0) {
    console.error(formatMessage(scope, message), payload);
    return;
  }

  console.error(formatMessage(scope, message));
};

export const logWarn = (scope, message, metadata) => {
  if (metadata !== undefined) {
    console.warn(formatMessage(scope, message), { metadata });
    return;
  }

  console.warn(formatMessage(scope, message));
};

