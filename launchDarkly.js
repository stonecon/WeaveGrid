const LD_CONFIG = {
  clientId: '6026d6b36f9bd00b01ba8705', // LaunchDarkly client-side ID
  debugEnabled: true,
  flags: {
    'chargeperk-hero-headline': true,
    'chargeperk-hero-media': true,
    'chargeperk-cta-text': 'A',
    'chargeperk-banner-message': 'A',
    'program-destination': 'A',
    'section-layout': true
  }
};

// Track Manager - Controls tracking events sent to LaunchDarkly
class TrackManager {
  static track(eventName, data = {}) {
    if (!window.ldclient) return;

    const baseData = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      pathname: window.location.pathname,
      ...data
    };

    window.ldclient.track(eventName, baseData, error => {
      if (error) {
        console.error(`❌ Error tracking ${eventName}:`, error);
      } else if (LD_CONFIG.debugEnabled) {
        console.log(`✅ Tracked ${eventName}:`, baseData);
      }
    });
  }

  static trackView(testName, variation, details = {}) {
    this.track('view-event', {
      test: testName,
      variation,
      ...details
    });
  }

  static trackConversion(testName, variation, details = {}) {
    this.track('conversion-event', {
      test: testName,
      variation,
      ...details
    });
  }

  static trackCTAClick() {
    this.track('conversion-event', {
      metricKey: 'cta-click',
      description: 'Tracks when users click/converts on any CTA button on the ChargePerks or Driver pages'
    });
  }
}

// Test Manager - Controls the various tests and what they do
class TestManager {
  static elementCache = new Map();

  static getElement(id) {
    if (!this.elementCache.has(id)) {
      const element = document.getElementById(id);
      if (element) {
        console.log(`🔍 Found element with ID: ${id}`);
        this.elementCache.set(id, element);
      } else {
        console.warn(`⚠️ Element not found: ${id}`);
      }
    }
    return this.elementCache.get(id);
  }

  static updateElement(id, updates) {
    const element = this.getElement(id);
    if (!element) {
      console.warn(`⚠️ Element not found: ${id}`);
      return null;
    }

    const originalState = {
      text: element.textContent,
      display: element.style.display,
      attributes: {}
    };

    try {
      Object.entries(updates).forEach(([key, value]) => {
        switch (key) {
        case 'text':
          element.textContent = value;
          break;
        case 'style':
          Object.assign(element.style, value);
          break;
        case 'attributes':
          Object.entries(value).forEach(([attr, val]) => {
            originalState.attributes[attr] = element.getAttribute(attr);
            element.setAttribute(attr, val);
          });
          break;
        }
      });

      return { element, originalState };
    } catch (error) {
      console.error(`❌ Error updating element ${id}:`, error);
      return null;
    }
  }

