/**
 * RugGuard - Content Script
 * Automatically extracts token addresses from pages and checks them
 */

// Global variables
let currentTokenAddress = null;
let warningModalShown = false;
let isChecking = false; // Prevent duplicate checks

// Import Google Fonts for pixel art styling
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

// Add CSS for the warning modal with pixel art theme
const style = document.createElement('style');
style.textContent = `
  .rugguard-warning-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(9, 9, 11, 0.95);
    background-image: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%232d2d2d' fill-opacity='0.4' fill-rule='evenodd'%3E%3Cpath d='M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41zM20 18.6l2.83-2.83 1.41 1.41L21.41 20l2.83 2.83-1.41 1.41L20 21.41l-2.83 2.83-1.41-1.41L18.59 20l-2.83-2.83 1.41-1.41L20 18.59z'/%3E%3C/g%3E%3C/svg%3E");
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999999;
    font-family: 'VT323', monospace;
    animation: fadeInBg 0.3s ease-in-out;
  }
  
  @keyframes fadeInBg {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideInModal {
    from { transform: scale(0.8) translateY(-30px); opacity: 0; }
    to { transform: scale(1) translateY(0); opacity: 1; }
  }

  .rugguard-warning-modal {
    width: 85%;
    max-width: 400px;
    max-height: 90vh;
    background-color: #0a0a0a;
    color: #ffffff !important;
    border: 2px solid #333;
    overflow-y: auto;
    box-shadow: 4px 4px 0px 0px rgba(0, 0, 0, 0.7);
    font-family: 'Press Start 2P', cursive;
    font-size: 14px;
    animation: slideInModal 0.4s ease-out;
  }
  
  .rugguard-warning-modal * {
    color: #ffffff !important;
    font-family: 'Press Start 2P', cursive !important;
    font-weight: bold !important;
  }

  .rugguard-warning-header {
    background-color: #f87171;
    color: #ffffff;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 2px solid #333;
    position: relative;
  }

  .rugguard-warning-header::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, 
      rgba(255, 107, 74, 0.2) 25%, 
      transparent 25%, 
      transparent 75%, 
      rgba(255, 107, 74, 0.2) 75%),
      linear-gradient(45deg, 
      rgba(255, 107, 74, 0.2) 25%, 
      transparent 25%, 
      transparent 75%, 
      rgba(255, 107, 74, 0.2) 75%);
    background-size: 8px 8px;
    background-position: 0 0, 4px 4px;
    pointer-events: none;
  }

  .rugguard-warning-title {
    display: flex;
    align-items: center;
    font-family: 'Press Start 2P', cursive;
    font-size: 10px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
    position: relative;
    z-index: 1;
    color: #ffffff;
  }

  .rugguard-warning-content {
    padding: 12px;
    background-color: #0a0a0a;
  }

  .rugguard-warning-token-info {
    margin-bottom: 12px;
    border: 1px solid #333;
    padding: 10px;
    background-color: #1a1a1a;
    box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 0.5);
    position: relative;
  }

  .rugguard-warning-token-info::before {
    content: '';
    position: absolute;
    top: 4px;
    left: 4px;
    right: 4px;
    bottom: 4px;
    border: 1px solid hsl(51, 100%, 50%);
    pointer-events: none;
    opacity: 0.3;
  }

  .rugguard-warning-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px dotted #333;
  }

  .rugguard-warning-label {
    color: #ffffff !important;
    font-family: 'Press Start 2P', cursive !important;
    font-size: 8px;
    font-weight: bold !important;
  }

  .rugguard-warning-value {
    font-size: 8px;
    font-weight: bold !important;
    color: #ffffff !important;
    font-family: 'Press Start 2P', cursive !important;
    text-align: right;
  }

  .rugguard-warning-risk {
    background-color: #2d1b1b;
    border: 1px solid #f87171;
    padding: 10px;
    margin-bottom: 12px;
    position: relative;
    box-shadow: 2px 2px 0px 0px rgba(248, 113, 113, 0.3);
  }

  .rugguard-warning-risk::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: repeating-linear-gradient(
      45deg,
      transparent,
      transparent 4px,
      rgba(248, 113, 113, 0.1) 4px,
      rgba(248, 113, 113, 0.1) 8px
    );
    pointer-events: none;
  }

  .rugguard-warning-risk-header {
    display: flex;
    align-items: center;
    color: #ffffff !important;
    font-family: 'Press Start 2P', cursive !important;
    font-size: 9px;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 1px;
    position: relative;
    z-index: 1;
    font-weight: bold !important;
  }

  .rugguard-warning-issues {
    margin-top: 10px;
    position: relative;
    z-index: 1;
  }

  .rugguard-warning-issue {
    display: flex;
    align-items: center;
    margin-bottom: 6px;
    font-size: 7px;
    color: #ffffff !important;
    padding: 6px;
    background-color: #1a0f0f;
    border-left: 2px solid #f87171;
    box-shadow: 1px 1px 0px 0px rgba(0, 0, 0, 0.3);
    font-family: 'Press Start 2P', cursive !important;
    font-weight: bold !important;
  }

  .rugguard-warning-issue span {
    color: #ffffff !important;
    font-family: 'Press Start 2P', cursive !important;
    font-weight: bold !important;
  }

  .rugguard-warning-issue svg {
    margin-right: 6px;
    min-width: 12px;
    color: #f87171;
  }

  .rugguard-warning-actions {
    display: flex;
    gap: 8px;
    margin-top: 12px;
  }

  .rugguard-warning-button {
    flex: 1;
    padding: 8px;
    font-family: 'Press Start 2P', cursive;
    font-size: 8px;
    font-weight: bold;
    cursor: pointer;
    text-align: center;
    transition: all 0.2s;
    border: 1px solid #333;
    text-transform: uppercase;
    letter-spacing: 1px;
    position: relative;
    box-shadow: 2px 2px 0 0 #000;
    background: none;
    color: #ffffff;
  }

  .rugguard-warning-button:hover {
    transform: translate(-1px, -1px);
    box-shadow: 3px 3px 0 0 #000;
  }

  .rugguard-warning-button:active {
    transform: translate(1px, 1px);
    box-shadow: 1px 1px 0 0 #000;
  }

  .rugguard-warning-button-secondary {
    background-color: #4a7cff;
    color: #ffffff;
    border-color: #333;
  }

  .rugguard-warning-button-secondary:hover {
    background-color: #3b68e6;
  }

  .rugguard-warning-button-danger {
    background-color: #f87171;
    color: #ffffff;
    border-color: #333;
  }

  .rugguard-warning-button-danger:hover {
    background-color: #ef4444;
  }

  .rugguard-safe-notification {
    position: fixed;
    bottom: 24px;
    right: 24px;
    background-color: #0a0a0a;
    border: 2px solid #4ADE80;
    padding: 20px;
    display: flex;
    flex-direction: column;
    box-shadow: 4px 4px 0px 0px rgba(0, 0, 0, 0.7);
    z-index: 999998;
    width: 360px;
    min-height: 150px;
    animation: rugguard-slide-in 0.3s ease-out forwards;
    font-family: 'Press Start 2P', cursive;
  }

  @keyframes rugguard-slide-in {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes rugguard-slide-out {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }

  .rugguard-safe-notification-header {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    background-color: #4ADE80;
    color: #0a0a0a;
    padding: 8px;
    margin: -16px -16px 12px -16px;
    border-bottom: 2px solid #000;
  }

  .rugguard-safe-notification-content {
    color: #ffffff !important;
    font-family: 'Press Start 2P', cursive !important;
  }

  .rugguard-safe-notification-title {
    font-size: 8px;
    font-weight: bold !important;
    margin-bottom: 8px;
    color: #ffffff !important;
    font-family: 'Press Start 2P', cursive !important;
    text-transform: uppercase;
  }

  .rugguard-safe-notification-actions {
    display: flex;
    gap: 8px;
    margin-top: 12px;
  }

  .rugguard-safe-notification-button {
    flex: 1;
    padding: 6px 8px;
    font-family: 'Press Start 2P', cursive !important;
    font-size: 6px;
    font-weight: bold !important;
    cursor: pointer;
    text-align: center;
    transition: all 0.2s;
    border: 1px solid #333;
    text-transform: uppercase;
    letter-spacing: 1px;
    position: relative;
    box-shadow: 2px 2px 0 0 #000;
    background: none;
    color: #ffffff !important;
    text-decoration: none;
  }

  .rugguard-safe-notification-button:hover {
    transform: translate(-1px, -1px);
    box-shadow: 3px 3px 0 0 #000;
  }

  .rugguard-safe-notification-button:active {
    transform: translate(1px, 1px);
    box-shadow: 1px 1px 0 0 #000;
  }

  .rugguard-safe-button-primary {
    background-color: #4ADE80;
    color: #0a0a0a !important;
    border-color: #333;
  }

  .rugguard-safe-button-primary:hover {
    background-color: #22c55e;
    color: #0a0a0a !important;
  }

  .rugguard-safe-button-secondary {
    background-color: #4a7cff;
    color: #ffffff !important;
    border-color: #333;
  }

  .rugguard-safe-button-secondary:hover {
    background-color: #3b68e6;
  }

  .rugguard-safe-notification-message {
    font-size: 12px;
    color: #4b5563;
  }

  .rugguard-token-address {
    font-family: monospace;
    background-color: transparent;
    padding: 2px 4px;
    border-radius: 4px;
    font-size: 12px;
    color: #ffffff;
  }

  /* Floating Badge Styles - Pixel Art Theme */
  .rugguard-floating-badge {
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #4a7cff;
    color: #ffffff !important;
    font-family: 'Press Start 2P', cursive !important;
    font-size: 8px;
    font-weight: bold !important;
    padding: 8px 12px;
    z-index: 999999;
    border: 2px solid #000;
    box-shadow: 4px 4px 0 0 rgba(0, 0, 0, 0.7);
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.2s;
    animation: badge-pulse 3s infinite ease-in-out;
    letter-spacing: 1px;
    text-align: center;
    min-width: 120px;
  }

  .rugguard-floating-badge:hover {
    transform: translate(-2px, -2px);
    box-shadow: 6px 6px 0 0 rgba(0, 0, 0, 0.7);
    background-color: #3b68e6;
  }

  .rugguard-floating-badge:active {
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0 0 rgba(0, 0, 0, 0.7);
  }

  .rugguard-floating-badge.premium {
    background-color: #8732a8;
    border-color: #FFD700;
    color: #FFD700 !important;
  }

  .rugguard-floating-badge.premium:hover {
    background-color: #7529a0;
  }

  .rugguard-floating-badge.scanning {
    animation: badge-scanning 1.5s infinite;
  }

  .rugguard-floating-badge .icon {
    margin-right: 4px;
    font-size: 8px;
  }

  @keyframes badge-pulse {
    0% { opacity: 1; }
    50% { opacity: 0.8; }
    100% { opacity: 1; }
  }

  @keyframes badge-scanning {
    0% {
      background-color: #4a7cff;
      transform: scale(1);
    }
    50% {
      background-color: #FACC15;
      transform: scale(1.05);
    }
    100% {
      background-color: #4a7cff;
      transform: scale(1);
    }
  }

  /* Badge content with scan line effect */
  .rugguard-badge-content {
    position: relative;
    overflow: hidden;
    color: #ffffff !important;
    font-family: 'Press Start 2P', cursive !important;
    font-weight: bold !important;
  }

  .scan-line {
    background: linear-gradient(to bottom, 
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.3) 40%,
      rgba(255, 255, 255, 0.3) 60%,
      rgba(255, 255, 255, 0) 100%);
    animation: scanning 2s linear infinite;
    height: 100%;
    width: 100%;
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
    opacity: 0.6;
  }

  @keyframes scanning {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100%); }
  }
`;
document.head.appendChild(style);

