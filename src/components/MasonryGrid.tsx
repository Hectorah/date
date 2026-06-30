import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ImageCard from './ImageCard';
import { Photo } from '../types';
import { Sparkles, CameraOff } from 'lucide-react';

interface MasonryGridProps {
  photos: Photo[];
  onDelete: (id: string, storagePath?: string) => Promise<void>;
  onViewDetails: (photo: Photo) => void;
}

export default function MasonryGrid({ photos, onDelete, onViewDetails }: MasonryGridProps) {
  const [columnsCount, setColumnsCount] = useState(3);

  // Responsive column calculation
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setColumnsCount(1); // Mobile
      } else if (width < 1024) {
        setColumnsCount(2); // Tablet
      } else if (width < 1280) {
        setColumnsCount(3); // Small desktop
      } else {
        setColumnsCount(4); // Large display
      }
    };

    handleResize(); // Initial call
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Distribute photos into columns round-robin
  const columns: Photo[][] = Array.from({ length: columnsCount }, () => []);
  photos.forEach((photo, idx) => {
    columns[idx % columnsCount].push(photo);
  });

  if (photos.length === 0) {
    return (
      <motion.div
        id="empty-gallery-state"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-3xl border border-white/5 bg-[#11121d]/20 backdrop-blur-sm max-w-md mx-auto mt-10"
      >
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full mb-4">
          <CameraOff className="w-8 h-8" />
        </div>
        <h3 className="text-white font-bold text-lg mb-1">Galería vacía</h3>
        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
          Nuestra galería está esperando por nuestro primer recuerdo. ¡Empieza subiendo una foto especial arriba!
        </p>
        <div className="inline-flex items-center gap-1 text-xs text-amber-400 font-medium">
          <Sparkles className="w-4 h-4 animate-spin-slow" />
          <span>Cada foto cuenta una historia nuestra</span>
        </div>
      </motion.div>
    );
  }

  return (
    <div id="masonry-grid-root" className="w-full">
      <div 
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${columnsCount}, minmax(0, 1fr))`,
        }}
      >
        <AnimatePresence mode="popLayout">
          {columns.map((columnPhotos, colIdx) => (
            <div key={`col-${colIdx}`} className="flex flex-col gap-4">
              {columnPhotos.map((photo) => (
                <ImageCard
                  key={photo.id}
                  photo={photo}
                  onDelete={onDelete}
                  onViewDetails={onViewDetails}
                />
              ))}
            </div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
