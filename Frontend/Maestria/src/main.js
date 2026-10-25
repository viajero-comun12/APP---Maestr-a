/**
 * Punto de entrada principal de la aplicación Web Frontend
 * Cursos Preparatorios para Programas de Maestría
 */

import './style.css';
import { Router } from './router.js';

// Inicializar router al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  const router = new Router('app');
  router.init();
});
