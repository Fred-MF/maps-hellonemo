/**
 * main.js - Point d'entrée principal pour les fonctionnalités JavaScript MyBus
 */

// Attendre que le DOM soit complètement chargé
document.addEventListener('DOMContentLoaded', function() {
  // Initialiser les composants
  initMobileMenu();
  initSmoothScroll();
  initAppDownloadTracking();
  
  // Détecter les paramètres d'URL pour le suivi des conversions
  checkUrlParams();
});

/**
 * Initialisation du menu mobile
 */
function initMobileMenu() {
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  
  if (!mobileMenuToggle || !mobileMenu) return;
  
  mobileMenuToggle.addEventListener('click', function() {
    mobileMenu.classList.toggle('mobile-menu-open');
    this.setAttribute('aria-expanded', 
      this.getAttribute('aria-expanded') === 'true' ? 'false' : 'true'
    );
  });
  
  // Fermer le menu en cliquant ailleurs
  document.addEventListener('click', function(event) {
    if (mobileMenu.classList.contains('mobile-menu-open') && 
        !mobileMenu.contains(event.target) && 
        !mobileMenuToggle.contains(event.target)) {
      mobileMenu.classList.remove('mobile-menu-open');
      mobileMenuToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

/**
 * Défilement fluide pour les ancres
 */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (!targetElement) return;
      
      window.scrollTo({
        top: targetElement.offsetTop - 80, // Ajuster pour le header fixe
        behavior: 'smooth'
      });
    });
  });
}

/**
 * Suivi des téléchargements d'application
 */
function initAppDownloadTracking() {
  const downloadButtons = document.querySelectorAll('.btn-download, .app-store-button');
  
  downloadButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      // Suivre l'événement de téléchargement
      trackEvent('app_download', {
        source: 'website',
        button_location: getButtonLocation(this),
        platform: getPlatform(this)
      });
      
      // Créer un deep link avec des paramètres de suivi
      const originalHref = this.getAttribute('href');
      const trackingParams = createTrackingParams();
      
      // Si c'est un lien vers un store, ouvrir dans un nouvel onglet
      if (originalHref && (originalHref.includes('app.apple.com') || originalHref.includes('play.google.com'))) {
        e.preventDefault();
        window.open(`${originalHref}${trackingParams}`, '_blank');
      }
    });
  });
}

/**
 * Obtenir l'emplacement du bouton sur la page
 */
function getButtonLocation(button) {
  // Essayer de déterminer la section de la page
  const sections = ['hero', 'app-download', 'features', 'networks'];
  
  for (const section of sections) {
    if (button.closest(`.${section}`)) {
      return section;
    }
  }
  
  return 'unknown';
}

/**
 * Obtenir la plateforme (iOS/Android) depuis le bouton
 */
function getPlatform(button) {
  const buttonText = button.textContent.toLowerCase();
  const buttonClass = button.className;
  const buttonHref = button.getAttribute('href') || '';
  
  if (buttonText.includes('app store') || buttonHref.includes('apple') || buttonClass.includes('ios')) {
    return 'ios';
  } else if (buttonText.includes('google play') || buttonHref.includes('play.google') || buttonClass.includes('android')) {
    return 'android';
  }
  
  return 'unknown';
}

/**
 * Créer des paramètres de suivi pour les deep links
 */
function createTrackingParams() {
  // Récupérer les informations de référence et d'UTM
  const referrer = document.referrer;
  const utmSource = getUrlParam('utm_source');
  const utmMedium = getUrlParam('utm_medium');
  const utmCampaign = getUrlParam('utm_campaign');
  
  // Créer un identifiant unique pour la session
  const sessionId = getSessionId();
  
  // Construire les paramètres
  return `?source=website&session=${sessionId}${utmSource ? `&utm_source=${utmSource}` : ''}${utmMedium ? `&utm_medium=${utmMedium}` : ''}${utmCampaign ? `&utm_campaign=${utmCampaign}` : ''}`;
}

/**
 * Obtenir ou créer un ID de session
 */
function getSessionId() {
  let sessionId = localStorage.getItem('mybus_session_id');
  
  if (!sessionId) {
    sessionId = Date.now().toString(36) + Math.random().toString(36).substring(2);
    localStorage.setItem('mybus_session_id', sessionId);
  }
  
  return sessionId;
}

/**
 * Suivre un événement (stub pour l'intégration analytics)
 */
function trackEvent(eventName, eventParams) {
  // Stub pour l'intégration avec Google Analytics, Firebase, etc.
  console.log(`Event tracked: ${eventName}`, eventParams);
  
  // Exemple d'intégration Google Analytics
  if (typeof gtag === 'function') {
    gtag('event', eventName, eventParams);
  }
  
  // Exemple d'intégration Firebase
  if (typeof firebase !== 'undefined' && firebase.analytics) {
    firebase.analytics().logEvent(eventName, eventParams);
  }
}

/**
 * Vérifier les paramètres d'URL pour le suivi des conversions
 */
function checkUrlParams() {
  // Vérifier si on a un paramètre de deep link
  const deepLink = getUrlParam('deep_link');
  
  if (deepLink) {
    // Suivre l'événement
    trackEvent('deep_link_opened', {
      link: deepLink
    });
    
    // Rediriger si nécessaire
    if (deepLink.startsWith('/')) {
      setTimeout(() => {
        window.location.href = deepLink;
      }, 300);
    }
  }
}

/**
 * Obtenir un paramètre d'URL
 */
function getUrlParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}