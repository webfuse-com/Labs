declare global {
  const browser: {
    webfuseSession: {
        [property: string]: unknown | ((...args: unknown[]) => unknown);
    };
    [property: string]: unknown | ((...args: unknown[]) => unknown);
  };
}

export {};