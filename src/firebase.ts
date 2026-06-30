import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from './firebase-applet-config.json';

let appInstance: any = null;
let dbInstance: any = null;
let authInstance: any = null;
let storageInstance: any = null;
let isInitialized = false;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
  currentUser: any
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid || null,
      email: currentUser?.email || null,
      emailVerified: currentUser?.emailVerified || null,
      isAnonymous: currentUser?.isAnonymous || null,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function getFirebaseInstance() {
  if (isInitialized) {
    return {
      db: dbInstance,
      auth: authInstance,
      storage: storageInstance,
      isReady: true,
    };
  }

  // Attempt to load from localStorage config override
  let activeConfig = { ...firebaseConfig };
  try {
    const saved = localStorage.getItem('amour_firebase_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.apiKey) {
        activeConfig = { ...activeConfig, ...parsed };
      }
    }
  } catch (e) {
    console.error('Error loading saved firebase configuration override:', e);
  }

  // Verify that we have a valid API Key and Project ID to avoid startup crashes
  if (activeConfig && activeConfig.apiKey && activeConfig.apiKey.trim() !== '') {
    try {
      if (getApps().length === 0) {
        appInstance = initializeApp(activeConfig);
      } else {
        appInstance = getApp();
      }
      dbInstance = getFirestore(appInstance, activeConfig.firestoreDatabaseId || '(default)');
      authInstance = getAuth(appInstance);
      storageInstance = getStorage(appInstance);
      isInitialized = true;
      console.log('Firebase successfully initialized with configuration:', activeConfig.projectId);
      return {
        db: dbInstance,
        auth: authInstance,
        storage: storageInstance,
        isReady: true,
      };
    } catch (error) {
      console.error('Failed to initialize Firebase SDK:', error);
    }
  }

  return {
    db: null,
    auth: null,
    storage: null,
    isReady: false,
  };
}
