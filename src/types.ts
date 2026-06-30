export interface Photo {
  id: string;
  url: string;
  title: string;
  category: string;
  createdAt: number; // millisecond timestamp
  size?: string;
  storagePath?: string;
  caption?: string;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}
