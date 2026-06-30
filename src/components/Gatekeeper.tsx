import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Lock, Sparkles, AlertCircle } from 'lucide-react';

interface GatekeeperProps {
  onUnlock: () => void;
  correctCode: string;
}

export default function Gatekeeper({ onUnlock, correctCode }: GatekeeperProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().toLowerCase() === correctCode.toLowerCase()) {
      onUnlock();
    } else {
      setError(true);
      setAttempts(prev => prev + 1);
      setTimeout(() => setError(false), 500); // Reset shake after animation
    }
  };

  return (
    <div id="gatekeeper-root" className="fixed inset-0 z-50 flex items-center justify-center bg-bg overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-accent-custom/10 rounded-full blur-[100px]" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px]" />
      
      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative max-w-md w-full mx-4 px-8 py-10 bg-surface/90 border border-border-custom rounded-3xl backdrop-blur-xl shadow-[0_0_50px_rgba(255,77,109,0.15)] text-center"
      >
        {/* Heart Logo */}
        <div className="relative mx-auto w-20 h-20 mb-6 flex items-center justify-center rounded-2xl bg-gradient-to-tr from-accent-custom/20 to-amber-500/20 border border-accent-custom/30">
          <motion.div
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            className="text-accent-custom"
          >
            <Heart className="w-10 h-10 fill-accent-custom/40" />
          </motion.div>
          <div className="absolute -top-1 -right-1 text-amber-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
          Nuestro Rincón Privado
        </h1>
        <p className="text-gray-400 text-sm mb-8 px-4">
          Un espacio íntimo y seguro para conservar nuestros momentos favoritos. Introduce nuestro código de acceso.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
              <Lock className="w-5 h-5" />
            </div>
            <motion.input
              id="passcode-input"
              type="password"
              placeholder="Código de Acceso"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                if (error) setError(false);
              }}
              animate={error ? { x: [-10, 10, -10, 10, -5, 5, 0] } : {}}
              transition={{ duration: 0.4 }}
              className={`w-full py-4 pl-12 pr-4 bg-bg border ${
                error ? 'border-accent-custom ring-2 ring-accent-custom/20' : 'border-border-custom hover:border-gray-500'
              } rounded-2xl text-white text-center text-lg placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-accent-custom/50 transition-all font-mono`}
            />
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-center gap-2 text-accent-custom text-xs font-medium"
              >
                <AlertCircle className="w-4 h-4" />
                <span>Código incorrecto. ¡Inténtalo de nuevo, amor!</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            id="unlock-button"
            type="submit"
            className="w-full mt-2 py-4 bg-gradient-to-r from-accent-custom to-amber-500 hover:opacity-90 text-white font-semibold rounded-2xl shadow-[0_4px_20px_rgba(255,77,109,0.3)] hover:shadow-[0_4px_25px_rgba(255,77,109,0.5)] transform active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Desbloquear Galería</span>
            <Sparkles className="w-4 h-4" />
          </button>
        </form>

        {/* Dynamic Helper Badge */}
        <div className="mt-8 pt-6 border-t border-border-custom flex flex-col items-center gap-2">
          <span className="text-xs text-gray-500">
            ¿Es tu primera visita o estás de pruebas?
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-accent-custom/10 text-accent-custom border border-accent-custom/20">
            💡 Código predeterminado: <span className="font-mono font-bold ml-1">{correctCode}</span>
          </span>
        </div>
      </motion.div>
    </div>
  );
}