/**
 * Automatically extract token address from URL and check it
 */
function autoExtractAndCheck() {
  console.log('RugGuard: Checking URL:', window.location.href);
  
  // Prevent duplicate checks
  if (isChecking) {
    console.log('RugGuard: Check already in progress, skipping');
    return;
  }
  
  // Extract token address from current URL
  const tokenAddress = extractTokenAddressFromUrl(window.location.href);

  console.log('RugGuard: Extracted token address:', tokenAddress);

  // If token address found and it's different from current, check it
  if (tokenAddress && tokenAddress !== currentTokenAddress) {
    console.log('RugGuard: New token detected, checking:', tokenAddress);
    currentTokenAddress = tokenAddress;
    checkToken(tokenAddress);
  } else if (!tokenAddress) {
    console.log('RugGuard: No token address found in URL');
  } else {
    console.log('RugGuard: Same token already checked:', tokenAddress);
  }
}

/**
 * Extract token address from various URL formats
 */
function extractTokenAddressFromUrl(url) {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;
    const pathname = parsedUrl.pathname;
    const pathParts = pathname.split('/').filter(part => part);

    // For Raydium URLs
    if (hostname.includes('raydium.io')) {
      const inputMint = parsedUrl.searchParams.get('inputMint') || parsedUrl.searchParams.get('inputCurrency');
      const outputMint = parsedUrl.searchParams.get('outputMint') || parsedUrl.searchParams.get('outputCurrency');

      if (outputMint && outputMint.toLowerCase() !== 'sol') {
        return outputMint;
      } else if (inputMint && inputMint.toLowerCase() !== 'sol') {
        return inputMint;
      } else if ((inputMint && inputMint.toLowerCase() === 'sol') || 
                 (outputMint && outputMint.toLowerCase() === 'sol')) {
        return 'So11111111111111111111111111111111111111112'; // Wrapped SOL
      }
    }
    // For Meteora URLs
    else if (hostname.includes('meteora.ag')) {
      if ((pathParts[0] === 'swap' || pathParts[0] === 'pool') && pathParts.length >= 2) {
        return pathParts[1];
      }

      const tokenParam = parsedUrl.searchParams.get('token') || 
                         parsedUrl.searchParams.get('inputToken') || 
                         parsedUrl.searchParams.get('outputToken');
      if (tokenParam && tokenParam.toLowerCase() !== 'sol') {
        return tokenParam;
      }
    }
    // For Pump.fun URLs
    else if (hostname.includes('pump.fun')) {
      if (pathParts[0] === 'pump' && pathParts.length >= 2) {
        return pathParts[1];
      }

      const tokenParam = parsedUrl.searchParams.get('token') || parsedUrl.searchParams.get('address');
      if (tokenParam) {
        return tokenParam;
      }
    }
    // For Fluxbeam URLs
    else if (hostname.includes('fluxbeam.xyz')) {
      // Direct address format (fluxbeam.xyz/ADDRESS)
      if (pathParts.length === 1 && pathParts[0].length >= 32) {
        return pathParts[0];
      }
      // Standard format with /swap/ or /pool/
      else if ((pathParts[0] === 'swap' || pathParts[0] === 'pool') && pathParts.length >= 2) {
        return pathParts[1];
      }

      // Check query parameters
      const tokenParam = parsedUrl.searchParams.get('inputToken') || 
                         parsedUrl.searchParams.get('outputToken') || 
                         parsedUrl.searchParams.get('token');
      if (tokenParam && tokenParam.toLowerCase() !== 'sol') {
        return tokenParam;
      }
    }
    // For DEXScreener URLs - extract token from page content since URLs contain pair addresses
    else if (hostname.includes('dexscreener.com')) {
      console.log('DEXScreener URL detected:', url);
      
      // Try to extract token address from page content
      return extractTokenFromDEXScreenerPage();
    }
    // For RugCheck URLs
    else if (hostname.includes('rugcheck.xyz')) {
      if (pathParts[0] === 'tokens' && pathParts.length >= 2) {
        return pathParts[1];
      }
    }

    return null;
  } catch (error) {
    console.error('Error parsing URL:', error);
    return null;
  }
}

