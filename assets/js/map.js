import L from 'leaflet';

export class MapViewer {
  constructor(elementId) {
    this.map = L.map(elementId).setView([46.603354, 1.888334], 6); // Centre de la France
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.markers = L.layerGroup().addTo(this.map);
    this.initializeControls();
  }

  initializeControls() {
    // Sélecteur de région
    const regionSelect = document.getElementById('region-select');
    if (regionSelect) {
      regionSelect.addEventListener('change', (e) => {
        const region = e.target.value;
        if (region) {
          this.focusOnRegion(region);
        }
      });
    }

    // Géolocalisation
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          this.map.setView([latitude, longitude], 12);
          this.loadNearbyNetworks(latitude, longitude);
        },
        (error) => {
          console.log('Géolocalisation non disponible:', error);
        }
      );
    }
  }

  focusOnRegion(regionCode) {
    // Coordonnées des régions (à compléter avec les vraies coordonnées)
    const regions = {
      'IDF': { center: [48.8566, 2.3522], zoom: 9 },
      'ARA': { center: [45.7578, 4.8320], zoom: 8 },
      'PACA': { center: [43.7102, 7.2620], zoom: 8 }
    };

    if (regions[regionCode]) {
      const { center, zoom } = regions[regionCode];
      this.map.setView(center, zoom);
    }
  }

  loadNearbyNetworks(lat, lon) {
    // Simulation de chargement des réseaux proches
    // À remplacer par un appel API réel
    const mockNetworks = [
      {
        id: 'tcl',
        name: 'TCL Lyon',
        coordinates: [45.7578, 4.8320],
        type: 'all'
      },
      {
        id: 'ratp',
        name: 'RATP Paris',
        coordinates: [48.8566, 2.3522],
        type: 'all'
      }
    ];

    this.displayNetworks(mockNetworks);
  }

  displayNetworks(networks) {
    this.markers.clearLayers();

    networks.forEach(network => {
      const marker = L.marker(network.coordinates)
        .bindPopup(`
          <div class="network-popup">
            <h3>${network.name}</h3>
            <a href="/network/${network.id}" class="btn btn-primary btn-sm">Voir le réseau</a>
          </div>
        `);
      
      this.markers.addLayer(marker);
    });
  }
}