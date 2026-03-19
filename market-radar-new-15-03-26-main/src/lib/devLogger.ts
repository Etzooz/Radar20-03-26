export const devLogger = {
  logs: [] as { type: string; message: string; data?: any; time: string }[],

  log(type: string, message: string, data?: any) {
    this.logs.unshift({
      type,
      message,
      data,
      time: new Date().toLocaleTimeString(),
    });

    (console as any)[type]?.(message, data);
  },
};