/**
 * Extract token address from DEXScreener page content
 * DEXScreener URLs contain pair addresses, so we need to extract the actual token address from page elements
 */
function extractTokenFromDEXScreenerPage() {
  try {
    console.log('Extracting token from DEXScreener page content...');
    
    // Method 1: Look for the consistent token header section
    // DEXScreener always has a header with token name and address
    const headerSelectors = [
      'h1[class*="token"] + div', // Token name followed by address container
      '[class*="token-header"]', // Token header container
      '[class*="pair-header"]',  // Pair header container
      'h1 + div span',           // Address usually after h1 title
      '.text-xs.font-mono',      // Common styling for addresses
      '[class*="address"]'       // Generic address containers
    ];
    
    for (const selector of headerSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const text = element.textContent || element.innerText;
        if (text) {
          const tokenMatches = text.match(/[1-9A-HJ-NP-Za-km-z]{43,44}/g);
          if (tokenMatches) {
            for (const match of tokenMatches) {
              if (match.length >= 43 && match.length <= 44 && 
                  !match.startsWith('11111111') && 
                  !match.startsWith('So11111111')) {
                console.log(`Found token address in ${selector}:`, match);
                return match;
              }
            }
          }
        }
      }
    }
    
    // Method 2: Look for Next.js page data (DEXScreener uses Next.js)
    const nextDataScript = document.querySelector('#__NEXT_DATA__');
    if (nextDataScript) {
      try {
        const pageData = JSON.parse(nextDataScript.textContent);
        console.log('Found Next.js page data, searching for token...');
        
        // Search through the page props for token addresses
        const jsonString = JSON.stringify(pageData);
        const tokenMatches = jsonString.match(/[1-9A-HJ-NP-Za-km-z]{43,44}/g);
        if (tokenMatches) {
          for (const match of tokenMatches) {
            if (match.length >= 43 && match.length <= 44 && 
                !match.startsWith('11111111') && 
                !match.startsWith('So11111111')) {
              console.log('Found token address in Next.js data:', match);
              return match;
            }
          }
        }
      } catch (e) {
        console.log('Could not parse Next.js data');
      }
    }
    
    // Method 3: Look for specific Solscan block explorer links (most reliable method)
    // Target the exact HTML pattern: <a target="_blank" rel="noopener noreferrer nofollow" class="chakra-link chakra-button custom-15f5h9" title="Open in block explorer" href="https://solscan.io/token/...">
    const solscanLinks = document.querySelectorAll('a[href*="solscan.io/token/"], a[title*="block explorer"], a[title*="Open in block explorer"]');
    console.log(`Found ${solscanLinks.length} potential Solscan links`);
    
    for (const link of solscanLinks) {
      const href = link.getAttribute('href');
      const title = link.getAttribute('title');
      
      console.log('Checking Solscan link:', href, 'with title:', title);
      
      if (href && href.includes('solscan.io/token/')) {
        // Extract token address from Solscan URL pattern: https://solscan.io/token/TOKEN_ADDRESS
        const urlParts = href.split('/token/');
        if (urlParts.length > 1) {
          const tokenAddress = urlParts[1].split('?')[0]; // Remove query parameters
          if (tokenAddress.length >= 43 && tokenAddress.length <= 44) {
            console.log('Successfully extracted token address from Solscan link:', tokenAddress);
            return tokenAddress;
          }
        }
      }
    }
    
    // Method 4: Fallback to other explorer links
    const otherExplorerLinks = document.querySelectorAll('a[href*="explorer.solana.com"], a[href*="solana.fm"]');
    for (const link of otherExplorerLinks) {
      const href = link.getAttribute('href');
      if (href) {
        const tokenMatches = href.match(/[1-9A-HJ-NP-Za-km-z]{43,44}/g);
        if (tokenMatches && tokenMatches[0]) {
          console.log('Found token address in other explorer link:', tokenMatches[0]);
          return tokenMatches[0];
        }
      }
    }
    
    console.log('No token address found in DEXScreener page content');
    return null;
    
  } catch (error) {
    console.error('Error extracting token from DEXScreener page:', error);
    return null;
  }
}

