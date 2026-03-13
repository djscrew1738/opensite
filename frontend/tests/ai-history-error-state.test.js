import process from 'node:process';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const AI_ASSISTANT = path.resolve(process.cwd(), 'src/pages/AIAssistant.jsx');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

test('AIAssistant reads conversation history error state from the query', () => {
  const source = read(AI_ASSISTANT);
  assert.match(source, /isError:\s*isConversationsError/);
  assert.match(source, /error:\s*conversationsError/);
  assert.match(source, /refetch:\s*refetchConversations/);
});

test('AIAssistant renders a distinct conversation drawer error state with retry', () => {
  const source = read(AI_ASSISTANT);
  assert.match(source, /Conversation history unavailable/);
  assert.match(source, /Retry history/);
  assert.match(source, /No conversations yet/);
});

test('AIAssistant keeps the chat area usable when history loading fails', () => {
  const source = read(AI_ASSISTANT);
  assert.match(source, /History is unavailable right now, but you can still start a new chat\./);
  assert.match(source, /disabled=\{!inputMessage\.trim\(\) \|\| isStreaming\}/);
});
