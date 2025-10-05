// src/utils/helpers.js
import {
  getDataFromIndexedDB,
  addDataToIndexedDB,
  removeDataFromIndexedDB,
  getAllKeysFromIndexedDB,
} from '/src/layout/utils/IndexedDB.js';

// Trim Unicode and white spaces from object keys and values
export function trimUnicodeAndWhiteSpaces(obj) {
  // eslint-disable-next-line no-misleading-character-class
  const spaces = /[\u0020\u00A0\u200B\u200C\u200D\uFEFF]/g;

  const trimValue = (value) => {
    if (typeof value === 'string') {
      return value.replace(spaces, '').trim();
    } else if (Array.isArray(value)) {
      return value.map(trimValue);
    } else if (value && typeof value === 'object') {
      return trimObject(value);
    }
    return value;
  };

  const trimObject = (object) => {
    const trimmed = {};
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        const trimmedKey = key.replace(spaces, '').trim();
        trimmed[trimmedKey] = trimValue(object[key]);
      }
    }
    return trimmed;
  };

  return Array.isArray(obj) ? obj.map(trimValue) : trimObject(obj);
}

// Convert Excel serial date to JS date string
export function excelDateToJSDate(serial) {
  const baseDate = new Date(1900, 0, 1);
  const daysToAdd = serial - 1;
  baseDate.setDate(baseDate.getDate() + daysToAdd);
  return baseDate.toLocaleDateString(); // or .toISOString() for consistent formatting
}

// Get current date as YYYY-MM-DD
function getCurrentDateString() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

// Get yesterday's date as YYYY-MM-DD
function getOldDateString() {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  return now.toISOString().split('T')[0];
}

// Get or initialize the daily number
export async function getDailyNumber(dbName) {
  const currentDate = getCurrentDateString();
  const oldDate = getOldDateString();

  let storedData = await getDataFromIndexedDB(dbName, 'dailyBatchNumber', currentDate);

  if (!storedData) {
    await removeDataFromIndexedDB(dbName, 'dailyBatchNumber', oldDate);
    storedData = { key: currentDate, date: currentDate, number: 1 };
  } else {
    storedData.number = storedData.date === currentDate
      ? (storedData.number % 99) + 1
      : 2;
    storedData.date = currentDate;
  }

  await addDataToIndexedDB(dbName, 'dailyBatchNumber', storedData);
  return String(storedData.number).padStart(2, '0');
}

// Get all keys in store
export function findSheetKeys(dbName, storeName) {
  return getAllKeysFromIndexedDB(dbName, storeName);
}

// Get the highest existing sheet number or 0
export async function getCurrentNumber(dbName, storeName) {
  const keys = await findSheetKeys(dbName, storeName);
  return keys.length === 0 ? 0 : Math.max(...keys);
}

// Increment sheet number
export async function incrementNumber(dbName, storeName) {
  const currentCount = await getCurrentNumber(dbName, storeName);
  return currentCount + 1;
}

// Parse JSON string into table-like array
export function parseJsonData(jsonData) {
  if (!jsonData) return null;
  try {
    const array = JSON.parse(jsonData);
    if (Array.isArray(array) && array.length > 0) {
      const headers = Object.keys(array[0]);
      const rows = array.map(obj => Object.values(obj));
      return [headers, ...rows];
    }
  } catch (error) {
    console.error('Error parsing JSON data:', error);
  }
  return null;
}
