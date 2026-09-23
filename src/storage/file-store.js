import { randomUUID } from 'node:crypto';
import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { MemoryStore } from './memory-store.js';

const collections = ['tasks', 'teams', 'proposals', 'uiCards', 'uiProposals', 'profiles', 'notifications'];

function readSnapshot(filePath) {
  const snapshot = JSON.parse(readFileSync(filePath, 'utf8'));
  if (!snapshot || snapshot.version !== 1) throw new Error('Unsupported storage version.');
  for (const key of collections) {
    if (!Array.isArray(snapshot[key])) throw new Error(`Invalid storage collection: ${key}.`);
    const ids = new Set();
    for (const record of snapshot[key]) {
      if (!record || typeof record.id !== 'string' || !record.id || ids.has(record.id)) {
        throw new Error(`Invalid or duplicate record in ${key}.`);
      }
      ids.add(record.id);
    }
  }
  if (snapshot.profiles.some((profile) => !['student', 'business'].includes(profile.role))) {
    throw new Error('Invalid profile role in storage.');
  }
  return snapshot;
}

// A single-process demo store. A shared file is not a multi-server database.
export class FileStore extends MemoryStore {
  constructor(filePath, seed) {
    const absolutePath = resolve(filePath);
    const existing = existsSync(absolutePath);
    let snapshot;
    if (existing) {
      try {
        snapshot = readSnapshot(absolutePath);
      } catch (error) {
        throw new Error(`Cannot load saved data from ${absolutePath}; the file was not changed. ${error.message}`, { cause: error });
      }
    }
    super(existing ? snapshot : seed);
    this.filePath = absolutePath;
    this.storageKind = 'file';
    if (!existing) this.persist();
  }

  persist() {
    mkdirSync(dirname(this.filePath), { recursive: true });
    const temporaryPath = `${this.filePath}.${randomUUID()}.tmp`;
    let descriptor;
    try {
      descriptor = openSync(temporaryPath, 'wx', 0o600);
      writeFileSync(descriptor, JSON.stringify(this.snapshot(), null, 2), 'utf8');
      fsyncSync(descriptor);
      closeSync(descriptor);
      descriptor = undefined;
      renameSync(temporaryPath, this.filePath);
    } finally {
      if (descriptor !== undefined) closeSync(descriptor);
      if (existsSync(temporaryPath)) unlinkSync(temporaryPath);
    }
  }
}
