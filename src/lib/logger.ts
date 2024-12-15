const isDev = process.env.NODE_ENV === "development";

type LogLevel = "debug" | "info" | "warn" | "error";

const colors = {
  debug: "\x1b[90m", // Gray
  info: "\x1b[36m", // Cyan
  warn: "\x1b[33m", // Yellow
  error: "\x1b[31m", // Red
  reset: "\x1b[0m", // Reset
};

function formatMessage(level: LogLevel, msg: string, obj?: object): string {
  const timestamp = new Date().toISOString();
  const data = obj ? `\n${JSON.stringify(obj, null, 2)}` : "";
  return `${
    colors[level]
  }[${timestamp}] [${level.toUpperCase()}] ${msg}${data}${colors.reset}`;
}

export const log = {
  debug: (msg: string, obj?: object) => {
    if (isDev) {
      console.debug(formatMessage("debug", msg, obj));
    }
  },
  info: (msg: string, obj?: object) => {
    console.info(formatMessage("info", msg, obj));
  },
  warn: (msg: string, obj?: object) => {
    console.warn(formatMessage("warn", msg, obj));
  },
  error: (msg: string, obj?: object) => {
    console.error(formatMessage("error", msg, obj));
  },
  req: (req: Request, msg: string, obj?: object) => {
    const url = new URL(req.url);
    log.info(msg, {
      method: req.method,
      url: url.pathname,
      ...obj,
    });
  },
};
