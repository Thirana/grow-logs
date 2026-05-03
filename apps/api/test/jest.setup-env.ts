process.env['PORT'] = '3001';
process.env['NODE_ENV'] = 'test';
process.env['LOG_LEVEL'] = 'error';
process.env['LOG_FORMAT'] = 'json';
process.env['DATABASE_URL'] =
  'postgresql://postgres:postgres@localhost:5432/grow-logs';