  static implementTests() {

    const flags = window.ldclient.allFlags();
    console.log('🚩 Implementing Tests with Flags:', flags);

    // TESTS START HERE

    // 1. Hero Headline Test
    if (flags['chargeperk-hero-headline'] === false) {
      // Checks if the chargeperk-hero-headline flag is set to variation (false)
      // if so, updates the text
      console.log('🔍 Hero Headline Flag Enabled, Applying Test');
      const result = this.updateElement('chargeperk-hero-headline', {
        text: 'Get $50 when you join ChargePerks'
      });
      if (result) {
        TrackManager.trackView('chargeperk-hero-headline', false, {
          originalText: result.originalState.text,
          newText: 'Get $50 when you join ChargePerks'
        });
      }
    } else {
      console.log('🔕 Hero Headline Flag Not Enabled');
    }

    // 2. Hero Media Test
    if (flags['chargeperk-hero-media'] === false) {
      // if the chargeperk-hero-media flag is set to variation (false) 
      // if so, hides the image and shows embedded video
      const imageElement = document.querySelector('#chargeperk-hero-image');
      if (imageElement) {
        imageElement.classList.add('hide');
      }

      // Show the video
      const videoElement = document.querySelector('#chargeperk-hero-video');
      if (videoElement) {
        videoElement.classList.remove('hide');
      }

      // Track the view
      TrackManager.trackView('chargeperk-hero-media', false, {
        showing: 'video'
      });
    }

    // 3. CTA Button Test
    const ctaVariation = flags['chargeperk-cta-text'];
    // Checks which variation (A is control) chargeperk-cta-text is set to
    // Based upon flag updates the button text accordingly
    if (ctaVariation !== 'A') {
      const ctaTexts = {
        'B': 'RESERVE SPOT',
        'C': 'GET STARTED',
        'D': 'START EARNING'
      };

      // Update specific button with ID 'chargeperk-cta-button' if it exists
      const result = this.updateElement('chargeperk-cta-button', {
        text: ctaTexts[ctaVariation]
      });
      if (result) {
        TrackManager.trackView('chargeperk-cta-text', ctaVariation, {
          originalText: result.originalState.text,
          newText: ctaTexts[ctaVariation]
        });
      }

      // Updates all buttons with the class 'button' except the "Sign in" button
      document.querySelectorAll('.button').forEach(button => {
        if (!button.classList.contains('cpc') && button.textContent !== 'Sign in') {
          const originalText = button.textContent;
          button.textContent = ctaTexts[ctaVariation];
          TrackManager.trackView('chargeperk-cta-text', ctaVariation, {
            originalText,
            newText: ctaTexts[ctaVariation]
          });
        }
      });
    }

    // 4. Banner Message Test
    const bannerVariation = flags['chargeperk-banner-message'];
    // Checks which variation (A is control) chargeperk-banner-message is set to 
    // Based upon flag updates the banner text accordingly
    if (bannerVariation !== 'A') {
      const bannerTexts = {
        'B': "Harness the power of your EV to support California's electric grid during periods of high demand",
        'C': "ChargePerks California is available to drivers in select PG&E, SCE, LADWP, SDG&E and SMUD zip codes. Reserve your spot today!"
      };

      const result = this.updateElement('chargeperk-banner-message', {
        text: bannerTexts[bannerVariation]
      });

      if (result) {
        TrackManager.trackView('chargeperk-banner-message', bannerVariation, {
          originalText: result.originalState.text,
          newText: bannerTexts[bannerVariation],
          variation: bannerVariation
        });
      }
    }

    // 5. Program Links Destination Test
    if (flags['program-destination'] === false) {
      // Checks if the program-destination flag is set to variation (false)
      // if so, updates all links to the programs’ signup flow page
      const programLinks = {
        'Alabama Power': 'https://charge.weavegrid.com/alabamapower/',
        'Atlantic City Electric': 'https://charge.weavegrid.com/ace/',
        'BGE': 'https://charge.weavegrid.com/bge/',
        'ChargePerks CA': 'https://charge.weavegrid.com/wg/',
        'Dominion Energy': 'https://charge.weavegrid.com/dominionenergy/',
        'DTE': 'https://charge.weavegrid.com/dte/',
        'Georgia Power': 'https://charge.weavegrid.com/georgiapower/',
        'Luma': 'https://charge.weavegrid.com/luma/',
        'PG&E': 'https://charge.weavegrid.com/pge/',
        'Portland General Electric (Smart Charging)': 'https://charge.weavegrid.com/portlandgeneral/',
        'Portland General Electric (Test Bed)': 'https://charge.weavegrid.com/portlandgeneral/',
        'SRP': 'https://charge.weavegrid.com/srp/preregister/',
        'UPC': 'https://charge.weavegrid.com/upc/',
        'Wake Electric': 'https://charge.weavegrid.com/wemc/',
        'Xcel Energy (Charging Perks)': 'https://charge.weavegrid.com/xcelenergy/',
        'Xcel Energy (Optimize Your Charge)': 'https://charge.weavegrid.com/xcelenergy/'
      };

      let updatedLinks = 0;
      Object.entries(programLinks).forEach(([programId, newUrl]) => {
        const result = this.updateElement(programId, {
          attributes: {
            'href': newUrl,
            'data-original-url': this.getElement(programId)?.href || ''
          }
        });

        if (result) {
          updatedLinks++;
          TrackManager.trackView('program-destination', false, {
            program: programId,
            originalUrl: result.originalState.attributes['href'],
            newUrl: newUrl
          });
        }
      });

      if (LD_CONFIG.debugEnabled) {
        console.log(`Updated ${updatedLinks} program links to direct signup URLs`);
      }
    }

    // 6. Section Layout Test
    if (flags['section-layout'] === false) {
      // Checks if the section-layout flag is set to variation (false)
      // if so, swaps order of both sections through hiding and unhiding
      ['1', '2'].forEach(num => { // Hide original sections
        const element = document.querySelector(`#section-layout-${num}`);
        if (element) {
          element.classList.add('hide');
          TrackManager.trackView('section-layout', 'B', {
            section: `section-layout-${num}`,
            action: 'hidden'
          });
        }
      });
      ['1', '2'].forEach(num => { // Show reordered sections
        const element = document.querySelector(`#section-reordered-${num}`);
        if (element) {
          element.classList.remove('hide');
          TrackManager.trackView('section-layout', 'B', {
            section: `section-reordered-${num}`,
            action: 'shown'
          });
        }
      });
    }

    // Additional debug logging if enabled
    if (LD_CONFIG.debugEnabled) {
      console.group('🛠 Test Implementation Summary');
      console.log('Active Flags:', flags);
      console.log('Cached Elements:', Array.from(this.elementCache.keys()));
      console.log('Page URL:', window.location.href);
      console.groupEnd();
    }
  }
}

