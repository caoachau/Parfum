// Logger tối giản không phụ thuộc package ngoài (thay cho console.error trực tiếp).
// Ở production sẽ ẩn log debug. Có thể thay bằng pino/winston khi triển khai thật.
type Level = 'info' | 'warn' | 'error' | 'debug';

const isProd = process.env.NODE_ENV === 'production';

function emit(level: Level, args: unknown[]) {
  if (level === 'debug' && isProd) return;
  const prefix = `[${new Date().toISOString()}] [${level.toUpperCase()}]`;
  if (level === 'error') console.error(prefix, ...args);
  else if (level === 'warn') console.warn(prefix, ...args);
  else console.log(prefix, ...args);
}

export const logger = {
  info: (...a: unknown[]) => emit('info', a),
  warn: (...a: unknown[]) => emit('warn', a),
  error: (...a: unknown[]) => emit('error', a),
  debug: (...a: unknown[]) => emit('debug', a),
};
