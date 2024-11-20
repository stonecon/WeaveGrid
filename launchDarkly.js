window.LDDebug = {
  verifyUpdates: function () {
    console.group('🔍 Verification Check');

    const elements = {
      headline: document.getElementById('chargeperk-hero-headline'),
      image: document.getElementById('chargeperk-hero-image'),
      video: document.getElementById('chargeperk-hero-video'),
      cta: document.getElementById('chargeperk-cta-button'),
      banner: document.getElementById('chargeperk-banner-message'),
      sections: {
        original: document.querySelectorAll('[id^="section-layout-"]'),
        reordered: document.querySelectorAll('[id^="section-reordered-"]')
      }
    };

    console.table({
      'Headline': {
        exists: !!elements.headline,
        text: elements.headline?.textContent
      },
      'Media': {
        imageVisible: elements.image?.style.display !== 'none',
        videoVisible: elements.video?.style.display !== 'none'
      },
      'CTA': {
        exists: !!elements.cta,
        text: elements.cta?.textContent,
        correctText: elements.cta?.textContent === 'RESERVE SPOT'
      },
      'Banner': {
        exists: !!elements.banner,
        text: elements.banner?.textContent,
        correctText: elements.banner?.textContent ===
          "Harness the power of your EV to support California's electric grid during periods of high demand"
      },
      'Sections': {
        originalCount: elements.sections.original.length,
        reorderedCount: elements.sections.reordered.length
      }
    });

    // Check all current flags
    const flags = window.ldclient.allFlags();
    console.log('Active Flags:', flags);

    console.groupEnd();
    return elements;
  },

  resetAll: function () {
    const headline = document.getElementById('chargeperk-hero-headline');
    if (headline) headline.textContent = 'Earn EV incentives from ChargePerks';

    const image = document.getElementById('chargeperk-hero-image');
    if (image) image.style.display = 'block';

    const video = document.getElementById('chargeperk-hero-video');
    if (video) video.style.display = 'none';

    const cta = document.getElementById('chargeperk-cta-button');
    if (cta) cta.textContent = 'ENROLL NOW';

    const banner = document.getElementById('chargeperk-banner-message');
    if (banner) {
      banner.textContent =
        "Plug in everyday at home and receive hassle-free Automatic Smart Charging. WeaveGrid will automatically handle your charging using your TOU rate to determine lowest cost times and prioritizing renewable energy when available. You can always override smart charge schedules.";
    }

    document.querySelectorAll('[id^="section-layout-"]').forEach(s => s.style.display =
      'block');
    document.querySelectorAll('[id^="section-reordered-"]').forEach(s => s.style.display =
      'none');

    console.log('🔄 Reset all elements to original values');
  },

  runTestCycle: function () {
    this.resetAll();
    console.log('Original state:');
    this.verifyUpdates();

    console.log('Running tests...');
    initializeTests();

    setTimeout(() => {
      console.log('Final state:');
      this.verifyUpdates();
    }, 100);
  },

  // Additional debug methods
  checkFlags: function () {
    console.log('Current flags:', window.ldclient.allFlags());
  },

  forceVariation: function (flag, value) {
    console.log(`Forcing variation for ${flag}:`, value);
    window.ldclient.variation(flag, value, (err, result) => {
      console.log('Variation result:', { flag, value: result, error: err });
    });
  }
};

// DOM Observer
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList' || mutation.type === 'characterData') {
      console.log('🔄 DOM changed:', {
        element: mutation.target.id,
        type: mutation.type,
        timestamp: new Date().toISOString()
      });
    }
  });
});

function loadLaunchDarkly() {
  console.log('🔄 Attempting to load LaunchDarkly script...');
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/launchdarkly-js-client-sdk@3.1.3/dist/ldclient.min.js';
    script.onload = () => {
      console.log('✅ LaunchDarkly script loaded successfully');
      resolve();
    };
    script.onerror = (error) => {
      console.error('❌ Failed to load LaunchDarkly script:', error);
      reject(error);
    };
    document.head.appendChild(script);
  });
}

// Helper function for element checking
function logElementDetails(elementId) {
  const element = document.getElementById(elementId);
  console.log(`🔍 Detailed element check for ${elementId}:`, {
    exists: !!element,
    tagName: element?.tagName,
    currentText: element?.textContent?.substring(0, 50) + '...',
    display: element?.style?.display,
    isVisible: element ? window.getComputedStyle(element).display !== 'none' : false
  });
  return element;
}