// Event Tracker
class EventTracker {
  static init() {
    document.addEventListener('click', (event) => {
      const target = event.target;
      const flags = window.ldclient?.allFlags() || {};

      // Track ALL CTA button clicks, excluding "Sign in" button
      if (target.classList.contains('button') && !target.classList.contains('cpc') && target
        .textContent !== 'Sign in') {
        console.log('📊 Tracking CTA button click:', target.id, target.textContent);
        TrackManager.trackCTAClick(target.textContent, target.id);
        Object.entries(flags).forEach(([test, variation]) => {
          TrackManager.trackConversion(test, variation, {
            element: 'cta-button',
            buttonText: target.textContent,
            buttonId: target.id,
            path: window.location.pathname
          });
        });
      }

      // Track program link clicks
      if (target.tagName === 'A' && target.href?.includes('charge.weavegrid.com')) {
        console.log('📊 Tracking program link click:', target.id);
        TrackManager.trackConversion('program-destination', flags['program-destination'], {
          program: target.id,
          originalUrl: target.getAttribute('data-original-url') || '',
          newUrl: target.href,
          path: window.location.pathname
        });
      }
    });
  }
}

function loadLaunchDarklyScript() {
  return new Promise((resolve, reject) => {
    if (window.LDClient) {
      console.log('✅ LaunchDarkly SDK already loaded');
      return resolve();
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/launchdarkly-js-client-sdk@3.1.3/dist/ldclient.min.js';
    script.async = true;

    script.onload = () => {
      console.log('✅ LaunchDarkly SDK loaded successfully');
      resolve();
    };

    script.onerror = (error) => {
      console.error('❌ Failed to load LaunchDarkly SDK:', error);
      reject(error);
    };

    document.head.appendChild(script);
  });
}

// Main initialization function for Slater
window.initLDTests = async function () {
  console.group('🚀 Initializing LaunchDarkly Tests');

  try {
    // First, load the LaunchDarkly script
    await loadLaunchDarklyScript();
    console.log('📝 LaunchDarkly script loaded');

    // Check if LDClient is available
    if (!window.LDClient) {
      throw new Error('LaunchDarkly client not available after script load');
    }

    // Initialize the client if not already done
    if (!window.ldclient) {
      console.log('🔄 Initializing LaunchDarkly client...');
      window.ldclient = window.LDClient.initialize(LD_CONFIG.clientId, {
        anonymous: true,
        key: Math.random().toString(36).substring(2),
        debugEnabled: true
      });

      // Add initialization event listeners
      window.ldclient.on('ready', () => {
        console.log('✨ LaunchDarkly client ready');
        console.log('🚩 Initial flags:', window.ldclient.allFlags());

        // Initialize tests and tracking after client is ready
        TestManager.implementTests();
        EventTracker.init();
      });

      window.ldclient.on('change', (changes) => {
        console.log('🔄 Flag changes detected:', changes);
        // Re-run tests when flags change
        TestManager.implementTests();
      });

      window.ldclient.on('error', (error) => {
        console.error('❌ LaunchDarkly error:', error);
      });
    }

    // Wait for client to be ready
    console.log('⏳ Waiting for LaunchDarkly client to be ready...');
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('LaunchDarkly initialization timeout'));
      }, 5000);

      if (window.ldclient && window.ldclient.initialized) {
        clearTimeout(timeout);
        resolve();
      } else {
        window.ldclient.on('ready', () => {
          clearTimeout(timeout);
          resolve();
        });
      }
    });

    if (LD_CONFIG.debugEnabled) {
      console.log('✅ LaunchDarkly implementation complete');
      console.log('🚩 Active flags:', window.ldclient.allFlags());
    }

  } catch (error) {
    console.error('❌ LaunchDarkly initialization failed:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      ldClientExists: !!window.LDClient,
      ldInstanceExists: !!window.ldclient,
      initialized: window.ldclient?.initialized
    });
  }

  console.groupEnd();
};

// Debug utilities
window.LDDebug = {
  ...window.LDDebug,

  checkStatus() {
    console.group('🔍 LaunchDarkly Status Check');
    console.log('Script loaded:', !!window.LDClient);
    console.log('Client initialized:', !!window.ldclient);
    console.log('Client ready:', window.ldclient?.initialized);
    console.log('Flags:', window.ldclient?.allFlags());
    console.log('Element cache:', Array.from(TestManager.elementCache.entries()));
    console.groupEnd();
  },

  forceInit() {
    console.log('🔄 Forcing reinitialization...');
    window.initLDTests();
  },

  testFlags() {
    console.group('🚩 Testing Flag Access');
    try {
      const flags = window.ldclient?.allFlags();
      console.log('All flags:', flags);
      Object.entries(flags || {}).forEach(([key, value]) => {
        console.log(`Flag: ${key}`, value);
      });
    } catch (error) {
      console.error('Error accessing flags:', error);
    }
    console.groupEnd();
  }
};

const validPaths = ['/chargeperks', '/drivers'];
const currentPath = window.location.pathname;

// Checks to make sure the tests only run on pages we want it to
// Currently /chargeperks and /drivers landing page
if (validPaths.includes(currentPath)) {
  window.initLDTests();
}