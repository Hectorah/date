import { Photo } from './types';

export const initialPhotos: Photo[] = [
  {
    id: 'sample-1',
    url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&q=80&w=600',
    title: 'Paseando de la mano al atardecer',
    category: 'Aventuras',
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
    size: '1.4 MB',
    caption: 'Aquel paseo por la playa donde el cielo se volvió completamente rosa. Una de nuestras tardes más sencillas y memorables juntos.',
  },
  {
    id: 'sample-2',
    url: 'https://images.unsplash.com/photo-1543807535-eceef0bc6599?auto=format&fit=crop&q=80&w=600',
    title: 'Nuestra cafetería favorita',
    category: 'Cenas',
    createdAt: Date.now() - 25 * 24 * 60 * 60 * 1000, // 25 days ago
    size: '1.1 MB',
    caption: 'Café caliente, risas y lluvia afuera. No hay mejor refugio en todo el mundo que estar a tu lado.',
  },
  {
    id: 'sample-3',
    url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=600',
    title: 'Escapada a la cabaña',
    category: 'Viajes',
    createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000, // 15 days ago
    size: '2.5 MB',
    caption: 'Desconectar de la ciudad para conectar con nosotros. Despertarse con el sonido de los pájaros y el aroma a bosque frío.',
  },
  {
    id: 'sample-4',
    url: 'https://images.unsplash.com/photo-1494972308805-463bc619d34e?auto=format&fit=crop&q=80&w=600',
    title: 'Luces mágicas de aniversario',
    category: 'Aniversarios',
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
    size: '1.8 MB',
    caption: 'Brillando en la noche como el primer día. Feliz aniversario, mi amor. Que la magia nunca se apague.',
  },
  {
    id: 'sample-5',
    url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&q=80&w=600',
    title: 'Domingo por la mañana en casa',
    category: 'En Casa',
    createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 day ago
    size: '950 KB',
    caption: 'Desayuno tardío en la cama, música suave de fondo y todo el tiempo del mundo por delante.',
  },
  {
    id: 'sample-6',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600',
    title: 'Risas cómplices bajo la lluvia',
    category: 'Momentos Especiales',
    createdAt: Date.now() - 12 * 60 * 60 * 1000, // 12 hours ago
    size: '1.6 MB',
    caption: 'El paraguas no sirvió de mucho, pero nos reímos tanto que se nos olvidó por completo el frío.',
  },
];