// Initial state checker
function checkInitialState() {
  console.group('🔍 Initial State Check');

  // Check crucial elements
  const elements = [
    'chargeperk-hero-headline',
    'chargeperk-hero-image',
    'chargeperk-hero-video',
    'chargeperk-banner-message',
    'section-layout-1',
    'section-layout-2',
    'section-reordered-1',
    'section-reordered-2'
  ];

  elements.forEach(logElementDetails);

  // Check CTA buttons
  const ctaButtons = document.querySelectorAll('[id^="chargeperk-cta-button"]');
  console.log('🔘 CTA Buttons found:', {
    count: ctaButtons.length,
    buttons: Array.from(ctaButtons).map(btn => ({
      id: btn.id,
      text: btn.textContent,
      isVisible: window.getComputedStyle(btn).display !== 'none'
    }))
  });

  // Log current flag values
  console.log('🚩 Current flag values:', window.ldclient.allFlags());

  console.groupEnd();
}

async function initializeLDAndTests() {
  try {
    console.group('🚀 LaunchDarkly Initialization');
    await loadLaunchDarkly();

    // Make ldclient global by attaching to window
    window.ldclient = LDClient.initialize('60271ef7e478340b6c32cd80', {
      anonymous: true,
      key: Math.random().toString(36).substring(2),
      debugEnabled: true
    });

    console.log('👉 LaunchDarkly client initialized');

    function addDebugLogging(ldclient) {
      console.log('🔍 Adding debug logging...');

      // Log all track events
      const originalTrack = ldclient.track.bind(ldclient);
      ldclient.track = function (key, data) {
        console.log('📊 Track Event:', { key, data });
        return originalTrack(key, data);
      };

      // Log all variation calls
      const originalVariation = ldclient.variation.bind(ldclient);
      ldclient.variation = function (key, defaultValue, callback) {
        console.log('🔄 Checking variation:', { flag: key, defaultValue });
        return originalVariation(key, defaultValue, (err, value) => {
          console.log(`${err ? '❌' : '✅'} Variation result:`, {
            flag: key,
            value,
            error: err
          });
          if (callback) callback(err, value);
        });
      };
    }

    window.ldclient.on('ready', () => {
      console.log('✨ Client ready, checking status...');
      console.log('Flags:', window.ldclient.allFlags());

      if (document.readyState === 'complete') {
        console.log('📄 Document ready, running tests...');
        addDebugLogging(window.ldclient);
        initializeTests();
      } else {
        console.log('⏳ Waiting for document load...');
        window.addEventListener('load', () => {
          console.log('📄 Document now ready, running tests...');
          addDebugLogging(window.ldclient);
          initializeTests();
        });
      }
    });

    window.ldclient.on('change', (flags) => {
      console.log('🚩 Flag values changed:', flags);
    });

    window.ldclient.on('error', (error) => {
      console.error('❌ LaunchDarkly error:', error);
    });

    function initializeTests() {
      console.group('🧪 Running A/B Tests');
      const currentFlags = window.ldclient.allFlags();

      console.log('🔄 Current State:', {
        flags: currentFlags,
        timestamp: new Date().toISOString()
      });

      try {
        // 1. Hero Headline Test
        console.group('1️⃣ Hero Headline Test');
        const headlineFlag = currentFlags['chargeperk-hero-headline'];
        const headline = document.getElementById('chargeperk-hero-headline');

        console.log('Headline test:', {
          flag: headlineFlag,
          element: !!headline,
          currentText: headline?.textContent
        });

        if (headlineFlag && headline) {
          const originalText = headline.textContent;
          headline.textContent = 'Get $50 when you join ChargePerks';
          console.log('Updated headline:', {
            from: originalText,
            to: headline.textContent
          });
        }
        console.groupEnd();

        // 2. Hero Media Test
        console.group('2️⃣ Hero Media Test');
        const mediaFlag = currentFlags['chargeperk-hero-media'];
        const imageWrapper = document.getElementById('chargeperk-hero-image');
        const videoWrapper = document.getElementById('chargeperk-hero-video');

        console.log('Media test:', {
          flag: mediaFlag,
          imageElement: !!imageWrapper,
          videoElement: !!videoWrapper
        });

        if (imageWrapper && videoWrapper) {
          if (mediaFlag) {
            imageWrapper.style.display = 'none';
            videoWrapper.style.display = 'block';
            console.log('Showing video variation');
          } else {
            imageWrapper.style.display = 'block';
            videoWrapper.style.display = 'none';
            console.log('Showing image variation');
          }
        }
        console.groupEnd();

        // 3. CTA Button Test
        console.group('🔘 Processing CTA Button Test');
        if (currentFlags['chargeperk-cta-text'] === 'B') {
          const buttons = document.querySelectorAll('[id^="chargeperk-cta-button"]');
          console.log('Found buttons:', buttons.length);

          buttons.forEach((button, index) => {
            const originalText = button.textContent;
            button.textContent = 'RESERVE SPOT';
            console.log(`Updated button ${index}:`, {
              from: originalText,
              to: button.textContent,
              id: button.id
            });
          });
        }
        console.groupEnd();

        // 4. Banner Message Test
        console.group('📝 Processing Banner Message Test');
        if (currentFlags['chargeperk-banner-message'] === 'B') {
          const banner = document.getElementById('chargeperk-banner-message');
          console.log('Found banner:', !!banner);

          if (banner) {
            const originalText = banner.textContent;
            const newText =
              "Harness the power of your EV to support California's electric grid during periods of high demand";
            banner.textContent = newText;
            console.log('Updated banner:', {
              from: originalText,
              to: newText,
              id: banner.id
            });
          }
        }
        console.groupEnd();

        // 6. Program Links Destination Test
        console.group('6️⃣ Program Links Test');
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

        if (currentFlags['program-destination'] === 'B') {
          let foundLinks = 0;
          let updatedLinks = 0;

          Object.keys(programLinks).forEach(programId => {
            const link = document.getElementById(programId);
            if (link) {
              foundLinks++;
              const originalHref = link.href;
              link.href = programLinks[programId];
              updatedLinks++;

              console.log(`Updated ${programId}:`, {
                from: originalHref,
                to: link.href
              });
            }
          });

          console.log('Link update summary:', {
            total: Object.keys(programLinks).length,
            found: foundLinks,
            updated: updatedLinks
          });
        }
        console.groupEnd();

        // 7. Section Layout Test
        console.group('7️⃣ Section Layout Test');
        if (currentFlags['section-layout'] === 'B') {
          const originalSections = document.querySelectorAll('[id^="section-layout-"]');
          const reorderedSections = document.querySelectorAll('[id^="section-reordered-"]');

          console.log('Sections found:', {
            original: originalSections.length,
            reordered: reorderedSections.length
          });

          originalSections.forEach(section => {
            section.style.display = 'none';
            console.log(`Hidden original section: ${section.id}`);
          });

          reorderedSections.forEach(section => {
            section.style.display = 'block';
            console.log(`Shown reordered section: ${section.id}`);
          });
        }
        console.groupEnd();

        // Log completion
        console.log('✅ Tests processed:', {
          timestamp: new Date().toISOString(),
          flags: currentFlags
        });

      } catch (error) {
        console.error('❌ Error processing tests:', error);
      }
      console.groupEnd();
    }
    // Error handling
    window.ldclient.on('error', (error) => {
      console.error('❌ LaunchDarkly error:', error);
    });

  } catch (error) {
    console.error('❌ Fatal error during LaunchDarkly initialization:', error);
  }
  console.groupEnd(); // End LaunchDarkly Initialization group
}

// Start everything
console.log('🎬 Starting LaunchDarkly implementation...');
initializeLDAndTests();

// Start observing DOM changes
observer.observe(document.body, {
  childList: true,
  subtree: true,
  characterData: true
});

// Add tracking for clicks
document.addEventListener('click', (event) => {
  const target = event.target;

  // Track CTA clicks
  if (target.id?.includes('chargeperk-cta-button')) {
    window.ldclient?.track('cta-button-click', {
      buttonId: target.id,
      text: target.textContent,
      variation: window.ldclient.allFlags()['chargeperk-cta-text']
    });
  }

  // Track program link clicks
  if (target.tagName === 'A' && target.href?.includes('charge.weavegrid.com')) {
    window.ldclient?.track('program-link-click', {
      programId: target.id,
      destination: target.href,
      variation: window.ldclient.allFlags()['program-destination']
    });
  }
});