import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Tag, HardDrive, Edit3, Check, ChevronLeft, ChevronRight, Share2, Sparkles } from 'lucide-react';
import { Photo } from '../types';

interface PhotoDetailModalProps {
  photo: Photo;
  isOpen: boolean;
  onClose: () => void;
  onUpdateCaption: (id: string, caption: string) => Promise<void>;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function PhotoDetailModal({
  photo,
  isOpen,
  onClose,
  onUpdateCaption,
  onNext,
  onPrev,
  hasNext,
  hasPrev
}: PhotoDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [captionText, setCaptionText] = useState(photo.caption || '');
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCaptionText(photo.caption || '');
    setIsEditing(false);
  }, [photo]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && hasNext && onNext) onNext();
      if (e.key === 'ArrowLeft' && hasPrev && onPrev) onPrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasNext, hasPrev, onNext, onPrev, onClose]);

  const handleSaveCaption = async () => {
    setIsSaving(true);
    try {
      await onUpdateCaption(photo.id, captionText);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(photo.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div id="detail-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-bg/95 backdrop-blur-md p-4 md:p-8">
      {/* Dynamic Background Glow representing photo vibes */}
      <div className="absolute inset-0 bg-cover bg-center blur-[120px] opacity-10 select-none pointer-events-none" style={{ backgroundImage: `url(${photo.url})` }} />

      {/* Close trigger outside */}
      <div className="absolute inset-0 cursor-zoom-out" onClick={onClose} />

      {/* Floating control buttons */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
        <button
          type="button"
          onClick={handleShare}
          className="p-3 rounded-full bg-[#161821]/60 hover:bg-[#161821]/90 text-gray-300 hover:text-white transition-all backdrop-blur-md border border-border-custom cursor-pointer flex items-center gap-1 text-sm font-medium"
          title="Copiar enlace directo"
        >
          <Share2 className="w-4 h-4" />
          <span>{copied ? '¡Copiado!' : 'Compartir'}</span>
        </button>
        
        <button
          type="button"
          onClick={onClose}
          className="p-3 rounded-full bg-[#161821]/60 hover:bg-[#161821]/90 text-gray-300 hover:text-white transition-all backdrop-blur-md border border-border-custom cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Keyboard instructions */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#161821]/60 text-[10px] text-gray-500 font-mono border border-border-custom">
        <span>Usa las flechas</span>
        <span className="px-1 py-0.5 rounded bg-white/10">←</span>
        <span>y</span>
        <span className="px-1 py-0.5 rounded bg-white/10">→</span>
        <span>para navegar</span>
      </div>

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl h-full max-h-[85vh] bg-surface border border-border-custom rounded-[32px] overflow-hidden flex flex-col md:flex-row z-10 shadow-2xl"
      >
        {/* Left Side: Immersive Image Viewer */}
        <div className="relative flex-1 bg-black/40 flex items-center justify-center p-4 min-h-[35vh] md:min-h-0">
          <img
            src={photo.url}
            alt={photo.title}
            className="max-w-full max-h-[40vh] md:max-h-[75vh] object-contain rounded-2xl shadow-xl select-none"
            referrerPolicy="no-referrer"
          />

          {/* Left Navigation Arrow */}
          {hasPrev && onPrev && (
            <button
              type="button"
              onClick={onPrev}
              className="absolute left-4 p-2.5 rounded-full bg-black/60 text-gray-400 hover:text-white hover:bg-black/80 hover:scale-105 transition-all cursor-pointer border border-border-custom"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Right Navigation Arrow */}
          {hasNext && onNext && (
            <button
              type="button"
              onClick={onNext}
              className="absolute right-4 p-2.5 rounded-full bg-black/60 text-gray-400 hover:text-white hover:bg-black/80 hover:scale-105 transition-all cursor-pointer border border-border-custom"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Right Side: Detail Panel */}
        <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-border-custom p-6 flex flex-col justify-between overflow-y-auto bg-surface/60 backdrop-blur-xl">
          <div className="space-y-6">
            {/* Category / Album badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent-custom/20 text-accent-custom border border-accent-custom/30">
              <Tag className="w-3 h-3" />
              <span>{photo.category}</span>
            </span>

            {/* Title */}
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight leading-tight">
                {photo.title}
              </h2>
              <div className="flex flex-col gap-1.5 text-xs text-gray-500 font-mono mt-3">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  {formatDate(photo.createdAt)}
                </span>
                {photo.size && (
                  <span className="flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-accent-custom" />
                    Tamaño: {photo.size}
                  </span>
                )}
              </div>
            </div>

            {/* Caption / Notes area */}
            <div className="border-t border-border-custom pt-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Nuestra Historia</span>
                </h3>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="p-1 rounded-lg text-gray-500 hover:text-accent-custom hover:bg-white/5 transition-all cursor-pointer"
                    title="Editar nota de amor"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <AnimatePresence mode="wait">
                {isEditing ? (
                  <motion.div
                    key="editing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3"
                  >
                    <textarea
                      id="caption-text-area"
                      value={captionText}
                      onChange={(e) => setCaptionText(e.target.value)}
                      placeholder="Escribe un recuerdo, una frase, o lo que significó este día para vosotros..."
                      className="w-full h-32 p-3 bg-bg border border-border-custom rounded-xl text-white placeholder:text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent-custom/50 text-sm leading-relaxed"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCaptionText(photo.caption || '');
                          setIsEditing(false);
                        }}
                        className="px-3 py-1.5 rounded-lg border border-border-custom text-gray-400 hover:text-white hover:bg-white/5 transition-all text-xs cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveCaption}
                        disabled={isSaving}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-accent-custom to-amber-500 hover:opacity-90 text-white font-semibold text-xs flex items-center gap-1 shadow-md cursor-pointer"
                      >
                        {isSaving ? (
                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                        <span>Guardar</span>
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.p
                    key="viewing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-gray-300 text-sm leading-relaxed italic border-l-2 border-accent-custom/40 pl-3 py-1 bg-accent-custom/[0.01]"
                  >
                    {photo.caption ? photo.caption : (
                      <span className="text-gray-600 italic">
                        Haz clic en el icono de edición para contar la historia detrás de esta foto especial...
                      </span>
                    )}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="pt-6 border-t border-border-custom text-center mt-6">
            <span className="text-[10px] text-gray-600 font-mono">
              AMOUR PRIVATE GALLERY
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
