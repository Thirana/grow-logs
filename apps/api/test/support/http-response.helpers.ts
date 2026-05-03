export function expectStandardErrorShape(body: Record<string, unknown>): void {
  expect(body).toHaveProperty('statusCode');
  expect(body).toHaveProperty('message');
  expect(body).toHaveProperty('errorCode');
  expect(body).toHaveProperty('requestId');
  expect(body).toHaveProperty('timestamp');
}
