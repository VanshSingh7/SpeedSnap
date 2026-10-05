// SpeedSnap - IndexedDB Storage Module (CSE Sem 5 Project)
const SpeedSnapDB = (() => {
  const DB_NAME = 'SpeedSnapDB';
  const STORE = 'test_history';
  let dbPromise = null;

  // Open database connection with connection reuse caching
  function getDB() {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        req.onsuccess = () => {
          const db = req.result;
          db.onversionchange = () => { db.close(); dbPromise = null; };
          resolve(db);
        };
        req.onerror = () => {
          dbPromise = null;
          reject(req.error);
        };
      });
    }
    return dbPromise;
  }

  // Save speed test result to IndexedDB
  async function saveResult(data) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const req = tx.objectStore(STORE).add({ ...data, timestamp: new Date().toISOString() });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  // Get all results sorted by latest first
  async function getAllResults() {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => resolve((req.result || []).reverse());
      req.onerror = () => reject(req.error);
    });
  }

  // Delete a result by ID
  async function deleteResult(id) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const req = tx.objectStore(STORE).delete(Number(id));
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // Clear all saved test history
  async function clearAll() {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const req = tx.objectStore(STORE).clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // Calculate summary statistics
  async function getStats() {
    const list = await getAllResults();
    if (!list.length) return { count: 0, avgDownload: 0, avgUpload: 0, avgLatency: 0, maxDownload: 0 };
    const avg = (fn) => (list.reduce((s, x) => s + (Number(fn(x)) || 0), 0) / list.length).toFixed(1);
    const max = Math.max(...list.map(x => Number(x.downloadSpeed) || 0)).toFixed(1);
    return {
      count: list.length,
      avgDownload: avg(x => x.downloadSpeed),
      avgUpload: avg(x => x.uploadSpeed),
      avgLatency: avg(x => x.latency),
      maxDownload: max
    };
  }

  return { openDB: getDB, saveResult, getAllResults, deleteResult, clearAll, getStats };
})();

