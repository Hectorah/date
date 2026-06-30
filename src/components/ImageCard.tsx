import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Calendar, Tag, HardDrive, ZoomIn, AlertTriangle, X, Check } from 'lucide-react';
import { Photo } from '../types';

interface ImageCardProps {
  key?: string | number;
  photo: Photo;
  onDelete: (id: string, storagePath?: string) => Promise<void>;
  onViewDetails: (photo: Photo) => void;
}

export default function ImageCard({ photo, onDelete, onViewDetails }: ImageCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirm(true);
  };

  const handleConfirmDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    try {
      await onDelete(photo.id, photo.storagePath);
    } catch (error) {
      console.error(error);
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirm(false);
  };

  return (
    <motion.div
      id={`photo-card-${photo.id}`}
      layout
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowConfirm(false);
      }}
      onClick={() => {
        if (!showConfirm) onViewDetails(photo);
      }}
      className="group relative overflow-hidden rounded-3xl border border-border-custom bg-surface shadow-md hover:shadow-[0_10px_30px_rgba(255,77,109,0.15)] transition-all duration-500 cursor-pointer w-full"
    >
      {/* Shimmer Placeholder/Skeleton before loaded */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10 animate-pulse flex items-center justify-center min-h-[220px]">
          <div className="w-10 h-10 border-2 border-accent-custom/30 border-t-accent-custom rounded-full animate-spin" />
        </div>
      )}

      {/* Image element */}
      <img
        src={photo.url}
        alt={photo.title}
        onLoad={() => setImageLoaded(true)}
        referrerPolicy="no-referrer"
        className={`w-full h-auto object-cover display-block transition-transform duration-700 ease-out ${
          imageLoaded ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        } ${isHovered ? 'scale-105' : 'scale-100'}`}
        style={{ maxHeight: '600px' }}
      />

      {/* Glass overlay on hover */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-[#0d0e15]/95 via-[#0d0e15]/40 to-black/10 flex flex-col justify-between p-4 transition-all duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Top actions: Category badge and Delete Button */}
        <div className="flex items-center justify-between w-full">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent-custom/20 text-accent-custom border border-accent-custom/30 backdrop-blur-md">
            <Tag className="w-2.5 h-2.5" />
            <span>{photo.category}</span>
          </span>
          
          <button
            id={`delete-btn-${photo.id}`}
            type="button"
            onClick={handleDeleteClick}
            className="p-2 rounded-xl bg-black/60 text-gray-400 hover:text-accent-custom hover:bg-black/90 hover:scale-105 transition-all duration-200 border border-border-custom shadow-md cursor-pointer"
            title="Borrar recuerdo"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom Metadata: Title, Date, Size, Zoom trigger */}
        <div className="space-y-2 mt-auto transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 ease-out">
          <h4 className="text-white font-bold text-base tracking-tight leading-tight drop-shadow-md">
            {photo.title}
          </h4>

          {photo.caption && (
            <p className="text-gray-300 text-xs line-clamp-2 drop-shadow">
              {photo.caption}
            </p>
          )}

          <div className="flex items-center justify-between text-[11px] text-gray-400 border-t border-border-custom pt-2 font-mono">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-amber-400" />
                {formatDate(photo.createdAt)}
              </span>
              {photo.size && (
                <span className="flex items-center gap-0.5">
                  <HardDrive className="w-3 h-3 text-accent-custom" />
                  {photo.size}
                </span>
              )}
            </div>
            
            <div className="text-white/60 group-hover:text-amber-400 transition-colors">
              <ZoomIn className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Inline Glassmorphic Confirm Delete Overlay */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            id={`confirm-overlay-${photo.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-0 bg-bg/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-10"
          >
            <motion.div
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 10 }}
              className="space-y-4"
            >
              <div className="mx-auto w-12 h-12 bg-accent-custom/10 border border-accent-custom/30 text-accent-custom rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              
              <div className="space-y-1">
                <h5 className="text-white font-bold text-sm">¿Borrar este recuerdo?</h5>
                <p className="text-gray-400 text-xs px-2 leading-relaxed">
                  Esta acción eliminará de forma permanente "<strong>{photo.title}</strong>". No se puede deshacer.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancelDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 font-medium text-xs rounded-xl border border-border-custom transition-all cursor-pointer flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Conservar</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-accent-custom hover:opacity-90 text-white font-semibold text-xs rounded-xl shadow-lg shadow-accent-custom/20 transition-all cursor-pointer flex items-center gap-1"
                >
                  {isDeleting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>{isDeleting ? 'Borrando...' : 'Sí, borrar'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
