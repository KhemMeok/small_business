// Open IndexedDB database
export const openDatabase = (dbName, version = 1, upgradeCallback) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, version);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (upgradeCallback) upgradeCallback(db);
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(`Database error: ${event.target.errorCode}`);
    };
  });
};

// Upgrade Functions
export const upgradeFixParamDB = (db) => {
  if (!db.objectStoreNames.contains('sheets')) {
    const store = db.createObjectStore('sheets', { keyPath: 'id', autoIncrement: true });
    store.createIndex('helpDesk_ticket_no', 'helpDesk_ticket_no');
    store.createIndex('listing_issue_fix_id', 'listing_issue_fix_id');
    store.createIndex('batch_no', 'batch_no');
  }
  if (!db.objectStoreNames.contains('issueFixLog')) {
    db.createObjectStore('issueFixLog', { keyPath: 'id', autoIncrement: true });
  }
  if (!db.objectStoreNames.contains('dailyBatchNumber')) {
    db.createObjectStore('dailyBatchNumber', { keyPath: 'key' });
  }
  if (!db.objectStoreNames.contains('helpDeskTicket')) {
    db.createObjectStore('helpDeskTicket', { keyPath: 'id', autoIncrement: true });
  }
};

export const upgradeUserDataDB = (db) => {
  if (!db.objectStoreNames.contains('users')) {
    const store = db.createObjectStore('users', { keyPath: 'userId', autoIncrement: true });
    store.createIndex('email', 'email', { unique: true });
    store.createIndex('username', 'username', { unique: true });
  }
};

export const upgradeDPRParamDB = (db) => {
  if (!db.objectStoreNames.contains('configParam')) {
    db.createObjectStore('configParam', { keyPath: 'key' });
  }
  if (!db.objectStoreNames.contains('dailyBatchNumber')) {
    db.createObjectStore('dailyBatchNumber', { keyPath: 'key' });
  }
  if (!db.objectStoreNames.contains('switchListing')) {
    db.createObjectStore('switchListing', { keyPath: 'id', autoIncrement: true });
  }
};

// CRUD Helpers
export const addDataToIndexedDB = async (dbName, storeName, data, version = 1, upgradeCallback = null) => {
  const db = await openDatabase(dbName, version, upgradeCallback);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(data);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(`Add data error: ${req.error}`);
  });
};

export const getDataFromIndexedDB = async (dbName, storeName, key, version = 1, upgradeCallback = null) => {
  const db = await openDatabase(dbName, version, upgradeCallback);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(`Get data error: ${req.error}`);
  });
};

export const getAllDataFromIndexedDB = async (dbName, storeName, version = 1, upgradeCallback = null) => {
  const db = await openDatabase(dbName, version, upgradeCallback);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(`Get all data error: ${req.error}`);
  });
};

export const getAllKeysFromIndexedDB = async (dbName, storeName, version = 1, upgradeCallback = null) => {
  const db = await openDatabase(dbName, version, upgradeCallback);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAllKeys();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(`Get all keys error: ${req.error}`);
  });
};

export const clearObjectStore = async (dbName, storeName, version = 1, upgradeCallback = null) => {
  const db = await openDatabase(dbName, version, upgradeCallback);
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains(storeName)) {
      reject(`Object store ${storeName} not found`);
      return;
    }
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(`Clear data error: ${req.error}`);
  });
};

export const removeDataFromIndexedDB = async (dbName, storeName, key, version = 1, upgradeCallback = null) => {
  const db = await openDatabase(dbName, version, upgradeCallback);
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains(storeName)) {
      reject(`Object store ${storeName} not found`);
      return;
    }
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(`Remove data error: ${req.error}`);
  });
};