/**
 * Check a token with the RugCheck API
 */
function checkToken(tokenAddress) {
  isChecking = true; // Set checking flag
  
  chrome.runtime.sendMessage(
    { action: 'checkToken', address: tokenAddress },
    function(response) {
      isChecking = false; // Clear checking flag
      
      if (response && response.success && response.data) {
        const tokenData = response.data;

        console.log('Token data received:', tokenData);

        // Log token data for debugging
        console.log('Processing token data - Address:', tokenData.address);
        console.log('Risk Level:', tokenData.risk_level);
        console.log('Risk Score:', tokenData.risk_score);
        console.log('Is Risky:', tokenData.isRisky);
        console.log('Is Rug:', tokenData.is_rug);

        // Determine if token is risky based on multiple criteria
        const isDangerous = tokenData.isRisky || 
                           tokenData.is_rug || 
                           (tokenData.risk_level && ['danger', 'high', 'high risk', 'warning', 'moderate', 'medium risk'].includes(tokenData.risk_level.toLowerCase())) ||
                           (tokenData.risk_score && tokenData.risk_score > 1000);

        if (isDangerous) {
          console.log('Token determined as risky - showing warning modal');
          createWarningModal(tokenData);
        } else {
          console.log('Token determined as safe - showing safe notification');
          showSafeTokenNotification(tokenData);
        }
      } else {
        console.error('Failed to check token:', response?.error || 'Unknown error');
      }
    }
  );
}

