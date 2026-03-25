const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.join(__dirname, '..');
const dataDir = path.join(rootDir, 'data');
const configPath = path.join(rootDir, 'config.json');
const settingsPath = path.join(dataDir, 'settings.json');
const usersPath = path.join(dataDir, 'users.json');

function ensureDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    if (fallback !== undefined) {
      fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
      return structuredClone(fallback);
    }

    throw new Error(`Missing required JSON file: ${filePath}`);
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    if (fallback !== undefined) {
      fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
      return structuredClone(fallback);
    }

    throw new Error(`Invalid JSON in file: ${filePath}`);
  }
}

function writeJson(filePath, data) {
  ensureDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function getConfig() {
  return readJson(configPath);
}

function getDefaultEmojis() {
  const config = getConfig();
  return config.defaultEmojis;
}

function getSettings() {
  ensureDir();
  return readJson(settingsPath, getDefaultEmojis());
}

function setEmoji(type, level, emoji) {
  const settings = getSettings();
  settings[type][String(level)] = emoji;
  writeJson(settingsPath, settings);
  return settings;
}

function getUsers() {
  ensureDir();
  return readJson(usersPath, {});
}

function saveUsers(users) {
  writeJson(usersPath, users);
}

function getOrCreateUserRecord(userId) {
  const users = getUsers();
  if (!users[userId]) {
    users[userId] = {
      nitroStart: null,
      boostStart: null
    };
    saveUsers(users);
  }

  return users[userId];
}

function updateUserRecord(userId, patch) {
  const users = getUsers();
  if (!users[userId]) {
    users[userId] = {
      nitroStart: null,
      boostStart: null
    };
  }

  users[userId] = {
    ...users[userId],
    ...patch
  };

  saveUsers(users);
  return users[userId];
}

module.exports = {
  getConfig,
  getSettings,
  setEmoji,
  getOrCreateUserRecord,
  updateUserRecord
};
