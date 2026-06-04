const admin = require('firebase-admin');
require('dotenv').config();

let db;
let auth;
let firebaseInitialized = false;
let useMockDb = true;

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (projectId && clientEmail && privateKey) {
  try {
    // Format private key if needed
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    privateKey = privateKey.replace(/\\n/g, '\n');

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId
    });
    db = admin.firestore();
    auth = admin.auth();
    firebaseInitialized = true;
    useMockDb = false;
    console.log('Firebase Admin SDK initialized successfully.');

    // Asynchronously verify Firestore database existence
    db.collection('_connection_test_').doc('test').get()
      .then(() => {
        console.log('Firestore connection verified successfully.');
      })
      .catch(err => {
        if (err.code === 5) {
          console.error('\n========================================================================');
          console.error('⚠️  FIREBASE FIRESTORE DATABASE NOT FOUND!');
          console.error('To fix this, please create the Firestore Database in the Firebase Console:');
          console.error(`1. Open → https://console.firebase.google.com/project/${projectId}/firestore`);
          console.error('2. Click "Create database"');
          console.error('3. Choose a location and start in production/test mode');
          console.error('------------------------------------------------------------------------');
          console.error('ReflectAI will temporarily fall back to the In-Memory Mock Database');
          console.error('so the app continues to work. Note: data will not persist across restarts.');
          console.error('========================================================================\n');
          useMockDb = true;
        } else {
          console.error('Firestore connection test failed:', err.message);
        }
      });
  } catch (error) {
    console.error('Firebase Admin initialization error, falling back to mock:', error.message);
    useMockDb = true;
  }
} else {
  console.warn('Firebase configuration missing in .env. Falling back to local emulator/mock mode.');
  useMockDb = true;
}

// Chained Query Builder Helper for Mock DB
function createMockQuery(store, filters = [], sortField = null, sortDirection = 'asc', limitVal = null) {
  const query = {
    where: (field, operator, value) => {
      return createMockQuery(store, [...filters, { field, operator, value }], sortField, sortDirection, limitVal);
    },
    orderBy: (field, direction = 'asc') => {
      return createMockQuery(store, filters, field, direction, limitVal);
    },
    limit: (limitNum) => {
      return createMockQuery(store, filters, sortField, sortDirection, limitNum);
    },
    get: async () => {
      let results = Object.values(store);

      // Apply filters
      for (const filter of filters) {
        const { field, operator, value } = filter;
        results = results.filter(item => {
          let itemVal = item[field];

          // Handle Date objects and Firestore Timestamps
          if (itemVal && typeof itemVal.toDate === 'function') {
            itemVal = itemVal.toDate();
          }
          
          let itemTime = itemVal instanceof Date ? itemVal.getTime() : itemVal;
          let compTime = value instanceof Date ? value.getTime() : value;

          if (operator === '==') {
            if (itemVal instanceof Date && value instanceof Date) {
              return itemTime === compTime;
            }
            return item[field] === value;
          }
          if (operator === '>=') return itemTime >= compTime;
          if (operator === '<=') return itemTime <= compTime;
          if (operator === '>') return itemTime > compTime;
          if (operator === '<') return itemTime < compTime;
          return false;
        });
      }

      // Apply sorting
      if (sortField) {
        results.sort((a, b) => {
          let valA = a[sortField];
          let valB = b[sortField];

          if (valA && typeof valA.toDate === 'function') valA = valA.toDate();
          if (valB && typeof valB.toDate === 'function') valB = valB.toDate();

          let timeA = valA instanceof Date ? valA.getTime() : valA;
          let timeB = valB instanceof Date ? valB.getTime() : valB;

          if (timeA === undefined || timeA === null) return 1;
          if (timeB === undefined || timeB === null) return -1;

          if (sortDirection === 'desc') {
            return timeB > timeA ? 1 : -1;
          } else {
            return timeA > timeB ? 1 : -1;
          }
        });
      }

      // Apply limit
      if (limitVal !== null) {
        results = results.slice(0, limitVal);
      }

      const docs = results.map(item => ({
        id: item.id,
        data: () => item
      }));

      return { docs };
    }
  };
  return query;
}

// In-Memory Database Fallback for development if Firebase is not configured
const mockDb = {
  users: {},
  journal_entries: {},
  chat_history: {},
  community_posts: {},
  future_letters: {},
  poems: {},
  memories: {},

  collection: function(name) {
    if (!this[name]) this[name] = {};
    const store = this[name];

    return {
      doc: (id) => {
        const docId = id || Math.random().toString(36).substring(2, 15);
        return {
          get: async () => {
            const data = store[docId];
            return {
              exists: !!data,
              data: () => data ? { ...data, id: docId } : null,
              id: docId
            };
          },
          set: async (data, options = {}) => {
            if (options.merge && store[docId]) {
              store[docId] = { ...store[docId], ...data, updatedAt: new Date() };
            } else {
              store[docId] = { ...data, id: docId, createdAt: data.createdAt || new Date() };
            }
            return { id: docId };
          },
          update: async (data) => {
            if (!store[docId]) throw new Error(`Document ${docId} does not exist`);
            store[docId] = { ...store[docId], ...data, updatedAt: new Date() };
            return { id: docId };
          },
          delete: async () => {
            delete store[docId];
            return { id: docId };
          }
        };
      },
      add: async (data) => {
        const docId = Math.random().toString(36).substring(2, 15);
        store[docId] = { ...data, id: docId, createdAt: data.createdAt || new Date() };
        return { id: docId };
      },
      // Query capability
      where: (field, operator, value) => createMockQuery(store).where(field, operator, value),
      orderBy: (field, direction) => createMockQuery(store).orderBy(field, direction),
      limit: (limitNum) => createMockQuery(store).limit(limitNum),
      get: () => createMockQuery(store).get()
    };
  }
};

// Seed mock data for local testing
mockDb.community_posts['post1'] = {
  id: 'post1',
  uid: 'student123',
  content: 'Exam week is starting, feeling pretty stressed but we will make it through!',
  anonymous: true,
  relateCount: 12,
  supportCount: 8,
  inspireCount: 5,
  createdAt: new Date(Date.now() - 3600000)
};
mockDb.community_posts['post2'] = {
  id: 'post2',
  uid: 'student456',
  content: 'Really grateful for the supportive community here. Reflecting daily has made a huge difference in my routine.',
  anonymous: true,
  relateCount: 4,
  supportCount: 15,
  inspireCount: 9,
  createdAt: new Date(Date.now() - 7200000)
};

// Use proxy to transparently route database access to the mock database or live database
const dbProxy = new Proxy({}, {
  get: function(target, prop) {
    const activeDb = useMockDb ? mockDb : db;
    const value = activeDb[prop];
    if (typeof value === 'function') {
      return value.bind(activeDb);
    }
    return value;
  }
});

module.exports = {
  admin,
  db: dbProxy,
  auth: firebaseInitialized ? auth : null,
  isFirebaseReady: () => firebaseInitialized
};