/**
 * Create a warning modal for high-risk tokens
 */
function createWarningModal(tokenData) {
  // Only show one warning at a time
  if (warningModalShown) {
    removeWarningModal();
  }

  warningModalShown = true;

  // Create modal elements
  const overlay = document.createElement('div');
  overlay.className = 'rugguard-warning-overlay';
  overlay.id = 'rugguard-warning-overlay';

  const modal = document.createElement('div');
  modal.className = 'rugguard-warning-modal';

  // Header
  const header = document.createElement('div');
  header.className = 'rugguard-warning-header';

  const title = document.createElement('div');
  title.className = 'rugguard-warning-title';
  title.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
    HIGH RISK TOKEN DETECTED
  `;

  const closeButton = document.createElement('button');
  closeButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  `;
  closeButton.style.background = 'none';
  closeButton.style.border = 'none';
  closeButton.style.color = 'white';
  closeButton.style.cursor = 'pointer';
  closeButton.onclick = removeWarningModal;

  header.appendChild(title);
  header.appendChild(closeButton);

  // Content
  const content = document.createElement('div');
  content.className = 'rugguard-warning-content';

  // Token Info
  const tokenInfo = document.createElement('div');
  tokenInfo.className = 'rugguard-warning-token-info';

  const tokenInfoHeader = document.createElement('h3');
  tokenInfoHeader.style.fontSize = '16px';
  tokenInfoHeader.style.fontWeight = '600';
  tokenInfoHeader.style.marginBottom = '8px';
  tokenInfoHeader.style.color = '#111827';
  tokenInfoHeader.textContent = 'Token Details:';

  tokenInfo.appendChild(tokenInfoHeader);

  // Address row
  const addressRow = document.createElement('div');
  addressRow.className = 'rugguard-warning-row';

  const addressLabel = document.createElement('span');
  addressLabel.className = 'rugguard-warning-label';
  addressLabel.textContent = 'Address:';
  addressLabel.style.color = '#4b5563'; // Darker text for visibility

  const addressValue = document.createElement('code');
  addressValue.className = 'rugguard-token-address';
  addressValue.style.color = '#ffffff'; // White text for visibility on dark background
  addressValue.style.fontWeight = '500'; // Medium weight for better visibility
  addressValue.style.backgroundColor = 'transparent'; // No background
  addressValue.style.padding = '2px 4px'; // Padding for code
  addressValue.style.borderRadius = '3px'; // Rounded corners for code
  const shortAddress = `${tokenData.address.slice(0, 6)}...${tokenData.address.slice(-6)}`;
  addressValue.textContent = shortAddress;

  addressRow.appendChild(addressLabel);
  addressRow.appendChild(addressValue);
  tokenInfo.appendChild(addressRow);

  // Name row
  const nameRow = document.createElement('div');
  nameRow.className = 'rugguard-warning-row';

  const nameLabel = document.createElement('span');
  nameLabel.className = 'rugguard-warning-label';
  nameLabel.textContent = 'Name:';
  nameLabel.style.color = '#4b5563'; // Darker text for visibility

  const nameValue = document.createElement('span');
  nameValue.className = 'rugguard-warning-value';
  nameValue.textContent = tokenData.name || 'Unknown Token';
  nameValue.style.color = '#111827'; // Very dark gray, almost black for contrast
  nameValue.style.fontWeight = '500'; // Medium weight for better visibility

  nameRow.appendChild(nameLabel);
  nameRow.appendChild(nameValue);
  tokenInfo.appendChild(nameRow);

  // Symbol row (if available)
  if (tokenData.symbol) {
    const symbolRow = document.createElement('div');
    symbolRow.className = 'rugguard-warning-row';

    const symbolLabel = document.createElement('span');
    symbolLabel.className = 'rugguard-warning-label';
    symbolLabel.textContent = 'Symbol:';
    symbolLabel.style.color = '#4b5563'; // Darker text for visibility

    const symbolValue = document.createElement('span');
    symbolValue.className = 'rugguard-warning-value';
    symbolValue.textContent = tokenData.symbol;
    symbolValue.style.color = '#111827'; // Very dark gray, almost black for contrast
    symbolValue.style.fontWeight = '500'; // Medium weight for better visibility

    symbolRow.appendChild(symbolLabel);
    symbolRow.appendChild(symbolValue);
    tokenInfo.appendChild(symbolRow);
  }

  content.appendChild(tokenInfo);

  // Risk Assessment
  const riskAssessment = document.createElement('div');
  riskAssessment.className = 'rugguard-warning-risk-assessment';

  const riskHeader = document.createElement('h3');
  riskHeader.style.fontSize = '16px';
  riskHeader.style.fontWeight = '600';
  riskHeader.style.marginBottom = '8px';
  riskHeader.style.color = '#111827';
  riskHeader.textContent = 'Risk Assessment:';
  riskAssessment.appendChild(riskHeader);

  // Risk box
  const riskBox = document.createElement('div');
  riskBox.className = 'rugguard-warning-risk';

  const riskBoxHeader = document.createElement('div');
  riskBoxHeader.className = 'rugguard-warning-risk-header';
  riskBoxHeader.style.color = '#111827'; // Very dark gray, almost black for contrast
  riskBoxHeader.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="15" y1="9" x2="9" y2="15"></line>
      <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>
    Risk Level: <span style="font-weight: 700; margin-left: 4px; color: #b91c1c;">${tokenData.risk_level || 'DANGER'}</span>
  `;
  riskBox.appendChild(riskBoxHeader);

  // Risk score (if available)
  if (tokenData.risk_score) {
    const riskScore = document.createElement('p');
    riskScore.style.fontSize = '13px';
    riskScore.style.color = '#b91c1c';
    riskScore.style.marginTop = '4px';
    riskScore.style.marginBottom = '0';

    let riskCategory = 'High';
    if (tokenData.risk_score > 5000) {
      riskCategory = 'Extremely High';
    } else if (tokenData.risk_score > 1000) {
      riskCategory = 'Very High';
    } else if (tokenData.risk_score > 500) {
      riskCategory = 'High';
    } else if (tokenData.risk_score > 200) {
      riskCategory = 'Medium';
    } else {
      riskCategory = 'Low';
    }

    riskScore.textContent = `Risk Score: ${tokenData.risk_score} (${riskCategory})`;
    riskBox.appendChild(riskScore);
  }

  riskAssessment.appendChild(riskBox);

  // Issues list
  const issues = document.createElement('div');
  issues.className = 'rugguard-warning-issues';

  // Add issues from token data
  if (tokenData.issues && tokenData.issues.length > 0) {
    tokenData.issues.forEach(issue => {
      const issueItem = document.createElement('div');
      issueItem.className = 'rugguard-warning-issue';
      issueItem.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e11d48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
        <span style="color: #111827;">${issue}</span>
      `;
      issues.appendChild(issueItem);
    });
  } else {
    // Default issue
    const defaultIssue = document.createElement('div');
    defaultIssue.className = 'rugguard-warning-issue';
    defaultIssue.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e11d48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
      <span style="color: #111827;">Potential risk detected</span>
    `;
    issues.appendChild(defaultIssue);
  }

  riskAssessment.appendChild(issues);
  content.appendChild(riskAssessment);

  // Action buttons
  const actions = document.createElement('div');
  actions.className = 'rugguard-warning-actions';

  // View on RugCheck button
  const viewButton = document.createElement('a');
  viewButton.className = 'rugguard-warning-button rugguard-warning-button-secondary';
  viewButton.textContent = 'View on RugCheck';
  viewButton.href = `https://rugcheck.xyz/tokens/${tokenData.address}`;
  viewButton.target = '_blank';
  viewButton.rel = 'noopener noreferrer';

  // Proceed button
  const proceedButton = document.createElement('button');
  proceedButton.className = 'rugguard-warning-button rugguard-warning-button-danger';
  proceedButton.textContent = 'Proceed With Caution';
  proceedButton.onclick = removeWarningModal;

  actions.appendChild(viewButton);
  actions.appendChild(proceedButton);
  content.appendChild(actions);

  // Assemble and add to page
  modal.appendChild(header);
  modal.appendChild(content);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Prevent scrolling on the background
  document.body.style.overflow = 'hidden';
}

