// Configuración automática según el entorno
// Detecta si estamos en producción (Netlify) o desarrollo (localhost)

(function() {
  'use strict';
  
  // Detectar si estamos en producción
  const hostname = window.location.hostname;
  const isProduction = hostname !== 'localhost' && 
                       hostname !== '127.0.0.1' &&
                       !hostname.startsWith('192.168.') &&
                       !hostname.startsWith('10.') &&
                       hostname !== '';
  
  if (isProduction) {
    // PRODUCCIÓN - URL de tu backend en Vercel
    window.API_BASE_URL = 'https://kpi-jefita.vercel.app';
  } else {
    // DESARROLLO LOCAL
    window.API_BASE_URL = 'http://localhost:3001';
  }
  
  // Log para debugging (solo en desarrollo)
  if (!isProduction) {
    console.log('🔧 Modo desarrollo - API:', window.API_BASE_URL);
  }
})();
