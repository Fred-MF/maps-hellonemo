/**
 * Gestion des fonctionnalités de la barre de recherche
 */
document.addEventListener('DOMContentLoaded', function() {
  const searchbar = document.querySelector('.searchbar');
  
  if (!searchbar) return;
  
  const searchInput = searchbar.querySelector('.searchbar-input');
  const clearButton = searchbar.querySelector('.searchbar-clear');
  const resultsContainer = searchbar.querySelector('.searchbar-results');
  
  // Variables pour la gestion du délai de recherche
  let searchTimeout = null;
  const SEARCH_DELAY = 300; // ms
  
  // Masquer le bouton de suppression par défaut
  if (clearButton) {
    clearButton.style.display = 'none';
  }
  
  // Fonction pour effectuer la recherche
  function performSearch(query) {
    if (!query || query.length < 2) {
      hideResults();
      return;
    }
    
    // Simuler un chargement (à remplacer par un appel API réel)
    showLoading();
    
    // Simulons une recherche (remplacer par l'appel à l'API réelle)
    setTimeout(() => {
      const mockResults = getMockResults(query);
      displayResults(mockResults, query);
      hideLoading();
    }, 500);
  }
  
  // Fonction pour afficher les résultats
  function displayResults(results, query) {
    if (!resultsContainer) return;
    
    if (results.length === 0) {
      resultsContainer.innerHTML = `<div class="searchbar-no-results">Aucun résultat pour "${query}"</div>`;
      resultsContainer.style.display = 'block';
      return;
    }
    
    // Grouper les résultats par catégorie
    const groupedResults = results.reduce((acc, result) => {
      if (!acc[result.category]) {
        acc[result.category] = [];
      }
      acc[result.category].push(result);
      return acc;
    }, {});
    
    // Construire le HTML
    let html = '';
    
    // Pour chaque catégorie
    Object.keys(groupedResults).forEach(category => {
      html += `<div class="searchbar-category-title">${category}</div>`;
      
      groupedResults[category].forEach(result => {
        // Mettre en évidence les termes de recherche
        const highlightedTitle = highlightText(result.title, query);
        const highlightedSubtitle = result.subtitle ? highlightText(result.subtitle, query) : '';
        
        html += `
          <div class="searchbar-result-item" data-id="${result.id}" data-type="${result.type}">
            <div class="searchbar-result-icon">
              <span class="icon icon-md ${result.iconClass || ''}">
                <i class="material-icons">${result.icon}</i>
              </span>
            </div>
            <div class="searchbar-result-content">
              <div class="searchbar-result-title">${highlightedTitle}</div>
              ${result.subtitle ? `<div class="searchbar-result-subtitle">${highlightedSubtitle}</div>` : ''}
            </div>
          </div>
        `;
      });
    });
    
    resultsContainer.innerHTML = html;
    resultsContainer.style.display = 'block';
    
    // Ajouter des écouteurs d'événements aux résultats
    attachResultClickHandlers();
  }
  
  // Fonction pour mettre en évidence les termes de recherche
  function highlightText(text, query) {
    const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
    return text.replace(regex, '<span class="searchbar-result-highlight">$1</span>');
  }
  
 // Échapper les caractères spéciaux dans une chaîne pour les regex
 	function escapeRegExp(string) {
  	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Échappe chaque caractère spécial
	}
  
  // Fonction pour attacher des écouteurs aux résultats
  function attachResultClickHandlers() {
    const resultItems = resultsContainer.querySelectorAll('.searchbar-result-item');
    
    resultItems.forEach(item => {
      item.addEventListener('click', function() {
        const id = this.dataset.id;
        const type = this.dataset.type;
        
        // Navigation vers la page de résultat
        navigateToResult(id, type);
      });
    });
  }
  
  // Fonction pour naviguer vers un résultat
  function navigateToResult(id, type) {
    // Simuler la navigation (à remplacer par le comportement réel)
    console.log(`Navigating to ${type} with ID ${id}`);
    
    // Exemples de navigation selon le type
    switch (type) {
      case 'network':
        window.location.href = `/region/network/${id}`;
        break;
      case 'line':
        window.location.href = `/region/network/lines/${id}`;
        break;
      case 'stop':
        window.location.href = `/region/network/stops/${id}`;
        break;
      default:
        console.log('Unknown result type');
    }
  }
  
  // Fonction pour afficher le spinner de chargement
  function showLoading() {
    const loadingElement = searchbar.querySelector('.searchbar-loading');
    
    if (!loadingElement) {
      const loadingHtml = `
        <div class="searchbar-loading">
          <span class="icon icon-md icon-spin"><i class="material-icons">refresh</i></span>
        </div>
      `;
      
      searchInput.insertAdjacentHTML('afterend', loadingHtml);
    } else {
      loadingElement.style.display = 'block';
    }
  }
  
  // Fonction pour masquer le spinner de chargement
  function hideLoading() {
    const loadingElement = searchbar.querySelector('.searchbar-loading');
    
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
  }
  
  // Fonction pour masquer les résultats
  function hideResults() {
    if (resultsContainer) {
      resultsContainer.style.display = 'none';
    }
  }
  
  // Écouteurs d'événements
  if (searchInput) {
    // Événement input pour lancer la recherche
    searchInput.addEventListener('input', function() {
      const query = this.value.trim();
      
      // Afficher/masquer le bouton de suppression
      if (clearButton) {
        clearButton.style.display = query ? 'block' : 'none';
      }
      
      // Annuler le délai précédent
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      
      // Définir un nouveau délai pour la recherche
      searchTimeout = setTimeout(() => {
        performSearch(query);
      }, SEARCH_DELAY);
    });
    
    // Événement focus pour réafficher les résultats si nécessaire
    searchInput.addEventListener('focus', function() {
      const query = this.value.trim();
      
      if (query && query.length >= 2) {
        performSearch(query);
      }
    });
  }
  
  // Événement pour le bouton de suppression
  if (clearButton) {
    clearButton.addEventListener('click', function() {
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
        hideResults();
        this.style.display = 'none';
      }
    });
  }
  
  // Masquer les résultats lorsque l'utilisateur clique en dehors
  document.addEventListener('click', function(event) {
    if (!searchbar.contains(event.target) && resultsContainer) {
      hideResults();
    }
  });
  
  // Fonction pour obtenir des résultats de test
  function getMockResults(query) {
    // Simuler des résultats de recherche basés sur la requête
    // Dans une implémentation réelle, cela serait remplacé par les données de l'API
    const mockData = [
      { id: 'tcl', type: 'network', title: 'TCL Lyon', subtitle: 'Transports en Commun Lyonnais', category: 'Réseaux', icon: 'directions_bus', iconClass: 'icon-primary' },
      { id: 'sncf', type: 'network', title: 'SNCF', subtitle: 'Société Nationale des Chemins de fer Français', category: 'Réseaux', icon: 'train', iconClass: 'icon-train' },
      { id: 'c3', type: 'line', title: 'C3', subtitle: 'Laurent Bonnevay - Gare Saint-Paul', category: 'Lignes', icon: 'directions_bus', iconClass: 'icon-bus' },
      { id: 't1', type: 'line', title: 'T1', subtitle: 'IUT Feyssine - Debourg', category: 'Lignes', icon: 'tram', iconClass: 'icon-tram' },
      { id: 'bellecour', type: 'stop', title: 'Bellecour', subtitle: 'Lyon 2ème', category: 'Arrêts', icon: 'place', iconClass: 'icon-success' },
      { id: 'part-dieu', type: 'stop', title: 'Part-Dieu', subtitle: 'Lyon 3ème', category: 'Arrêts', icon: 'place', iconClass: 'icon-success' }
    ];
    
    // Filtrer les résultats en fonction de la requête
    return mockData.filter(item => {
      const searchTerms = query.toLowerCase();
      const titleMatch = item.title.toLowerCase().includes(searchTerms);
      const subtitleMatch = item.subtitle && item.subtitle.toLowerCase().includes(searchTerms);
      
      return titleMatch || subtitleMatch;
    });
  }
});