/**
 * Remove the warning modal
 */
function removeWarningModal() {
  const overlay = document.getElementById('rugguard-warning-overlay');
  if (overlay) {
    overlay.remove();
    warningModalShown = false;
    document.body.style.overflow = '';
  }
}

/**
 * Show a small notification for safe tokens
 */
function showSafeTokenNotification(tokenData) {
  // Remove any existing notification
  const existingNotification = document.getElementById('rugguard-safe-notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  // Create notification
  const notification = document.createElement('div');
  notification.className = 'rugguard-safe-notification';
  notification.id = 'rugguard-safe-notification';

  // Create header with green theme
  const header = document.createElement('div');
  header.className = 'rugguard-safe-notification-header';
  header.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
    <span style="font-size: 8px; font-weight: bold; text-transform: uppercase;">Safe Token</span>
  `;

  // Create content
  const content = document.createElement('div');
  content.className = 'rugguard-safe-notification-content';
  
  const title = document.createElement('div');
  title.className = 'rugguard-safe-notification-title';
  title.textContent = tokenData.name || 'Token Verified';
  
  // Risk score display
  const riskScore = document.createElement('div');
  riskScore.style.fontSize = '6px';
  riskScore.style.color = '#ffffff';
  riskScore.style.fontFamily = '"Press Start 2P", cursive';
  riskScore.style.lineHeight = '1.4';
  riskScore.style.marginBottom = '8px';
  riskScore.textContent = `Risk Score: ${tokenData.riskScore || tokenData.risk_score || 0}/10000`;

  // Grade display (from API response)
  const gradeDisplay = document.createElement('div');
  gradeDisplay.style.fontSize = '8px';
  gradeDisplay.style.color = '#4ADE80';
  gradeDisplay.style.fontFamily = '"Press Start 2P", cursive';
  gradeDisplay.style.fontWeight = 'bold';
  gradeDisplay.style.textAlign = 'center';
  gradeDisplay.style.padding = '4px 8px';
  gradeDisplay.style.border = '1px solid #4ADE80';
  gradeDisplay.style.marginBottom = '8px';
  
  // Display actual grade from API response
  if (tokenData.grade) {
    gradeDisplay.textContent = `Grade: ${tokenData.grade}`;
  } else {
    gradeDisplay.style.display = 'none'; // Hide if no grade data from API
  }

  content.appendChild(title);
  content.appendChild(riskScore);
  content.appendChild(gradeDisplay);

  // Create action buttons
  const actions = document.createElement('div');
  actions.className = 'rugguard-safe-notification-actions';

  const watchlistButton = document.createElement('button');
  watchlistButton.className = 'rugguard-safe-notification-button rugguard-safe-button-primary';
  watchlistButton.textContent = 'Add to Watchlist';
  watchlistButton.onclick = () => addTokenToWatchlist(tokenData);

  const dismissButton = document.createElement('button');
  dismissButton.className = 'rugguard-safe-notification-button rugguard-safe-button-secondary';
  dismissButton.textContent = 'Check on RugCheck';
  dismissButton.onclick = () => {
    window.open(`https://rugcheck.xyz/tokens/${tokenData.address}`, '_blank');
    dismissSafeNotification();
  };

  actions.appendChild(watchlistButton);
  actions.appendChild(dismissButton);

  // Assemble notification
  notification.appendChild(header);
  notification.appendChild(content);
  notification.appendChild(actions);

  // Add to page
  document.body.appendChild(notification);

  // Auto-remove after 8 seconds (longer to allow user interaction)
  setTimeout(() => {
    dismissSafeNotification();
  }, 8000);
}

