// Import des styles
import './assets/css/main.css'

// Import des composants
import './assets/js/components/searchbar.js'
import './assets/js/main.js'
import { MapViewer } from './assets/js/map.js'

// Initialisation de la carte
document.addEventListener('DOMContentLoaded', () => {
  const mapElement = document.getElementById('map');
  if (mapElement) {
    const mapViewer = new MapViewer('map');
  }
});