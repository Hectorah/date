import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  Sparkles,
  Lock,
  Plus,
  CloudLightning,
  Database,
  Search,
  Settings as SettingsIcon,
  LogOut,
  Tag,
  BookHeart,
  HelpCircle,
  Clock,
  ExternalLink
} from 'lucide-react';

import Gatekeeper from './components/Gatekeeper';
import UploadZone from './components/UploadZone';
import MasonryGrid from './components/MasonryGrid';
import FirebaseConfigModal from './components/FirebaseConfigModal';
import PhotoDetailModal from './components/PhotoDetailModal';

import { Photo, FirebaseConfig } from './types';
import { initialPhotos } from './initialPhotos';
import { getFirebaseInstance, handleFirestoreError, OperationType } from './firebase';

import { signInAnonymously } from 'firebase/auth';
import { collection, onSnapshot, query, setDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

const PASSCODE = 'Amor2026';

export default function App() {
  // 1. Passcode access state
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('amour_gallery_unlocked') === 'true';
    } catch {
      return false;
    }
  });

  // 2. Firebase integration state
  const [useFirebase, setUseFirebase] = useState<boolean>(() => {
    try {
      return localStorage.getItem('amour_use_firebase') === 'true';
    } catch {
      return false;
    }
  });
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // 3. Photos data state
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // 4. UI Layout & modal states
  const [showUpload, setShowUpload] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState('Todos');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Load photos based on Database/Sandbox mode
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    if (useFirebase) {
      setIsFirebaseConnected(false);
      setConnectionError(null);

      const { db, auth, isReady } = getFirebaseInstance();

      if (isReady && db && auth) {
        // Authenticate silently/anonymously for secure rule passing
        signInAnonymously(auth)
          .then((userCredential) => {
            const user = userCredential.user;
            console.log('Signed in anonymously to Firebase as:', user.uid);

            const path = 'photos';
            const photosQuery = query(collection(db, path));
            
            // Set up live Snapshot listener
            unsubscribe = onSnapshot(
              photosQuery,
              (snapshot) => {
                const firebasePhotos = snapshot.docs.map((doc) => ({
                  id: doc.id,
                  ...doc.data(),
                })) as Photo[];
                
                // Sort by creation time descending (newest first)
                firebasePhotos.sort((a, b) => b.createdAt - a.createdAt);
                setPhotos(firebasePhotos);
                setIsFirebaseConnected(true);
                setConnectionError(null);
              },
              (error) => {
                console.error('Firestore snapshot listener failed:', error);
                setConnectionError('Error de lectura (Firestore Rules). Revisa tus reglas de seguridad.');
                setIsFirebaseConnected(false);
                handleFirestoreError(error, OperationType.LIST, path, auth.currentUser);
              }
            );
          })
          .catch((err) => {
            console.error('Anonymous sign in failed:', err);
            setConnectionError('Error de autenticación. Activa la autenticación Anónima en la Consola Firebase.');
            setIsFirebaseConnected(false);
          });
      } else {
        setConnectionError('Firebase no está configurado. Por favor, introduce tus credenciales en Ajustes.');
        setIsFirebaseConnected(false);
      }
    } else {
      // Local Sandbox Mode
      try {
        const local = localStorage.getItem('amour_photos');
        if (local) {
          setPhotos(JSON.parse(local));
        } else {
          // Seed with elegant initial couple photos
          setPhotos(initialPhotos);
          localStorage.setItem('amour_photos', JSON.stringify(initialPhotos));
        }
        setIsFirebaseConnected(false);
        setConnectionError(null);
      } catch (err) {
        console.error('Local storage reading failed:', err);
      }
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [useFirebase]);

  // Handle Save Access state
  const handleUnlock = () => {
    setIsUnlocked(true);
    try {
      sessionStorage.setItem('amour_gallery_unlocked', 'true');
    } catch (e) {
      console.error(e);
    }
  };

  const handleLock = () => {
    setIsUnlocked(false);
    try {
      sessionStorage.removeItem('amour_gallery_unlocked');
    } catch (e) {
      console.error(e);
    }
  };

  // Save Config parameters from Modal
  const handleSaveConfig = (newConfig: FirebaseConfig | null, enableFirebase: boolean) => {
    try {
      if (newConfig) {
        localStorage.setItem('amour_firebase_config', JSON.stringify(newConfig));
      } else {
        localStorage.removeItem('amour_firebase_config');
      }
      localStorage.setItem('amour_use_firebase', enableFirebase.toString());
      setUseFirebase(enableFirebase);
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Photo
  const handleDeletePhoto = async (id: string, storagePath?: string) => {
    if (useFirebase) {
      const { db, storage, auth } = getFirebaseInstance();
      if (!db) return;

      const path = `photos/${id}`;
      try {
        // 1. Delete document in Firestore
        await deleteDoc(doc(db, 'photos', id));

        // 2. Delete file in Storage if path is provided
        if (storage && storagePath) {
          const storageRef = ref(storage, storagePath);
          await deleteObject(storageRef).catch((err) => {
            console.warn('Storage resource deletion bypassed or failed:', err.message);
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path, auth?.currentUser);
      }
    } else {
      // Local sandbox
      const updated = photos.filter((p) => p.id !== id);
      setPhotos(updated);
      try {
        localStorage.setItem('amour_photos', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }

    // Close detail modal if currently showing deleted photo
    if (selectedPhoto && selectedPhoto.id === id) {
      setSelectedPhoto(null);
    }
  };

  // Upload/Save Photo
  const handleUploadPhoto = async (metadata: {
    url: string;
    title: string;
    category: string;
    size: string;
    storagePath?: string;
  }) => {
    setIsUploading(true);
    setUploadProgress(5);

    if (useFirebase) {
      const { db, storage, auth, isReady } = getFirebaseInstance();
      if (!isReady || !db || !storage) {
        alert('Firebase no está inicializado. Abre Ajustes de Backend.');
        setIsUploading(false);
        return;
      }

      const path = 'photos';
      try {
        // Convert base64 Data URL to Blob for real Storage stream
        const response = await fetch(metadata.url);
        const blob = await response.blob();

        const fileStorageRef = ref(storage, metadata.storagePath || `gallery/photo_${Date.now()}`);
        const uploadTask = uploadBytesResumable(fileStorageRef, blob);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(Math.max(10, progress));
          },
          (error) => {
            console.error('Storage Upload error:', error);
            alert(`Error de carga en Firebase Storage: ${error.message}`);
            setIsUploading(false);
          },
          async () => {
            // Get secure public download URL
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

            // Save in Firestore document
            const photoId = 'photo_' + Date.now();
            const photoDocRef = doc(db, 'photos', photoId);

            const newPhoto: Photo = {
              id: photoId,
              url: downloadUrl,
              title: metadata.title,
              category: metadata.category,
              createdAt: Date.now(),
              size: metadata.size,
              storagePath: metadata.storagePath,
              caption: '',
            };

            await setDoc(photoDocRef, newPhoto);
            setIsUploading(false);
            setUploadProgress(0);
            setShowUpload(false);
          }
        );
      } catch (error) {
        setIsUploading(false);
        handleFirestoreError(error, OperationType.CREATE, path, auth?.currentUser);
      }
    } else {
      // Local Sandbox mode: Simulated delay + progress bar
      let progressVal = 10;
      const interval = setInterval(() => {
        progressVal += Math.floor(Math.random() * 20) + 10;
        if (progressVal >= 100) {
          progressVal = 100;
          clearInterval(interval);

          const photoId = 'local_' + Date.now();
          const newPhoto: Photo = {
            id: photoId,
            url: metadata.url, // Keep base64 image URL locally
            title: metadata.title,
            category: metadata.category,
            createdAt: Date.now(),
            size: metadata.size,
            caption: '',
          };

          const updated = [newPhoto, ...photos];
          setPhotos(updated);
          try {
            localStorage.setItem('amour_photos', JSON.stringify(updated));
          } catch (e) {
            console.error('LocalStorage limit hit:', e);
            alert('¡Tu almacenamiento local de navegador está lleno! Para subir más recuerdos sin límites, haz clic en el icono de Ajustes de Backend en el menú superior y conecta tu propia base de datos de Google Firebase gratuita en 2 minutos.');
          }

          setIsUploading(false);
          setUploadProgress(0);
          setShowUpload(false);
        } else {
          setUploadProgress(progressVal);
        }
      }, 150);
    }
  };

  // Update Caption
  const handleUpdateCaption = async (id: string, caption: string) => {
    if (useFirebase) {
      const { db, auth } = getFirebaseInstance();
      if (!db) return;

      const path = `photos/${id}`;
      try {
        const docRef = doc(db, 'photos', id);
        await updateDoc(docRef, { caption });
        
        // Update local detail state if opened
        if (selectedPhoto && selectedPhoto.id === id) {
          setSelectedPhoto((prev) => (prev ? { ...prev, caption } : null));
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path, auth?.currentUser);
      }
    } else {
      // Local Sandbox mode
      const updated = photos.map((p) => (p.id === id ? { ...p, caption } : p));
      setPhotos(updated);
      try {
        localStorage.setItem('amour_photos', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }

      if (selectedPhoto && selectedPhoto.id === id) {
        setSelectedPhoto((prev) => (prev ? { ...prev, caption } : null));
      }
    }
  };

  // Filter photos array based on activeTag and Search query
  const filteredPhotos = useMemo(() => {
    return photos.filter((photo) => {
      const matchesTag = activeTag === 'Todos' || photo.category === activeTag;
      const matchesSearch =
        photo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (photo.caption && photo.caption.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesTag && matchesSearch;
    });
  }, [photos, activeTag, searchQuery]);

  // Extract list of unique tags for the filter bar
  const categoriesList = useMemo(() => {
    const fixedTags = ['Todos', 'Viajes', 'Cenas', 'Aventuras', 'Aniversarios', 'En Casa', 'Momentos Especiales'];
    // Collect customized categories that might be entered
    const photoCategories = photos.map((p) => p.category);
    const uniquePhotoCategories = Array.from(new Set<string>(photoCategories)).filter((cat: string) => !fixedTags.includes(cat));
    return [...fixedTags, ...uniquePhotoCategories];
  }, [photos]);

  // Details Lightbox Next/Prev navigators
  const handleNextPhoto = () => {
    if (!selectedPhoto) return;
    const currIdx = filteredPhotos.findIndex((p) => p.id === selectedPhoto.id);
    if (currIdx !== -1 && currIdx < filteredPhotos.length - 1) {
      setSelectedPhoto(filteredPhotos[currIdx + 1]);
    }
  };

  const handlePrevPhoto = () => {
    if (!selectedPhoto) return;
    const currIdx = filteredPhotos.findIndex((p) => p.id === selectedPhoto.id);
    if (currIdx > 0) {
      setSelectedPhoto(filteredPhotos[currIdx - 1]);
    }
  };

  const hasNextPhoto = useMemo(() => {
    if (!selectedPhoto) return false;
    const currIdx = filteredPhotos.findIndex((p) => p.id === selectedPhoto.id);
    return currIdx !== -1 && currIdx < filteredPhotos.length - 1;
  }, [selectedPhoto, filteredPhotos]);

  const hasPrevPhoto = useMemo(() => {
    if (!selectedPhoto) return false;
    const currIdx = filteredPhotos.findIndex((p) => p.id === selectedPhoto.id);
    return currIdx > 0;
  }, [selectedPhoto, filteredPhotos]);

  // Load saved config on startup (needed for dynamic visual mode badges)
  const currentFirebaseConfig = useMemo(() => {
    try {
      const saved = localStorage.getItem('amour_firebase_config');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, [isConfigOpen]);

  // Prompt password gate if locked
  if (!isUnlocked) {
    return <Gatekeeper onUnlock={handleUnlock} correctCode={PASSCODE} />;
  }

  return (
    <div id="amour-gallery-app" className="min-h-screen bg-bg text-white relative flex flex-col font-sans selection:bg-accent-custom/30">
      
      {/* Visual background atmospheric glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-custom/5 rounded-full blur-[120px] pointer-events-none select-none animate-pulse-slow" />
      <div className="absolute bottom-10 left-0 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none select-none" />

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none select-none" />

      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-bg/80 backdrop-blur-md border-b border-border-custom px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo / Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent-custom to-amber-500 flex items-center justify-center shadow-[0_0_15px_rgba(255,77,109,0.3)]">
              <BookHeart className="w-5.5 h-5.5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl tracking-wide text-white flex items-center gap-2">
                <span>Amour</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-accent-custom/10 text-accent-custom border border-accent-custom/20 font-sans tracking-normal font-semibold">
                  Rincón Privado
                </span>
              </h1>
              <p className="text-gray-400 text-[10px] uppercase tracking-widest font-mono mt-0.5">
                Nuestra historia de amor en fotos
              </p>
            </div>
          </div>

          {/* Controls & Badges */}
          <div className="flex items-center flex-wrap gap-2.5">
            
            {/* Mode Badge Indicator */}
            {useFirebase ? (
              <div 
                onClick={() => setIsConfigOpen(true)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer border ${
                  isFirebaseConnected
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/15'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${isFirebaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span>{isFirebaseConnected ? 'Firebase Sincronizado' : 'Conectando Firebase...'}</span>
              </div>
            ) : (
              <div 
                onClick={() => setIsConfigOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-accent-custom/10 text-accent-custom border border-accent-custom/20 hover:bg-accent-custom/15 transition-all cursor-pointer"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Sandbox Local (Modo Offline)</span>
              </div>
            )}

            {/* Config Button */}
            <button
              id="settings-trigger-button"
              type="button"
              onClick={() => setIsConfigOpen(true)}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer border border-border-custom"
              title="Configuración de Base de Datos"
            >
              <SettingsIcon className="w-4.5 h-4.5" />
            </button>

            {/* Lock Button */}
            <button
              id="lock-trigger-button"
              type="button"
              onClick={handleLock}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-accent-custom transition-all cursor-pointer border border-border-custom flex items-center gap-1 text-xs font-semibold"
              title="Cerrar Galería"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Cerrar</span>
            </button>

            {/* Add Memory Trigger */}
            <button
              id="upload-trigger-button"
              type="button"
              onClick={() => setShowUpload(!showUpload)}
              className="px-4 py-2 bg-gradient-to-r from-accent-custom to-amber-500 hover:opacity-90 text-white font-semibold text-xs rounded-xl shadow-lg shadow-accent-custom/10 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{showUpload ? 'Cerrar Panel' : 'Subir Recuerdo'}</span>
            </button>

          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 md:px-8 py-8 space-y-8 z-10">
        
        {/* Dynamic Warning for empty configurations or connection failures */}
        {useFirebase && connectionError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-amber-500/10 border border-border-custom text-amber-300 rounded-3xl text-xs md:text-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-start md:items-center gap-2.5">
              <CloudLightning className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 md:mt-0" />
              <div>
                <strong className="font-bold">Error de conexión a Firebase:</strong>
                <span className="ml-1 text-gray-300 leading-relaxed">{connectionError}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsConfigOpen(true)}
              className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer shrink-0 text-left"
            >
              Abrir Ajustes
            </button>
          </motion.div>
        )}

        {/* Collapsible Upload Zone */}
        <AnimatePresence>
          {showUpload && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <UploadZone
                onUploadSuccess={handleUploadPhoto}
                isUploading={isUploading}
                uploadProgress={uploadProgress}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters & Search Tool Box */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-custom pb-6">
          
          {/* Dynamic Category Tag filter (Horizontal scrollable) */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none shrink-0 -mx-4 px-4 md:mx-0 md:px-0">
            {categoriesList.map((tag) => {
              const isActive = activeTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setActiveTag(tag)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer border ${
                    isActive
                      ? 'bg-gradient-to-r from-accent-custom to-amber-500 text-white border-transparent shadow-md shadow-accent-custom/10 scale-105'
                      : 'bg-surface text-gray-400 border-border-custom hover:text-white hover:bg-[#11121d]'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative max-w-sm w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
              <Search className="w-4.5 h-4.5" />
            </div>
            <input
              id="gallery-search-input"
              type="text"
              placeholder="Buscar por título o nota..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2.5 pl-10 pr-4 bg-surface border border-border-custom rounded-xl text-xs text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-accent-custom/30 focus:border-accent-custom/30 transition-all"
            />
          </div>
        </div>

        {/* Gallery Masonry Area */}
        <div id="gallery-container">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display text-xl tracking-wide text-white flex items-center gap-2">
              <span>Recuerdos de Nuestro Viaje</span>
              <span className="font-sans text-[11px] px-2 py-0.5 rounded-md bg-surface text-gray-400 border border-border-custom">
                {filteredPhotos.length} {filteredPhotos.length === 1 ? 'foto' : 'fotos'}
              </span>
            </h2>
            
            <span className="text-[10px] text-gray-600 font-mono hidden sm:inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Sincronizado al instante
            </span>
          </div>

          <MasonryGrid
            photos={filteredPhotos}
            onDelete={handleDeletePhoto}
            onViewDetails={(photo) => setSelectedPhoto(photo)}
          />
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-border-custom py-8 px-4 text-center text-xs text-gray-600 font-mono mt-auto z-10 bg-bg">
        <div className="max-w-7xl mx-auto space-y-2">
          <p className="flex items-center justify-center gap-1.5">
            <span>Hecho con</span>
            <Heart className="w-3.5 h-3.5 fill-accent-custom text-accent-custom animate-pulse" />
            <span>para nosotros dos</span>
          </p>
          <p className="text-[10px] text-gray-700">
            Amour Private Gallery • {new Date().getFullYear()} • Versión {useFirebase ? 'Firebase Nube v10' : 'Sandbox Local'}
          </p>
        </div>
      </footer>

      {/* Dynamic Firebase settings modal */}
      <FirebaseConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={currentFirebaseConfig}
        useFirebase={useFirebase}
        onSaveConfig={handleSaveConfig}
        isFirebaseConnected={isFirebaseConnected}
        connectionError={connectionError}
      />

      {/* Detailed photo Lightbox view */}
      <AnimatePresence>
        {selectedPhoto && (
          <PhotoDetailModal
            photo={selectedPhoto}
            isOpen={!!selectedPhoto}
            onClose={() => setSelectedPhoto(null)}
            onUpdateCaption={handleUpdateCaption}
            onNext={handleNextPhoto}
            onPrev={handlePrevPhoto}
            hasNext={hasNextPhoto}
            hasPrev={hasPrevPhoto}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
