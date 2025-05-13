// ---- Development Assertions ----
export function assert(condition, message) {
    if (process.env.NODE_ENV !== 'production') {
      if (!condition) {
        throw new Error(message || "Assertion failed");
      }
    }
  }
  
  export function assertDefined(value, name) {
    assert(value !== undefined && value !== null, 
      `${name} must be defined, but received ${value}`);
  }
  
  // ---- Debug Helpers ----
  export function debug(...args) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[DEBUG]', ...args);
    }
  }
  