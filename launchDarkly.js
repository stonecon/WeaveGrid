< script src = "<https://unpkg.com/launchdarkly-js-client-sdk@3.1.3/dist/ldclient.min.js>" > </script>

// Initialize LaunchDarkly
// const client = LDClient.initialize('60271ef7e478340b6c32cd80', {
const ldclient = LDClient.initialize('60271ef7e478340b6c32cd80', {
  anonymous: true,
  key: Math.random().toString(36).substring(2)
});

// Wait for client to be ready and DOM to be loaded
ldclient.on('ready', () => {
  // Ensure DOM is fully loaded
  if (document.readyState === 'complete') {
    initializeTests();
  } else {
    window.addEventListener('load', initializeTests);
  }
});

function initializeTests() {
  // 1. Hero Headline Test
  ldclient.variation('chargeperk-hero-headline', false, (err, showNewHeadline) => {
    if (err) return;
    const headline = document.querySelector('.chargeperks-hero-headline');
    if (headline && showNewHeadline) {
      // Store original text for tracking
      const originalText = headline.textContent;
      headline.textContent = 'Get $50 when you join ChargePerks';

      // Track view
      ldclient.track('hero-headline-view', {
        variation: showNewHeadline ? 'B' : 'A',
        originalText: originalText
      });
    }
  });

  // 2. Hero Media Test
  ldclient.variation('chargeperk-hero-media', false, (err, showVideo) => {
    if (err) return;
    const mediaContainer = document.querySelector('.chargeperks-hero-media');
    if (mediaContainer && showVideo) {
      // Store original content
      const originalContent = mediaContainer.innerHTML;

      // Create and add video element
      const video = document.createElement('video');
      video.autoplay = true;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.className = 'w-100 h-100 object-cover';
      video.innerHTML = '<source src="YOUR_VIDEO_URL" type="video/mp4">';

      mediaContainer.innerHTML = '';
      mediaContainer.appendChild(video);

      // Track view
      ldclient.track('hero-media-view', {
        variation: showVideo ? 'B' : 'A'
      });
    }
  });

  // 3. CTA Button Test
  ldclient.variation('chargeperk-cta-text', 'A', (err, buttonVariation) => {
    if (err) return;
    const buttons = document.querySelectorAll('.chargeperks-cta-button');
    const buttonTexts = {
      'A': 'Original Text', // Replace with actual original
      'B': 'RESERVE SPOT',
      'C': 'GET STARTED',
      'D': 'START EARNING'
    };

    buttons.forEach(button => {
      const originalText = button.textContent;
      button.textContent = buttonTexts[buttonVariation];

      // Add click tracking
      button.addEventListener('click', () => {
        ldclient.track('cta-button-click', {
          variation: buttonVariation,
          originalText: originalText,
          newText: buttonTexts[buttonVariation]
        });
      });
    });
  });

  // 4. Banner Message Test
  ldclient.variation('chargeperk-banner-message', 'A', (err, messageVariation) => {
    if (err) return;
    const banner = document.querySelector('.chargeperks-banner-text');
    const messages = {
      'A': 'Original Banner Text', // Replace with actual original
      'B': 'Harness the power of your EV to support California`s electric grid during periods of high demand',
      'C': 'ChargePerks California is available to drivers in select PG&E, SCE, LADWP, SDG&E and SMUD zip codes. Reserve your spot today!'
    };

    if (banner) {
      const originalText = banner.textContent;
      banner.textContent = messages[messageVariation];

      // Track view
      ldclient.track('banner-message-view', {
        variation: messageVariation,
        originalText: originalText
      });
    }
  });

  // 5. Split Traffic Test (Page Version)
  ldclient.variation('chargeperk-page-version', false, (err, showAlternate) => {
    if (err) return;
    if (showAlternate && window.location.pathname === '/chargeperks') {
      // Track before redirect
      ldclient.track('page-version-redirect', {
        variation: 'B',
        fromPath: window.location.pathname
      });
      window.location.href = '/chargeperks-b';
    } else {
      ldclient.track('page-version-view', {
        variation: 'A',
        path: window.location.pathname
      });
    }
  });

  // 6. URL Destination Test
  ldclient.variation('program-destination', 'A', (err, destinationVariation) => {
    if (err) return;
    const links = document.querySelectorAll('.program-link');
    const destinations = {
      'A': '/program-landing',
      'B': '/program-signup'
    };

    links.forEach(link => {
      const originalHref = link.href;
      link.href = destinations[destinationVariation];

      // Add click tracking
      link.addEventListener('click', () => {
        ldclient.track('program-link-click', {
          variation: destinationVariation,
          originalUrl: originalHref,
          newUrl: destinations[destinationVariation]
        });
      });
    });
  });

  // 7. Section Layout Test
  ldclient.variation('section-layout', 'A', (err, layoutVariation) => {
    if (err) return;
    const container = document.querySelector('.chargeperks-sections-container');
    if (!container) return;

    if (layoutVariation === 'B') {
      // Get all sections
      const sections = Array.from(container.children);

      // Store original order
      const originalOrder = sections.map(section => section.className);

      // Reorder sections
      sections[1].parentNode.insertBefore(sections[1], sections[0]);
      sections[3].parentNode.insertBefore(sections[3], sections[2]);

      // Track view
      ldclient.track('section-layout-view', {
        variation: 'B',
        originalOrder: originalOrder,
        newOrder: Array.from(container.children).map(section => section.className)
      });
    }
  });
}

// Error handling
ldclient.on('error', (error) => {
  console.error('LaunchDarkly error:', error);
  // Optionally send to your error tracking service
});
