/**
 * Consent Manager for Google Analytics
 * Handles user consent preferences for analytics and advertising
 */

// Consent states
const CONSENT_GRANTED = 'granted';
const CONSENT_DENIED = 'denied';

// Consent types
const CONSENT_ANALYTICS = 'analytics_storage';
const CONSENT_AD_STORAGE = 'ad_storage';
const CONSENT_AD_USER_DATA = 'ad_user_data';
const CONSENT_AD_PERSONALIZATION = 'ad_personalization';

// Local storage key
const CONSENT_STORAGE_KEY = 'wallpaper_consent_preferences';

// Default consent settings (denied by default for GDPR compliance)
const defaultConsent = {
    [CONSENT_ANALYTICS]: CONSENT_DENIED,
    [CONSENT_AD_STORAGE]: CONSENT_DENIED,
    [CONSENT_AD_USER_DATA]: CONSENT_DENIED,
    [CONSENT_AD_PERSONALIZATION]: CONSENT_DENIED
};

/**
 * Initialize consent mode with default settings
 */
function initializeConsentMode() {
    // Get stored consent or use defaults
    const storedConsent = getStoredConsent();
    
    // Initialize Google's consent mode
    window.gtag('consent', 'default', {
        'analytics_storage': storedConsent[CONSENT_ANALYTICS],
        'ad_storage': storedConsent[CONSENT_AD_STORAGE],
        'ad_user_data': storedConsent[CONSENT_AD_USER_DATA],
        'ad_personalization': storedConsent[CONSENT_AD_PERSONALIZATION],
        'wait_for_update': 500 // Wait for 500ms before firing tags
    });
    
    // Show banner if consent hasn't been given yet
    if (!hasConsentBeenGiven()) {
        showConsentBanner();
    }
}

/**
 * Check if consent has been explicitly given or denied
 */
function hasConsentBeenGiven() {
    return localStorage.getItem(CONSENT_STORAGE_KEY) !== null;
}

/**
 * Get stored consent preferences or default values
 */
function getStoredConsent() {
    const storedConsent = localStorage.getItem(CONSENT_STORAGE_KEY);
    return storedConsent ? JSON.parse(storedConsent) : defaultConsent;
}

/**
 * Save consent preferences to localStorage
 */
function saveConsent(consentPreferences) {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consentPreferences));
}

/**
 * Update consent settings based on user choices
 */
function updateConsent(analytics, adStorage, adUserData, adPersonalization) {
    const consentPreferences = {
        [CONSENT_ANALYTICS]: analytics ? CONSENT_GRANTED : CONSENT_DENIED,
        [CONSENT_AD_STORAGE]: adStorage ? CONSENT_GRANTED : CONSENT_DENIED,
        [CONSENT_AD_USER_DATA]: adUserData ? CONSENT_GRANTED : CONSENT_DENIED,
        [CONSENT_AD_PERSONALIZATION]: adPersonalization ? CONSENT_GRANTED : CONSENT_DENIED
    };
    
    // Update Google's consent mode
    window.gtag('consent', 'update', consentPreferences);
    
    // Save preferences
    saveConsent(consentPreferences);
    
    // Hide the banner
    hideConsentBanner();
}

/**
 * Accept all consent options
 */
function acceptAllConsent() {
    updateConsent(true, true, true, true);
}

/**
 * Deny all consent options
 */
function denyAllConsent() {
    updateConsent(false, false, false, false);
}

/**
 * Accept only necessary consent (analytics only)
 */
function acceptNecessaryConsent() {
    updateConsent(true, false, false, false);
}

/**
 * Show the consent banner
 */
function showConsentBanner() {
    const banner = document.getElementById('consent-banner');
    if (banner) {
        banner.classList.add('visible');
    }
}

/**
 * Hide the consent banner
 */
function hideConsentBanner() {
    const banner = document.getElementById('consent-banner');
    if (banner) {
        banner.classList.remove('visible');
    }
}

/**
 * Show the consent settings modal
 */
function showConsentSettings() {
    const modal = document.getElementById('consent-settings-modal');
    if (modal) {
        // Load current settings
        const storedConsent = getStoredConsent();
        
        // Update checkboxes
        document.getElementById('consent-analytics').checked = 
            storedConsent[CONSENT_ANALYTICS] === CONSENT_GRANTED;
        document.getElementById('consent-ad-storage').checked = 
            storedConsent[CONSENT_AD_STORAGE] === CONSENT_GRANTED;
        document.getElementById('consent-ad-user-data').checked = 
            storedConsent[CONSENT_AD_USER_DATA] === CONSENT_GRANTED;
        document.getElementById('consent-ad-personalization').checked = 
            storedConsent[CONSENT_AD_PERSONALIZATION] === CONSENT_GRANTED;
        
        // Show modal
        modal.classList.add('visible');
    }
}

/**
 * Hide the consent settings modal
 */
function hideConsentSettings() {
    const modal = document.getElementById('consent-settings-modal');
    if (modal) {
        modal.classList.remove('visible');
    }
}

/**
 * Save settings from the consent modal
 */
function saveConsentSettings() {
    const analytics = document.getElementById('consent-analytics').checked;
    const adStorage = document.getElementById('consent-ad-storage').checked;
    const adUserData = document.getElementById('consent-ad-user-data').checked;
    const adPersonalization = document.getElementById('consent-ad-personalization').checked;
    
    updateConsent(analytics, adStorage, adUserData, adPersonalization);
    hideConsentSettings();
}

// Export functions for global use
window.ConsentManager = {
    initializeConsentMode,
    acceptAllConsent,
    denyAllConsent,
    acceptNecessaryConsent,
    showConsentSettings,
    hideConsentSettings,
    saveConsentSettings
};
