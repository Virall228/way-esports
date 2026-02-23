type CircuitState = {
  failures: number;
  openedAt: number;
};

const states = new Map<string, CircuitState>();

const FAILURE_THRESHOLD = Number(process.env.AI_CIRCUIT_FAILURE_THRESHOLD || 5);
const OPEN_MS = Number(process.env.AI_CIRCUIT_OPEN_MS || 120000);

const getState = (provider: string): CircuitState => {
  const current = states.get(provider);
  if (current) return current;
  const next = { failures: 0, openedAt: 0 };
  states.set(provider, next);
  return next;
};

export const canCallProvider = (provider: string) => {
  const state = getState(provider);
  if (state.openedAt === 0) return true;
  if (Date.now() - state.openedAt >= OPEN_MS) {
    state.openedAt = 0;
    state.failures = 0;
    return true;
  }
  return false;
};

export const markProviderSuccess = (provider: string) => {
  const state = getState(provider);
  state.failures = 0;
  state.openedAt = 0;
};

export const markProviderFailure = (provider: string) => {
  const state = getState(provider);
  state.failures += 1;
  if (state.failures >= FAILURE_THRESHOLD) {
    state.openedAt = Date.now();
  }
};

export const getCircuitStatus = () => {
  const now = Date.now();
  const result: Record<string, { open: boolean; failures: number; retryInMs: number }> = {};
  for (const [provider, state] of states.entries()) {
    const open = state.openedAt > 0 && now - state.openedAt < OPEN_MS;
    result[provider] = {
      open,
      failures: state.failures,
      retryInMs: open ? Math.max(0, OPEN_MS - (now - state.openedAt)) : 0
    };
  }
  return result;
};
