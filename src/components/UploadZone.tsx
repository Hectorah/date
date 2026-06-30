import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Image as ImageIcon, Sparkles, X, Check, Loader2, Calendar } from 'lucide-react';

interface UploadZoneProps {
  onUploadSuccess: (data: { url: string; title: string; category: string; size: string; storagePath?: string }) => Promise<void>;
  isUploading: boolean;
  uploadProgress: number;
}

const PRESET_CATEGORIES = [
  'Viajes',
  'Cenas',
  'Aventuras',
  'Aniversarios',
  'En Casa',
  'Momentos Especiales',
  'Otros'
];

export default function UploadZone({ onUploadSuccess, isUploading, uploadProgress }: UploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Momentos Especiales');
  const [customCategory, setCustomCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecciona un archivo de imagen válido.');
      return;
    }
    
    // Check size limit (max 10MB for local sandbox mode safety)
    if (file.size > 10 * 1024 * 1024) {
      alert('La imagen es demasiado grande. El límite es de 10MB.');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
      // Auto-suggest title based on file name without extension
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const cleanTitle = nameWithoutExt.replace(/[-_]/g, ' ');
      setTitle(cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1));
      setShowForm(true);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !previewUrl) return;

    const finalCategory = category === 'Otros' && customCategory.trim() ? customCategory.trim() : category;
    const finalTitle = title.trim() || 'Nuestro Momento';
    const fileSizeStr = formatFileSize(selectedFile.size);

    try {
      // In local mode, we pass the base64 previewUrl directly
      // In parent Firebase mode, the parent can perform real Storage upload using the selectedFile,
      // or fall back to base64 saving in simulated mode.
      // We pass both selectedFile and previewUrl via context/helper
      
      // Let's attach file metadata to previewUrl or let parent handle uploading file
      // To bridge both, we'll return an object that the parent's upload handler can use:
      await onUploadSuccess({
        url: previewUrl, // contains base64 representation
        title: finalTitle,
        category: finalCategory,
        size: fileSizeStr,
        storagePath: `gallery/${Date.now()}_${selectedFile.name}`
      });

      // Clear state on success
      setSelectedFile(null);
      setPreviewUrl(null);
      setTitle('');
      setCustomCategory('');
      setShowForm(false);
    } catch (error) {
      console.error('Error al subir:', error);
      alert('Error al subir la imagen. Por favor, inténtalo de nuevo.');
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setTitle('');
    setShowForm(false);
  };

  return (
    <div id="upload-zone-wrapper" className="w-full max-w-3xl mx-auto mb-10">
      <AnimatePresence mode="wait">
        {!showForm ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="relative"
          >
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`group flex flex-col items-center justify-center p-8 md:p-12 border-2 border-dashed ${
                isDragActive
                  ? 'border-accent-custom bg-accent-custom/5 shadow-[0_0_20px_rgba(255,77,109,0.15)]'
                  : 'border-border-custom bg-surface/40 hover:bg-surface/70 hover:border-gray-500'
              } rounded-3xl cursor-pointer transition-all duration-300 backdrop-blur-sm text-center`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleChange}
              />
              
              {/* Animated Floating Upload Icon */}
              <div className="relative mb-4 p-4 rounded-2xl bg-bg border border-border-custom group-hover:border-accent-custom/30 group-hover:bg-accent-custom/5 transition-all duration-300">
                <Upload className={`w-8 h-8 text-gray-400 group-hover:text-accent-custom transition-all duration-300 ${isDragActive ? 'animate-bounce' : ''}`} />
                <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-amber-400 animate-pulse" />
              </div>

              <h3 className="text-white font-medium text-lg mb-1 group-hover:text-accent-custom transition-colors">
                Arrastra y suelta tu foto aquí
              </h3>
              <p className="text-gray-400 text-sm max-w-sm mb-4 leading-relaxed">
                Soporta archivos JPG, PNG o GIF de alta resolución. O haz clic para examinar tus carpetas.
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-bg text-gray-400 border border-border-custom group-hover:border-gray-600 group-hover:text-gray-300 transition-all">
                <Calendar className="w-3.5 h-3.5 text-accent-custom" />
                <span>Conserva el recuerdo para siempre</span>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="metadata-form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-6 md:p-8 bg-surface/90 border border-border-custom rounded-3xl backdrop-blur-xl shadow-2xl"
          >
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-border-custom pb-4">
              <ImageIcon className="w-5 h-5 text-accent-custom" />
              <span>Detalles del Recuerdo</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {/* Thumbnail preview */}
              <div className="md:col-span-2 flex flex-col items-center">
                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-border-custom shadow-lg bg-bg">
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-accent-custom transition-all backdrop-blur-md"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {selectedFile && (
                  <span className="text-[11px] text-gray-500 mt-2 font-mono">
                    {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </span>
                )}
              </div>

              {/* Form entries */}
              <form onSubmit={handleSubmit} className="md:col-span-3 space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="photo-title-input" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                      Título o Mensaje
                    </label>
                    <input
                      id="photo-title-input"
                      type="text"
                      placeholder="Ej. Nuestro primer café, Viaje a Madrid..."
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={isUploading}
                      className="w-full px-4 py-3 bg-bg border border-border-custom rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-accent-custom/50 focus:border-accent-custom/50 transition-all text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="photo-category-select" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                      Categoría / Álbum
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      <select
                        id="photo-category-select"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        disabled={isUploading}
                        className="w-full px-4 py-3 bg-bg border border-border-custom rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-accent-custom/50 transition-all text-sm appearance-none cursor-pointer"
                      >
                        {PRESET_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat} className="bg-bg">
                            {cat}
                          </option>
                        ))}
                      </select>
                      
                      {category === 'Otros' && (
                        <motion.input
                          id="custom-category-input"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          type="text"
                          placeholder="Introduce categoría personalizada"
                          required
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          disabled={isUploading}
                          className="w-full px-4 py-3 mt-1 bg-bg border border-border-custom rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-accent-custom/50 transition-all text-sm"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress bar or Button Controls */}
                <div className="pt-4">
                  {isUploading ? (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs text-gray-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-custom" />
                          Subiendo recuerdo...
                        </span>
                        <span>{Math.round(uploadProgress)}%</span>
                      </div>
                      <div className="w-full h-2 bg-bg rounded-full overflow-hidden border border-border-custom">
                        <motion.div
                          className="h-full bg-gradient-to-r from-accent-custom to-amber-400"
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress}%` }}
                          transition={{ duration: 0.1 }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3 justify-end">
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="px-5 py-2.5 rounded-xl border border-border-custom text-gray-400 hover:text-white hover:bg-white/5 transition-all text-sm cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-custom to-amber-500 hover:opacity-90 text-white font-semibold shadow-lg hover:shadow-accent-custom/10 flex items-center gap-2 transition-all text-sm cursor-pointer active:scale-95"
                      >
                        <Check className="w-4 h-4" />
                        <span>Guardar Recuerdo</span>
                      </button>
                    </div>
                  )}
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
