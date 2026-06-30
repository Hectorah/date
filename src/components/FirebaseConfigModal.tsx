import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Database, Cloud, AlertCircle, Check, X, ShieldAlert, Sparkles, Copy, Trash2 } from 'lucide-react';
import { FirebaseConfig } from '../types';

interface FirebaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: FirebaseConfig | null;
  useFirebase: boolean;
  onSaveConfig: (config: FirebaseConfig | null, enableFirebase: boolean) => void;
  isFirebaseConnected: boolean;
  connectionError: string | null;
}

export default function FirebaseConfigModal({
  isOpen,
  onClose,
  config,
  useFirebase,
  onSaveConfig,
  isFirebaseConnected,
  connectionError
}: FirebaseConfigModalProps) {
  const [localUseFirebase, setLocalUseFirebase] = useState(useFirebase);
  const [jsonInput, setJsonInput] = useState('');
  const [fields, setFields] = useState<FirebaseConfig>({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync state on load
  useEffect(() => {
    if (config) {
      setFields({
        apiKey: config.apiKey || '',
        authDomain: config.authDomain || '',
        projectId: config.projectId || '',
        storageBucket: config.storageBucket || '',
        messagingSenderId: config.messagingSenderId || '',
        appId: config.appId || ''
      });
      setJsonInput(JSON.stringify(config, null, 2));
    }
    setLocalUseFirebase(useFirebase);
  }, [config, useFirebase, isOpen]);

  const handleJsonPaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setJsonInput(val);
    if (!val.trim()) return;

    try {
      // Try to clean JSON string or search for the config object inside pasted code
      let parsed: any = null;
      
      // Check if it's a JS object from Firebase Console
      if (val.includes('firebaseConfig = {') || val.includes('const firebaseConfig = {')) {
        const match = val.match(/\{[\s\S]*?\}/);
        if (match) {
          // Convert JS object syntax to valid JSON (keys to double quotes)
          const jsObjStr = match[0]
            .replace(/([a-zA-Z0-9_]+)\s*:/g, '"$1":')
            .replace(/'/g, '"')
            .replace(/,(\s*[\]}])/g, '$1'); // trailing comma
          parsed = JSON.parse(jsObjStr);
        }
      } else {
        parsed = JSON.parse(val);
      }

      if (parsed) {
        const extracted: FirebaseConfig = {
          apiKey: parsed.apiKey || '',
          authDomain: parsed.authDomain || '',
          projectId: parsed.projectId || '',
          storageBucket: parsed.storageBucket || '',
          messagingSenderId: parsed.messagingSenderId || '',
          appId: parsed.appId || ''
        };
        setFields(extracted);
        setErrorMsg(null);
        setSuccessMsg('¡Configuración autodetectada correctamente!');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err) {
      // Ignore intermediate typing errors
    }
  };

  const handleFieldChange = (key: keyof FirebaseConfig, val: string) => {
    setFields(prev => ({ ...prev, [key]: val }));
    setErrorMsg(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (localUseFirebase) {
      // Validate that all fields are filled
      const missingFields = Object.entries(fields)
        .filter(([_, v]) => !((v as string) || '').trim())
        .map(([k]) => k);

      if (missingFields.length > 0) {
        setErrorMsg(`Faltan campos obligatorios: ${missingFields.join(', ')}`);
        return;
      }
    }

    const hasConfig = Object.values(fields).some(v => ((v as string) || '').trim() !== '');
    const finalConfig = hasConfig ? fields : null;

    onSaveConfig(finalConfig, localUseFirebase);
    setSuccessMsg('¡Configuración guardada!');
    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 1000);
  };

  const handleClearConfig = () => {
    setFields({
      apiKey: '',
      authDomain: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: ''
    });
    setJsonInput('');
    setLocalUseFirebase(false);
    onSaveConfig(null, false);
    setErrorMsg(null);
    setSuccessMsg('Configuración borrada. Volviendo al Sandbox local.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  if (!isOpen) return null;

  return (
    <div id="firebase-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/90 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative max-w-2xl w-full bg-surface border border-border-custom rounded-3xl shadow-2xl overflow-hidden my-8"
      >
        {/* Header decoration */}
        <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-accent-custom via-amber-500 to-accent-custom" />
        
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-accent-custom/10 border border-accent-custom/20 text-accent-custom rounded-xl">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Configuración del Backend</h2>
              <p className="text-gray-400 text-xs">Ajustes de persistencia, sincronización y almacenamiento</p>
            </div>
          </div>

          {/* Connection Status indicator */}
          <div className="mb-6 p-4 rounded-2xl bg-bg border border-border-custom flex items-start gap-3">
            {useFirebase ? (
              isFirebaseConnected ? (
                <>
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                    <Cloud className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Firebase Conectado</h4>
                    <p className="text-gray-300 text-[11px] leading-relaxed mt-0.5">
                      La galería se está guardando y sincronizando en tiempo real en tu base de datos de Firebase Firestore y Storage.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-amber-400 text-xs font-bold uppercase tracking-wider">Conectando a Firebase...</h4>
                    <p className="text-gray-300 text-[11px] leading-relaxed mt-0.5">
                      {connectionError ? (
                        <span className="text-accent-custom font-medium">Error de conexión: {connectionError}. Revisa tus credenciales.</span>
                      ) : (
                        'Validando credenciales con los servidores de Google Firebase.'
                      )}
                    </p>
                  </div>
                </>
              )
            ) : (
              <>
                <div className="p-2 bg-accent-custom/10 text-accent-custom rounded-lg">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-accent-custom text-xs font-bold uppercase tracking-wider">Modo Sandbox Local (Activo)</h4>
                  <p className="text-gray-300 text-[11px] leading-relaxed mt-0.5">
                    Tus fotos se guardan localmente en tu navegador mediante <strong>localStorage</strong>. Ideal para pruebas rápidas sin configurar bases de datos externas.
                  </p>
                </div>
              </>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* Toggle Mode */}
            <div className="flex items-center justify-between p-4 bg-bg/40 rounded-2xl border border-border-custom">
              <div>
                <h3 className="text-white text-sm font-bold flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-amber-400" />
                  <span>Sincronizar con Firebase</span>
                </h3>
                <p className="text-gray-400 text-[11px] mt-0.5">Activa para usar una base de datos real en la nube.</p>
              </div>
              <button
                type="button"
                onClick={() => setLocalUseFirebase(!localUseFirebase)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  localUseFirebase ? 'bg-gradient-to-r from-accent-custom to-amber-500' : 'bg-gray-800'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localUseFirebase ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {localUseFirebase && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-5 overflow-hidden"
              >
                {/* JSON Paste Area */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex justify-between items-center">
                    <span>Pegar Objeto de Configuración de Firebase (Consola)</span>
                    <span className="text-[10px] text-gray-500 font-normal">Autodetecta campos</span>
                  </label>
                  <textarea
                    id="firebase-json-input"
                    placeholder="const firebaseConfig = {&#10;  apiKey: &quot;...&quot;,&#10;  authDomain: &quot;...&quot;,&#10;  projectId: &quot;...&quot;,&#10;  storageBucket: &quot;...&quot;,&#10;  ...&#10;};"
                    value={jsonInput}
                    onChange={handleJsonPaste}
                    className="w-full h-24 px-4 py-3 bg-bg border border-border-custom rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-accent-custom/50 font-mono text-[11px] leading-relaxed"
                  />
                </div>

                {/* Form fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">API Key</label>
                    <input
                      type="text"
                      value={fields.apiKey}
                      onChange={(e) => handleFieldChange('apiKey', e.target.value)}
                      required={localUseFirebase}
                      placeholder="AIzaSy..."
                      className="w-full px-3.5 py-2.5 bg-bg border border-border-custom rounded-xl text-white text-xs font-mono placeholder:text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent-custom/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Auth Domain</label>
                    <input
                      type="text"
                      value={fields.authDomain}
                      onChange={(e) => handleFieldChange('authDomain', e.target.value)}
                      required={localUseFirebase}
                      placeholder="proyecto.firebaseapp.com"
                      className="w-full px-3.5 py-2.5 bg-bg border border-border-custom rounded-xl text-white text-xs font-mono placeholder:text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent-custom/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Project ID</label>
                    <input
                      type="text"
                      value={fields.projectId}
                      onChange={(e) => handleFieldChange('projectId', e.target.value)}
                      required={localUseFirebase}
                      placeholder="nombre-proyecto"
                      className="w-full px-3.5 py-2.5 bg-bg border border-border-custom rounded-xl text-white text-xs font-mono placeholder:text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent-custom/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Storage Bucket</label>
                    <input
                      type="text"
                      value={fields.storageBucket}
                      onChange={(e) => handleFieldChange('storageBucket', e.target.value)}
                      required={localUseFirebase}
                      placeholder="proyecto.appspot.com"
                      className="w-full px-3.5 py-2.5 bg-bg border border-border-custom rounded-xl text-white text-xs font-mono placeholder:text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent-custom/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Messaging Sender ID</label>
                    <input
                      type="text"
                      value={fields.messagingSenderId}
                      onChange={(e) => handleFieldChange('messagingSenderId', e.target.value)}
                      required={localUseFirebase}
                      placeholder="83137510..."
                      className="w-full px-3.5 py-2.5 bg-bg border border-border-custom rounded-xl text-white text-xs font-mono placeholder:text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent-custom/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">App ID</label>
                    <input
                      type="text"
                      value={fields.appId}
                      onChange={(e) => handleFieldChange('appId', e.target.value)}
                      required={localUseFirebase}
                      placeholder="1:83137510:web:abc..."
                      className="w-full px-3.5 py-2.5 bg-bg border border-border-custom rounded-xl text-white text-xs font-mono placeholder:text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent-custom/30"
                    />
                  </div>
                </div>

                {/* Info and steps */}
                <div className="p-4 rounded-2xl bg-amber-500/5 border border-border-custom space-y-2">
                  <h5 className="text-amber-400 text-xs font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>¿Cómo configurar tu Firebase gratis?</span>
                  </h5>
                  <ol className="list-decimal list-inside text-gray-400 text-[10px] space-y-1.5 pl-1 leading-relaxed">
                    <li>Entra en <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-amber-300 underline">console.firebase.google.com</a> y crea un proyecto gratuito.</li>
                    <li>Crea una base de datos <strong>Firestore Database</strong> (Modo de prueba) y habilita <strong>Firebase Storage</strong> para guardar archivos.</li>
                    <li>Registra una Web App en el menú del proyecto, copia el código de configuración y pégalo aquí arriba.</li>
                  </ol>
                </div>
              </motion.div>
            )}

            {/* Error & Success Messages */}
            <AnimatePresence mode="wait">
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3.5 bg-accent-custom/10 border border-accent-custom/20 text-accent-custom rounded-xl text-xs flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-accent-custom" />
                  <span>{errorMsg}</span>
                </motion.div>
              )}
              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs flex items-center gap-2"
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{successMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border-custom">
              <button
                type="button"
                onClick={handleClearConfig}
                className="px-4 py-2.5 bg-white/5 hover:bg-accent-custom/10 hover:text-accent-custom hover:border-accent-custom/20 border border-border-custom text-gray-500 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Restablecer</span>
              </button>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 border border-border-custom text-gray-400 hover:text-white hover:bg-white/5 transition-all text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-accent-custom to-amber-500 hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer active:scale-95"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
