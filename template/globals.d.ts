declare global {
  const browser: {
    webfuseSession: {
        [property: string]: unknown | ((...args: unknown[]) => unknown);
        env: string;
    };
    [property: string]: unknown | ((...args: unknown[]) => unknown);
  };
}

export {};