function addTokenToWatchlist(tokenData) {
  // Send message to background script to add token to watchlist
  chrome.runtime.sendMessage({
    action: 'addToWatchlist',
    token: {
      address: tokenData.address,
      name: tokenData.name,
      symbol: tokenData.symbol,
      riskScore: tokenData.riskScore,
      addedAt: new Date().toISOString()
    }
  }, (response) => {
    if (response && response.success) {
      // Update button to show success
      const watchlistButton = document.querySelector('.rugguard-safe-button-primary');
      if (watchlistButton) {
        watchlistButton.textContent = 'Added!';
        watchlistButton.style.backgroundColor = '#22c55e';
        watchlistButton.disabled = true;
        
        // Dismiss notification after short delay
        setTimeout(() => {
          dismissSafeNotification();
        }, 1500);
      }
    } else {
      // Show error state
      const watchlistButton = document.querySelector('.rugguard-safe-button-primary');
      if (watchlistButton) {
        watchlistButton.textContent = 'Error';
        watchlistButton.style.backgroundColor = '#ef4444';
      }
    }
  });
}

function dismissSafeNotification() {
  const notification = document.getElementById('rugguard-safe-notification');
  if (notification) {
    notification.style.animation = 'rugguard-slide-out 0.3s ease-in forwards';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }
}

