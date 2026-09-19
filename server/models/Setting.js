const mongoose = require("mongoose");

const SettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    value: {
      type: Object,
      required: true,
    },
  },
  { timestamps: true }
);

const Setting = mongoose.model("settings", SettingSchema);
module.exports = Setting;

const { getRequestCacheMap } = require("../utils/requestContext");

const globalSettingCache = new Map();
const GLOBAL_SETTING_TTL_MS =
  Number(process.env.SETTING_GLOBAL_CACHE_TTL_MS) || 45000;
const GLOBAL_SETTING_CACHE_MAX_KEYS =
  Number(process.env.SETTING_GLOBAL_CACHE_MAX_KEYS) || 50;

const touchGlobalSettingEntry = (key, value, expiresAt) => {
  globalSettingCache.delete(key);
  while (globalSettingCache.size >= GLOBAL_SETTING_CACHE_MAX_KEYS) {
    const oldest = globalSettingCache.keys().next().value;
    if (oldest === undefined) break;
    globalSettingCache.delete(oldest);
  }
  globalSettingCache.set(key, { value, expiresAt });
};

const saveSetting = async (key, value) => {
  try {
    const setting = await Setting.findOneAndUpdate(
      { key },
      { value },
      { upsert: true, returnDocument: "after" }
    ).lean();

    if (!setting._id) {
      return false;
    }

    globalSettingCache.delete(key);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

const getSetting = async (key) => {
  const cacheKey = `setting:${key}`;
  const cache = getRequestCacheMap();
  if (cache && cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const now = Date.now();
  const globalHit = globalSettingCache.get(key);
  if (globalHit && globalHit.expiresAt > now) {
    touchGlobalSettingEntry(key, globalHit.value, globalHit.expiresAt);
    if (cache) {
      cache.set(cacheKey, globalHit.value);
    }
    return globalHit.value;
  }

  try {
    const setting = await Setting.findOne({ key }).select("key value").lean();

    const value = setting ? setting.value : null;
    if (cache) {
      cache.set(cacheKey, value);
    }
    if (value !== null) {
      touchGlobalSettingEntry(key, value, now + GLOBAL_SETTING_TTL_MS);
    }
    return value;
  } catch (err) {
    console.error(err);
    return null;
  }
};

module.exports.saveSetting = saveSetting;
module.exports.getSetting = getSetting;
