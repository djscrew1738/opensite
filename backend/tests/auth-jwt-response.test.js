import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { responseWrapper } from '../src/utils/response.js';
import { authenticateToken } from '../src/middleware/auth-jwt.js';

async function startServer() {
  const app = express();
  app.use(responseWrapper);
  app.get('/protected', authenticateToken, (req, res) => {
    res.success({ ok: true });
  });

  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const { port } = server.address();
  return { server, port };
}

test('authenticateToken returns standardized error shape on missing token', async () => {
  const { server, port } = await startServer();
  try {
    const res = await fetch(`http://localhost:${port}/protected`);
    const body = await res.json();

    assert.equal(res.status, 401);
    assert.equal(body.success, false);
    assert.equal(typeof body.error, 'object');
    assert.ok(body.error.message);
    assert.ok(body.error.code);
  } finally {
    server.close();
  }
});