// Run the check when the page loads
window.addEventListener('load', () => {
  console.log('RugGuard: Page loaded, starting token check');
  setTimeout(autoExtractAndCheck, 1000);
});

// Check again when URL changes (crucial for SPAs like DexScreener)
let lastUrl = window.location.href;
const observer = new MutationObserver(() => {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    console.log('RugGuard: URL changed from', lastUrl, 'to', currentUrl);
    lastUrl = currentUrl;
    setTimeout(autoExtractAndCheck, 500);
  }
});

observer.observe(document, { subtree: true, childList: true });

// Create themed floating badge
function createFloatingBadge() {
  if (document.querySelector('.rugguard-floating-badge')) return;
  
  const badge = document.createElement('div');
  badge.className = 'rugguard-floating-badge';
  badge.innerHTML = `
    <div class="rugguard-badge-content">
      🛡️ RUGGUARD ACTIVE
      <div class="scan-line"></div>
    </div>
  `;
  
  badge.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'openPopup' });
  });
  
  document.body.appendChild(badge);
}

// Enhanced DexScreener support
if (window.location.hostname.includes('dexscreener.com')) {
  console.log('RugGuard: DexScreener detected, setting up enhanced monitoring');
  
  // Check once after page content loads for DexScreener
  setTimeout(autoExtractAndCheck, 3000);
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'extractDexScreenerToken') {
    const tokenAddress = extractTokenFromDEXScreenerPage();
    sendResponse({tokenAddress: tokenAddress});
    return true;
  }
  
  // Handle settings updates
  if (request.action === 'updateSettings') {
    const settings = request.settings;
    
    // Update floating badge visibility
    const badge = document.querySelector('.rugguard-floating-badge');
    if (badge) {
      badge.style.display = settings.showBadge ? 'block' : 'none';
    }
    
    // Store settings locally for content script to use
    chrome.storage.local.set({ contentScriptSettings: settings });
    
    sendResponse({ success: true });
    return true;
  }
});

// Initialize badge and apply settings
createFloatingBadge();

// Load and apply current settings when content script loads
chrome.storage.local.get(['settings'], function(result) {
  const settings = result.settings || {
    notificationSounds: true,
    showBadge: true,
    autoScan: true
  };
  
  // Apply badge visibility setting
  const badge = document.querySelector('.rugguard-floating-badge');
  if (badge) {
    badge.style.display = settings.showBadge ? 'block' : 'none';
  }
  
  // Store settings for content script use
  chrome.storage.local.set({ contentScriptSettings: settings });
});

console.log('RugGuard: Content script loaded and active');