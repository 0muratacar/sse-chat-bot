import 'reflect-metadata';
import net from 'net';
import app from './app';
import config from './config';
import logger from './utils/logger';

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port);
  });
}

async function findAvailablePort(startPort: number): Promise<number> {
  let port = startPort;
  while (!(await isPortAvailable(port))) {
    logger.warn(`Port ${port} is in use, trying ${port + 1}`);
    port++;
  }
  return port;
}

async function start() {
  const desiredPort = config.get('port');
  const port = await findAvailablePort(desiredPort);

  app.listen(port, () => {
    logger.info('Server started', { port, env: config.get('nodeEnv') });
  });
}

start();
