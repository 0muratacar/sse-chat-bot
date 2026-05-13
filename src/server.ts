import app from './app';
import config from './config';
import logger from './utils/logger';

const PORT = config.get('port');

app.listen(PORT, () => {
  logger.info('Server started', { port: PORT, env: config.get('nodeEnv') });
});
