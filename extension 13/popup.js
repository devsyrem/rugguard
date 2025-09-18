/**
 * RugGuard - Popup Script
 * Handles the extension popup UI
 */

// DOM elements - Token Checker Tab
const tokenInput = document.getElementById('token-input');
const checkButton = document.getElementById('check-button');
const errorMessage = document.getElementById('error-message');
const loadingElement = document.getElementById('loading');
const currentTokenElement = document.getElementById('current-token');
const tokenNameElement = document.getElementById('token-name');
const riskBadgeElement = document.getElementById('risk-badge');
const tokenAddressElement = document.getElementById('token-address');
const tokenSymbolRow = document.getElementById('token-symbol-row');
const tokenSymbolElement = document.getElementById('token-symbol');
const riskScoreRow = document.getElementById('risk-score-row');
const riskScoreElement = document.getElementById('risk-score');
const gradeRow = document.getElementById('grade-row');
const gradeElement = document.getElementById('grade');
const viewOnRugcheckLink = document.getElementById('view-on-rugcheck');
const addToWatchlistButton = document.getElementById('add-to-watchlist');
const historyList = document.getElementById('history-list');
const emptyState = document.getElementById('empty-state');
const clearHistoryButton = document.getElementById('clear-history');

// DOM elements - Watchlist Tab
const watchlistContainer = document.getElementById('watchlist-container');
const emptyWatchlist = document.getElementById('empty-watchlist');
const clearWatchlistButton = document.getElementById('clear-watchlist');
const monitorStatusElement = document.getElementById('monitor-status');
const watchlistTokenInput = document.getElementById('watchlist-token-input');
const addToWatchlistManualButton = document.getElementById('add-to-watchlist-manual');
const watchlistErrorMessage = document.getElementById('watchlist-error-message');
const watchlistLoading = document.getElementById('watchlist-loading');

// DOM elements - Auth & Settings
const connectionStatus = document.getElementById('connection-status');
const loginSection = document.getElementById('login-section');
const userInfoSection = document.getElementById('user-info');
const loginButton = document.getElementById('login-button');
const demoLoginButton = document.getElementById('demo-login-button');
const logoutButton = document.getElementById('logout-button');
const userEmailElement = document.getElementById('user-email');
const subscriptionBadgeElement = document.getElementById('subscription-badge');

// DOM elements - Settings Tab
const notificationSoundsCheckbox = document.getElementById('notification-sounds');
const showBadgeCheckbox = document.getElementById('show-badge');
const autoScanCheckbox = document.getElementById('auto-scan');

// DOM elements - Wallet Connection
const walletConnectionSection = document.getElementById('wallet-connection-section');
const connectPhantomButton = document.getElementById('connect-phantom-button');
const connectSolflareButton = document.getElementById('connect-solflare-button');
const cancelWalletConnectionButton = document.getElementById('cancel-wallet-connection');

// Tab navigation elements
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

// Current token data
let currentToken = null;

// Initialize the extension
async function init() {
  // Skip authentication - show logged in view by default
  showLoggedInView();
  
  // Load token history and watchlist
  await loadTokenHistory();
  await loadWatchlist();
  
  // Check if there's a current URL in the active tab
  await getCurrentTabUrl();
  
  // Load settings
  loadSettings();
  
  // Load and display stats
  await loadStats();
}

// Create a demo user for testing
async function createDemoUser() {
  // Log in with a demo token
  chrome.runtime.sendMessage(
    { action: 'login', token: 'demo-token' },
    function(response) {
      if (response && response.success) {
        showLoggedInView();
        
        // Set demo user info
        userEmailElement.textContent = 'demo@rugguard.xyz';
        subscriptionBadgeElement.textContent = 'Free';
        subscriptionBadgeElement.classList.remove('premium');
        
        // Update connection status
        updateConnectionStatus('connected', 'Demo Mode Active');
      }
    }
  );
}

// Show wallet connection UI
function showWalletConnectionUI() {
  // Hide login section
  loginSection.style.display = 'none';
  
  // Show wallet connection section
  if (walletConnectionSection) {
    walletConnectionSection.style.display = 'block';
  } else {
    // Create wallet connection UI if it doesn't exist
    createWalletConnectionUI();
  }
}

// Create wallet connection UI
function createWalletConnectionUI() {
  // Create section if it doesn't exist
  walletConnectionSection = document.createElement('div');
  walletConnectionSection.id = 'wallet-connection-section';
  walletConnectionSection.className = 'login-section';
  walletConnectionSection.style.display = 'block';
  
  // Create title
  const title = document.createElement('h3');
  title.className = 'font-pixel';
  title.style.fontSize = '14px';
  title.style.marginBottom = '16px';
  title.textContent = 'CONNECT WALLET';
  
  // Create Phantom button
  connectPhantomButton = document.createElement('button');
  connectPhantomButton.id = 'connect-phantom-button';
  connectPhantomButton.className = 'login-button';
  connectPhantomButton.style.marginBottom = '10px';
  connectPhantomButton.style.width = '100%';
  connectPhantomButton.style.display = 'flex';
  connectPhantomButton.style.alignItems = 'center';
  connectPhantomButton.style.justifyContent = 'center';
  connectPhantomButton.innerHTML = `
    <span style="margin-right: 8px;">
      <svg width="20" height="20" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="128" height="128" rx="64" fill="white"/>
        <path d="M110.584 64.9142H99.142C99.142 41.7651 80.173 23 56.7724 23C33.7716 23 15 41.3057 15 64.4548C15 87.6039 33.969 106.062 57.0222 106.062H110.43C112.184 106.062 113.587 104.685 113.587 102.982V68.0662C113.741 66.3326 112.338 64.9142 110.584 64.9142ZM56.9222 87.6039C44.1206 87.6039 33.969 77.7071 33.969 65.0765C33.969 52.4459 44.1206 42.549 56.9222 42.549C69.7239 42.549 79.8754 52.4459 79.8754 65.0765C79.8754 77.5448 69.7239 87.6039 56.9222 87.6039Z" fill="#4A7CFF"/>
        <path d="M80.9248 65.0765C80.9248 52.2224 70.1236 41.9272 56.9221 41.9272C43.7207 41.9272 32.9194 52.2224 32.9194 65.0764C32.9194 77.9304 43.7207 88.2256 56.9221 88.2256C70.1236 88.2256 80.9248 77.9304 80.9248 65.0765Z" fill="#FF6B4A"/>
      </svg>
    </span>
    Phantom
  `;
  connectPhantomButton.addEventListener('click', () => connectWallet('phantom'));
  
  // Create Solflare button
  connectSolflareButton = document.createElement('button');
  connectSolflareButton.id = 'connect-solflare-button';
  connectSolflareButton.className = 'login-button';
  connectSolflareButton.style.marginBottom = '16px';
  connectSolflareButton.style.width = '100%';
  connectSolflareButton.style.backgroundColor = '#FFD700';
  connectSolflareButton.style.color = '#000000';
  connectSolflareButton.style.display = 'flex';
  connectSolflareButton.style.alignItems = 'center';
  connectSolflareButton.style.justifyContent = 'center';
  connectSolflareButton.innerHTML = `
    <span style="margin-right: 8px;">
      <svg width="20" height="20" viewBox="0 0 261 260" xmlns="http://www.w3.org/2000/svg">
        <path d="M130.135 0C58.3961 0 0 58.396 0 130.135C0 201.873 58.3961 260.271 130.135 260.271C201.873 260.271 260.27 201.873 260.27 130.135C260.27 58.396 201.873 0 130.135 0ZM130.135 235.674C72.1336 235.674 24.5949 188.136 24.5949 130.135C24.5949 72.1326 72.1336 24.5959 130.135 24.5959C188.135 24.5959 235.674 72.1326 235.674 130.135C235.674 188.136 188.135 235.674 130.135 235.674Z" fill="#000000"/>
        <path d="M107.021 208.566C102.429 205.477 97.8366 202.386 93.3333 199.071L93.2441 198.908L93.4033 198.796C112.321 187.097 122.041 178.426 122.947 171.785C122.947 171.684 122.947 171.582 122.947 171.48C123.05 158.461 92.7582 140.77 31.9993 118.425L31.8593 118.313L31.9993 118.2C61.4321 96.5246 90.8649 85.6865 120.299 85.6865C135.141 85.6865 149.982 88.7764 164.823 94.9562L164.985 95.0455L164.913 95.2081C155.889 114.127 151.376 126.832 151.376 133.324C151.376 152.245 170.003 171.164 207.254 190.085L207.411 190.175L207.256 190.287C174.024 202.733 140.678 210.193 107.021 208.566Z" fill="#000000"/>
      </svg>
    </span>
    Solflare
  `;
  connectSolflareButton.addEventListener('click', () => connectWallet('solflare'));
  
  // Create cancel button
  cancelWalletConnectionButton = document.createElement('button');
  cancelWalletConnectionButton.id = 'cancel-wallet-connection';
  cancelWalletConnectionButton.className = 'clear-button';
  cancelWalletConnectionButton.textContent = 'Cancel';
  cancelWalletConnectionButton.addEventListener('click', () => {
    // Hide wallet connection section
    walletConnectionSection.style.display = 'none';
    // Show login section
    loginSection.style.display = 'block';
  });
  
  // Assemble UI
  walletConnectionSection.appendChild(title);
  walletConnectionSection.appendChild(connectPhantomButton);
  walletConnectionSection.appendChild(connectSolflareButton);
  walletConnectionSection.appendChild(document.createElement('br'));
  walletConnectionSection.appendChild(cancelWalletConnectionButton);
  
  // Add to document
  const container = document.querySelector('.container');
  container.insertBefore(walletConnectionSection, container.firstChild);
}

// Connect wallet
async function connectWallet(walletType) {
  try {
    updateConnectionStatus('connecting', 'Connecting to wallet...');
    
    // Check if wallet is installed
    const walletAvailable = await checkWalletAvailability(walletType);
    
    if (!walletAvailable) {
      // Prompt user to install wallet
      const installWallet = confirm(`${walletType} wallet is not installed. Would you like to install it?`);
      
      if (installWallet) {
        // Open wallet website to install
        if (walletType === 'phantom') {
          openWebPage('https://phantom.app/download');
        } else if (walletType === 'backpack') {
          openWebPage('https://www.backpack.app/download');
        }
      }
      
      updateConnectionStatus('disconnected', 'Wallet not connected');
      return;
    }
    
    // In a real implementation, connect to the wallet and get the wallet address
    try {
      let walletAddress = '';
      
      if (walletType === 'phantom') {
        // This would be replaced with actual Phantom wallet connection
        // For now, simulate requesting connection to the wallet
        console.log('Connecting to Phantom wallet...');
        // In production, this would use: await window.phantom.solana.connect()
        walletAddress = 'simulated-phantom-address';
      } else if (walletType === 'backpack') {
        // This would be replaced with actual Backpack wallet connection
        console.log('Connecting to Backpack wallet...');
        // In production, this would connect to Backpack
        walletAddress = 'simulated-backpack-address';
      }
      
      if (walletAddress) {
        // Instead of using an API, we'll store the wallet address locally
        // This simulates a successful login that would normally come from the database
        const walletShort = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
        const userData = {
          walletType: walletType,
          walletAddress: walletAddress,
          displayName: `${walletType.charAt(0).toUpperCase() + walletType.slice(1)} (${walletShort})`,
          isPremium: true, // Default to premium for now
          token: `local-auth-${walletType}-${Date.now()}`, // Generate a simple token
          lastLogin: new Date().toISOString()
        };
        
        // Save this data to chrome.storage for persistence
        await chrome.storage.local.set({ 
          currentUser: userData,
          authToken: userData.token
        });
        
        // Store the authentication token
        await storeToken(userData.token);
        
        // Show connected view
        showLoggedInView();
        
        // Display wallet info
        userEmailElement.textContent = userData.displayName;
        
        // Set subscription status (free by default, premium requires payment)
        subscriptionBadgeElement.textContent = 'Free';
        subscriptionBadgeElement.classList.remove('premium');
        
        // Update connection status
        updateConnectionStatus('connected', 'Wallet Connected');
        
        // Show premium upgrade section
        const premiumUpgradeSection = document.getElementById('premium-upgrade-section');
        if (premiumUpgradeSection) {
          premiumUpgradeSection.style.display = 'block';
        }
        
        // Load wallet-specific data (like history and watchlist)
        loadTokenHistory();
        loadWatchlist();
        
        // This commented section will be used when your API is ready
        /*
        const response = await fetch('https://api.rugguard.xyz/auth/wallet-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            walletType: walletType,
            walletAddress: walletAddress
          })
        });
        
        if (response.ok) {
          const userData = await response.json();
          await storeToken(userData.token);
          // Rest of the API implementation
        }
        */
      } else {
        updateConnectionStatus('disconnected', 'Unable to get wallet address');
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      updateConnectionStatus('disconnected', 'Wallet connection failed');
    }
  } catch (error) {
    console.error('Error connecting wallet:', error);
    updateConnectionStatus('disconnected', 'Connection failed');
  }
}

// Check if wallet is available
async function checkWalletAvailability(walletType) {
  // Check if the wallet extension is available in the browser
  if (walletType === 'phantom') {
    // Check if Phantom is installed
    const isPhantomInstalled = window.phantom?.solana !== undefined;
    return isPhantomInstalled;
  } else if (walletType === 'backpack') {
    // Check if Backpack is installed
    const isBackpackInstalled = window.backpack !== undefined;
    return isBackpackInstalled;
  }
  
  return false;
}

// Process payment and upgrade to premium
async function processPremiumPayment(paymentMethod) {
  try {
    // Show payment processing state
    updateConnectionStatus('connecting', `Processing ${paymentMethod} payment...`);
    
    // In a real implementation, this would redirect to a payment page or handle the payment directly
    // For now, we'll simulate a successful payment process
    
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Get current user data
    const userData = await chrome.storage.local.get('currentUser');
    if (!userData.currentUser) {
      throw new Error('User not found');
    }
    
    // Update user to premium status
    const updatedUser = {
      ...userData.currentUser,
      isPremium: true,
      premiumExpires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
      paymentMethod: paymentMethod,
      paymentDate: new Date().toISOString()
    };
    
    // Save updated user data
    await chrome.storage.local.set({ currentUser: updatedUser });
    
    // Update UI to show premium status
    subscriptionBadgeElement.textContent = 'Premium';
    subscriptionBadgeElement.classList.add('premium');
    
    // Hide the premium upgrade section
    const premiumUpgradeSection = document.getElementById('premium-upgrade-section');
    if (premiumUpgradeSection) {
      premiumUpgradeSection.style.display = 'none';
    }
    
    // Show success message
    updateConnectionStatus('connected', 'Premium activated!');
    
    // In a production environment, you would also send this info to your database
    
  } catch (error) {
    console.error(`Payment error (${paymentMethod}):`, error);
    updateConnectionStatus('disconnected', 'Payment failed');
  }
}

// Handle Solana Pay payment
async function handleSolanaPay() {
  // In a production environment, this would generate a Solana Pay transaction
  // For now, we'll just simulate the payment process
  processPremiumPayment('solana');
}

// Handle Stripe payment
async function handleStripePayment() {
  // In a production environment, this would redirect to a Stripe checkout page
  // For now, we'll just simulate the payment process
  processPremiumPayment('stripe');
}

// Attach event listeners
function attachEventListeners() {
  // Token checker tab
  checkButton.addEventListener('click', checkCurrentUrl);
  tokenInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      checkCurrentUrl();
    }
  });
  clearHistoryButton.addEventListener('click', clearHistory);
  addToWatchlistButton.addEventListener('click', addCurrentTokenToWatchlist);
  
  // Watchlist tab
  clearWatchlistButton.addEventListener('click', clearWatchlist);
  addToWatchlistManualButton.addEventListener('click', addManualTokenToWatchlist);
  watchlistTokenInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      addManualTokenToWatchlist();
    }
  });
  
  // Wallet connection buttons in watchlist tab
  // Wallet connection feature has been removed from watchlist tab
  
  // Payment buttons
  const payWithSolana = document.getElementById('pay-with-solana');
  const payWithStripe = document.getElementById('pay-with-stripe');
  
  if (payWithSolana) {
    payWithSolana.addEventListener('click', handleSolanaPay);
  }
  
  if (payWithStripe) {
    payWithStripe.addEventListener('click', handleStripePayment);
  }
  
  // Auth events removed - no login/logout needed
  
  // Settings events
  notificationSoundsCheckbox.addEventListener('change', saveSettings);
  showBadgeCheckbox.addEventListener('change', saveSettings);
  autoScanCheckbox.addEventListener('change', saveSettings);
  
  // Tab navigation
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.dataset.tab;
      
      // Update active tab button
      tabButtons.forEach(btn => {
        btn.classList.remove('active');
      });
      button.classList.add('active');
      
      // Show the corresponding tab content
      tabContents.forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(`${tabName}-tab`).classList.add('active');
      
      // Load content based on which tab is selected
      if (tabName === 'watchlist') {
        loadWatchlist();
      } else if (tabName === 'stats') {
        loadStats();
      }
    });
  });
}

// Update connection status display
function updateConnectionStatus(status, message) {
  if (status === 'connected') {
    connectionStatus.innerHTML = `<span style="color: #4ADE80; font-size: 10px;">● ${message || 'Connected'}</span>`;
  } else if (status === 'connecting') {
    connectionStatus.innerHTML = `<span style="color: #FACC15; font-size: 10px;">● ${message || 'Connecting...'}</span>`;
  } else {
    connectionStatus.innerHTML = `<span style="color: #F87171; font-size: 10px;">● ${message || 'Not Connected'}</span>`;
  }
}

// Show the right panel based on login state
function showPanel(panelName) {
  if (panelName === 'login') {
    loginSection.style.display = 'block';
    userInfoSection.style.display = 'none';
    if (walletConnectionSection) {
      walletConnectionSection.style.display = 'none';
    }
  } else if (panelName === 'user') {
    loginSection.style.display = 'none';
    userInfoSection.style.display = 'flex';
    if (walletConnectionSection) {
      walletConnectionSection.style.display = 'none';
    }
  } else {
    loginSection.style.display = 'none';
    userInfoSection.style.display = 'none';
    if (walletConnectionSection) {
      walletConnectionSection.style.display = 'none';
    }
  }
}

// Show logged in view
function showLoggedInView() {
  // No login UI needed - extension is always ready to use
  return;
}

// Show not logged in view
function showNotLoggedInView() {
  showPanel('login');
}

// Show error message
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
}

// Hide error message
function hideError() {
  errorMessage.style.display = 'none';
}

/**
 * Get the current tab URL
 */
async function getCurrentTabUrl() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].url) {
      const url = tabs[0].url;
      const tokenAddress = extractTokenAddressFromUrl(url);
      
      if (tokenAddress) {
        tokenInput.value = tokenAddress;
        checkCurrentUrl();
      }
    }
  });
}

/**
 * Check the current URL or token address input
 */
function checkCurrentUrl() {
  const input = tokenInput.value.trim();
  
  if (!input) {
    showError('Please enter a token address or URL');
    return;
  }
  
  // Clear previous data
  hideError();
  currentTokenElement.style.display = 'none';
  loadingElement.style.display = 'flex';
  
  // Check if input is a URL
  let tokenAddress = input;
  if (input.startsWith('http')) {
    tokenAddress = extractTokenAddressFromUrl(input);
    
    if (!tokenAddress) {
      loadingElement.style.display = 'none';
      showError('Could not find a token address in the provided URL');
      return;
    }
  } else if (!validateInput(input)) {
    loadingElement.style.display = 'none';
    showError('Please enter a valid Solana token address or URL');
    return;
  }
  
  // Check token with background script
  chrome.runtime.sendMessage(
    { action: 'checkToken', address: tokenAddress, fromPopup: true },
    function(response) {
      loadingElement.style.display = 'none';
      
      if (response && response.success && response.data) {
        displayTokenResults(response.data);
        currentTokenElement.style.display = 'block';
      } else {
        showError(response?.error || 'Failed to check token');
      }
      
      // Refresh token history
      loadTokenHistory();
    }
  );
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
    
    // For Solscan URLs
    if (hostname.includes('solscan.io')) {
      if (pathParts[0] === 'token' && pathParts.length >= 2) {
        return pathParts[1];
      }
    }
    // For Solana Explorer URLs
    else if (hostname.includes('explorer.solana.com')) {
      if (pathParts[0] === 'address' && pathParts.length >= 2) {
        return pathParts[1];
      }
    }
    // For Raydium URLs
    else if (hostname.includes('raydium.io')) {
      const inputMint = parsedUrl.searchParams.get('inputMint') || parsedUrl.searchParams.get('inputCurrency');
      const outputMint = parsedUrl.searchParams.get('outputMint') || parsedUrl.searchParams.get('outputCurrency');
      
      if (outputMint && outputMint.toLowerCase() !== 'sol') {
        return outputMint;
      } else if (inputMint && inputMint.toLowerCase() !== 'sol') {
        return inputMint;
      }
    }
    // For Fluxbeam URLs
    else if (hostname.includes('fluxbeam.xyz')) {
      // Direct token address in URL
      if (pathParts.length >= 1 && validateInput(pathParts[0])) {
        return pathParts[0];
      }
    }
    // For DEXScreener URLs - request content script to extract token address
    else if (hostname.includes('dexscreener.com')) {
      // Send message to content script to extract token from page content
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {action: 'extractDexScreenerToken'}, function(response) {
            if (response && response.tokenAddress) {
              tokenInput.value = response.tokenAddress;
              checkCurrentUrl();
            }
          });
        }
      });
      return null; // Will be handled by content script response
    }
    
    // Check for token addresses in the URL
    const matches = url.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/);
    if (matches && matches.length > 0) {
      return matches[0];
    }
    
    // Handle direct token addresses
    if (validateInput(url)) {
      return url;
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing URL:', error);
    
    // Handle direct token addresses
    if (validateInput(url)) {
      return url;
    }
    
    return null;
  }
}

/**
 * Validate token address input
 */
function validateInput(input) {
  // Simple validation for Solana addresses (should be base58 and around 32-44 chars)
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(input);
}

/**
 * Display token results in UI
 */
function displayTokenResults(token) {
  // Store current token
  currentToken = token;
  
  // Set token details
  tokenNameElement.textContent = token.name || 'Unknown Token';
  tokenAddressElement.textContent = token.address;
  viewOnRugcheckLink.href = `https://rugcheck.xyz/tokens/${token.address}`;
  
  // Set risk badge
  let riskBadgeClass = 'token-badge-unknown';
  riskBadgeElement.textContent = token.risk_level || 'Unknown';
  
  if (token.is_rug) {
    riskBadgeElement.textContent = 'RUG PULL';
    riskBadgeClass = 'token-badge-danger';
  } else if (token.risk_level) {
    const riskLevel = token.risk_level.toLowerCase();
    if (riskLevel === 'safe') {
      riskBadgeClass = 'token-badge-safe';
    } else if (riskLevel === 'warning') {
      riskBadgeClass = 'token-badge-warning';
    } else if (riskLevel === 'danger') {
      riskBadgeClass = 'token-badge-danger';
    }
  }
  
  riskBadgeElement.className = `token-badge ${riskBadgeClass}`;
  
  // Set symbol if available
  if (token.symbol) {
    tokenSymbolElement.textContent = token.symbol;
    tokenSymbolRow.style.display = 'flex';
  } else {
    tokenSymbolRow.style.display = 'none';
  }
  
  // Set risk score if available
  if (token.risk_score !== undefined) {
    riskScoreElement.textContent = token.risk_score;
    riskScoreRow.style.display = 'flex';
  } else {
    riskScoreRow.style.display = 'none';
  }
  
  // Set grade if available
  if (token.grade) {
    gradeElement.textContent = token.grade;
    gradeRow.style.display = 'flex';
  } else {
    gradeRow.style.display = 'none';
  }
  
  // Display token supply if available
  const supplyRow = document.getElementById('token-supply-row');
  const supplyElement = document.getElementById('token-supply');
  
  if (token.total_supply) {
    supplyElement.textContent = token.total_supply;
    supplyRow.style.display = 'flex';
  } else {
    supplyRow.style.display = 'none';
  }
  
  // Display token liquidity if available
  const liquidityRow = document.getElementById('token-liquidity-row');
  const liquidityElement = document.getElementById('token-liquidity');
  
  if (token.liquidity !== undefined) {
    liquidityElement.textContent = `$${token.liquidity.toFixed(2)}`;
    liquidityRow.style.display = 'flex';
  } else {
    liquidityRow.style.display = 'none';
  }
  
  // Display risk factors if available
  const riskFactorsContainer = document.getElementById('risk-factors-container');
  
  if (token.risk_factors && token.risk_factors.length > 0) {
    // Clear previous risk factors
    riskFactorsContainer.innerHTML = '';
    
    // Create header
    const header = document.createElement('h3');
    header.textContent = 'Risk Factors';
    header.className = 'risk-factors-header';
    riskFactorsContainer.appendChild(header);
    
    // Create risk factors list
    const riskList = document.createElement('ul');
    riskList.className = 'risk-factors-list';
    
    token.risk_factors.forEach(factor => {
      const riskItem = document.createElement('li');
      riskItem.className = `risk-factor risk-${factor.severity}`;
      
      // Create risk factor name with severity icon
      const nameSpan = document.createElement('span');
      nameSpan.className = 'risk-factor-name';
      nameSpan.textContent = factor.name;
      
      // Add severity indicator
      const severityIcon = document.createElement('span');
      severityIcon.className = `severity-icon severity-${factor.severity}`;
      severityIcon.textContent = factor.severity === 'high' ? '⚠️' : 
                                factor.severity === 'medium' ? '⚠' : 'ℹ️';
      nameSpan.prepend(severityIcon);
      
      // Create description
      const descSpan = document.createElement('span');
      descSpan.className = 'risk-factor-description';
      descSpan.textContent = factor.description;
      
      // Create value (if available)
      if (factor.value) {
        const valueSpan = document.createElement('span');
        valueSpan.className = 'risk-factor-value';
        valueSpan.textContent = factor.value;
        riskItem.appendChild(valueSpan);
      }
      
      riskItem.appendChild(nameSpan);
      riskItem.appendChild(descSpan);
      riskList.appendChild(riskItem);
    });
    
    riskFactorsContainer.appendChild(riskList);
    riskFactorsContainer.style.display = 'block';
  } else {
    riskFactorsContainer.style.display = 'none';
  }
  
  // Add token image if available
  const tokenImageContainer = document.getElementById('token-image-container');
  if (token.image) {
    const tokenImage = document.createElement('img');
    tokenImage.src = token.image;
    tokenImage.alt = token.name || 'Token';
    tokenImage.className = 'token-image';
    
    // Clear previous image
    tokenImageContainer.innerHTML = '';
    tokenImageContainer.appendChild(tokenImage);
    tokenImageContainer.style.display = 'block';
  } else {
    tokenImageContainer.style.display = 'none';
  }
  
  // Check if token is already in watchlist
  chrome.runtime.sendMessage(
    { action: 'isTokenInWatchlist', address: token.address },
    function(response) {
      if (response && response.exists) {
        addToWatchlistButton.textContent = 'Remove from Watchlist';
        addToWatchlistButton.style.backgroundColor = '#F87171';
      } else {
        addToWatchlistButton.textContent = 'Add to Watchlist';
        addToWatchlistButton.style.backgroundColor = '#FF6B4A';
      }
    }
  );
}

/**
 * Load token history from storage
 */
function loadTokenHistory() {
  chrome.runtime.sendMessage(
    { action: 'getTokenHistory' },
    function(response) {
      if (response && response.success) {
        displayTokenHistory(response.history);
      }
    }
  );
}

/**
 * Display token history in the UI
 */
function displayTokenHistory(history) {
  // Clear current history
  while (historyList.firstChild && historyList.firstChild !== emptyState) {
    historyList.removeChild(historyList.firstChild);
  }
  
  // Show empty state if no history
  if (!history || history.length === 0) {
    emptyState.style.display = 'block';
    return;
  }
  
  // Hide empty state
  emptyState.style.display = 'none';
  
  // Add history items
  history.forEach((token) => {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.addEventListener('click', () => {
      tokenInput.value = token.address;
      checkCurrentUrl();
    });
    
    const historyItemHeader = document.createElement('div');
    historyItemHeader.className = 'history-item-header';
    
    const historyItemTitle = document.createElement('div');
    historyItemTitle.className = 'history-item-title';
    historyItemTitle.textContent = token.name || 'Unknown Token';
    
    const historyItemTime = document.createElement('div');
    historyItemTime.className = 'history-item-time';
    historyItemTime.textContent = formatRelativeTime(token.checkedAt);
    
    historyItemHeader.appendChild(historyItemTitle);
    historyItemHeader.appendChild(historyItemTime);
    
    const historyItemAddress = document.createElement('div');
    historyItemAddress.className = 'history-item-address';
    historyItemAddress.textContent = token.address.slice(0, 10) + '...' + token.address.slice(-6);
    
    // Add risk badge if available
    if (token.riskLevel) {
      const badgeSpan = document.createElement('span');
      badgeSpan.style.display = 'inline-block';
      badgeSpan.style.padding = '2px 4px';
      badgeSpan.style.borderRadius = '0';
      badgeSpan.style.fontSize = '10px';
      badgeSpan.style.color = 'white';
      badgeSpan.style.marginLeft = '6px';
      
      let badgeColor = '#6b7280';
      
      switch (token.riskLevel.toLowerCase()) {
        case 'safe':
          badgeColor = '#4ADE80';
          break;
        case 'warning':
          badgeColor = '#FACC15';
          break;
        case 'danger':
          badgeColor = '#F87171';
          break;
      }
      
      badgeSpan.style.backgroundColor = badgeColor;
      badgeSpan.textContent = token.riskLevel;
      
      historyItemTitle.appendChild(badgeSpan);
    }
    
    historyItem.appendChild(historyItemHeader);
    historyItem.appendChild(historyItemAddress);
    
    historyList.appendChild(historyItem);
  });
}

/**
 * Format relative time for history items
 */
function formatRelativeTime(dateString) {
  if (!dateString) return 'Unknown time';
  
  const now = new Date();
  const checkedDate = new Date(dateString);
  const diffMs = now - checkedDate;
  const diffSec = Math.floor(diffMs / 1000);
  
  if (diffSec < 60) {
    return 'just now';
  } else if (diffSec < 3600) {
    const min = Math.floor(diffSec / 60);
    return `${min} min${min > 1 ? 's' : ''} ago`;
  } else if (diffSec < 86400) {
    const hours = Math.floor(diffSec / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffSec / 86400);
    if (days < 30) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      const months = Math.floor(days / 30);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    }
  }
}

/**
 * Clear token history
 */
function clearHistory() {
  chrome.runtime.sendMessage(
    { action: 'clearTokenHistory' },
    function(response) {
      if (response && response.success) {
        while (historyList.firstChild && historyList.firstChild !== emptyState) {
          historyList.removeChild(historyList.firstChild);
        }
        emptyState.style.display = 'block';
      }
    }
  );
}

/**
 * Add current token to watchlist
 */
function addCurrentTokenToWatchlist() {
  if (!currentToken) return;
  
  // Check if token is already in watchlist
  chrome.runtime.sendMessage(
    { action: 'isTokenInWatchlist', address: currentToken.address },
    function(response) {
      if (response && response.exists) {
        // Remove from watchlist
        chrome.runtime.sendMessage(
          { action: 'removeFromWatchlist', address: currentToken.address },
          function(removeResponse) {
            if (removeResponse && removeResponse.success) {
              addToWatchlistButton.textContent = 'Add to Watchlist';
              addToWatchlistButton.style.backgroundColor = '#FF6B4A';
              
              // Reload watchlist to update UI
              loadWatchlist();
            }
          }
        );
      } else {
        // Add to watchlist
        chrome.runtime.sendMessage(
          { 
            action: 'addToWatchlist', 
            token: {
              address: currentToken.address,
              name: currentToken.name || 'Unknown Token',
              symbol: currentToken.symbol || 'Unknown',
              riskLevel: currentToken.risk_level || 'Unknown',
              riskScore: currentToken.risk_score || 0,
              grade: currentToken.grade || '?',
              isRug: currentToken.is_rug || false
            }
          },
          function(addResponse) {
            if (addResponse && addResponse.success) {
              addToWatchlistButton.textContent = 'Remove from Watchlist';
              addToWatchlistButton.style.backgroundColor = '#F87171';
              
              // Reload watchlist to update UI
              loadWatchlist();
            } else {
              // Token already exists - update button to show current state
              addToWatchlistButton.textContent = 'Remove from Watchlist';
              addToWatchlistButton.style.backgroundColor = '#F87171';
              showError('Token already in watchlist');
            }
          }
        );
      }
    }
  );
}

/**
 * Add token to watchlist manually from the watchlist tab
 */
function addManualTokenToWatchlist() {
  const tokenAddress = watchlistTokenInput.value.trim();
  
  // Show error if no address provided
  if (!tokenAddress) {
    watchlistErrorMessage.textContent = 'Please enter a token address';
    watchlistErrorMessage.style.display = 'block';
    return;
  }
  
  // Clear any previous errors
  watchlistErrorMessage.style.display = 'none';
  
  // Validate token address format
  if (!validateInput(tokenAddress)) {
    watchlistErrorMessage.textContent = 'Invalid token address format';
    watchlistErrorMessage.style.display = 'block';
    return;
  }
  
  // Show loading state
  watchlistLoading.style.display = 'flex';
  
  // First, check if the token is already in the watchlist
  chrome.runtime.sendMessage({
    action: 'isTokenInWatchlist',
    address: tokenAddress
  }, (response) => {
    if (response && response.exists) {
      watchlistLoading.style.display = 'none';
      watchlistErrorMessage.textContent = 'This token is already in your watchlist';
      watchlistErrorMessage.style.display = 'block';
      return;
    }
    
    // If not in watchlist, check the token with the API
    chrome.runtime.sendMessage({
      action: 'checkToken',
      address: tokenAddress
    }, (response) => {
      watchlistLoading.style.display = 'none';
      
      if (response && response.success) {
        const tokenData = response.data;
        
        // Add token to watchlist
        chrome.runtime.sendMessage({
          action: 'addToWatchlist',
          token: {
            address: tokenData.address,
            name: tokenData.name || 'Unknown Token',
            symbol: tokenData.symbol || 'Unknown',
            riskLevel: tokenData.risk_level || 'Unknown',
            riskScore: tokenData.risk_score || 0,
            grade: tokenData.grade || '?',
            isRug: tokenData.is_rug || false
          }
        }, (addResponse) => {
          if (addResponse && addResponse.success) {
            // Clear input field
            watchlistTokenInput.value = '';
            
            // Show success message
            watchlistErrorMessage.textContent = 'Token added to watchlist successfully';
            watchlistErrorMessage.style.display = 'block';
            watchlistErrorMessage.style.backgroundColor = '#082f1d';
            watchlistErrorMessage.style.color = '#4ADE80';
            watchlistErrorMessage.style.borderColor = '#0f3a27';
            
            // Reset the message after a delay
            setTimeout(() => {
              watchlistErrorMessage.style.display = 'none';
              watchlistErrorMessage.style.backgroundColor = 'rgba(248, 113, 113, 0.2)';
              watchlistErrorMessage.style.color = '#F87171';
              watchlistErrorMessage.style.borderColor = '#F87171';
            }, 3000);
            
            // Refresh the watchlist
            loadWatchlist();
          }
        });
      } else {
        watchlistErrorMessage.textContent = 'Error checking token: ' + (response?.error || 'Unknown error');
        watchlistErrorMessage.style.display = 'block';
      }
    });
  });
}

/**
 * Load watchlist from storage
 */
function loadWatchlist() {
  chrome.runtime.sendMessage(
    { action: 'getWatchlist' },
    function(response) {
      if (response && response.success) {
        displayWatchlist(response.watchlist);
      }
    }
  );
}

/**
 * Display watchlist in the UI
 */
function displayWatchlist(watchlist) {
  // Clear current watchlist completely
  const watchlistItems = watchlistContainer.querySelectorAll('.watchlist-item');
  watchlistItems.forEach(item => item.remove());
  
  // Show empty state if no watchlist
  if (!watchlist || watchlist.length === 0) {
    emptyWatchlist.style.display = 'block';
    return;
  }
  
  // Hide empty state
  emptyWatchlist.style.display = 'none';
  
  // Add watchlist items
  watchlist.forEach((token) => {
    const watchlistItem = document.createElement('div');
    watchlistItem.className = 'watchlist-item';
    
    const watchlistItemInfo = document.createElement('div');
    watchlistItemInfo.className = 'watchlist-item-info';
    
    const watchlistItemTitle = document.createElement('div');
    watchlistItemTitle.style.fontWeight = '500';
    watchlistItemTitle.style.fontSize = '14px';
    watchlistItemTitle.style.marginBottom = '4px';
    watchlistItemTitle.textContent = token.name || 'Unknown Token';
    
    // Add risk badge
    if (token.riskLevel) {
      const badgeSpan = document.createElement('span');
      badgeSpan.style.display = 'inline-block';
      badgeSpan.style.padding = '2px 4px';
      badgeSpan.style.borderRadius = '0';
      badgeSpan.style.fontSize = '10px';
      badgeSpan.style.color = 'white';
      badgeSpan.style.marginLeft = '6px';
      
      let badgeColor = '#6b7280';
      
      switch (token.riskLevel.toLowerCase()) {
        case 'safe':
          badgeColor = '#4ADE80';
          break;
        case 'warning':
          badgeColor = '#FACC15';
          break;
        case 'danger':
          badgeColor = '#F87171';
          break;
      }
      
      badgeSpan.style.backgroundColor = badgeColor;
      badgeSpan.textContent = token.riskLevel;
      
      watchlistItemTitle.appendChild(badgeSpan);
    }
    
    const watchlistItemAddress = document.createElement('div');
    watchlistItemAddress.style.fontFamily = 'monospace';
    watchlistItemAddress.style.fontSize = '12px';
    watchlistItemAddress.style.color = '#a3a3a3';
    watchlistItemAddress.textContent = token.address.slice(0, 10) + '...' + token.address.slice(-6);
    
    // Add token details
    const watchlistItemDetails = document.createElement('div');
    watchlistItemDetails.style.display = 'flex';
    watchlistItemDetails.style.gap = '8px';
    watchlistItemDetails.style.fontSize = '11px';
    watchlistItemDetails.style.color = '#a3a3a3';
    watchlistItemDetails.style.marginTop = '4px';
    
    let detailsText = '';
    if (token.symbol) detailsText += `${token.symbol} • `;
    if (token.riskScore !== undefined) detailsText += `Score: ${token.riskScore}`;
    if (token.grade) detailsText += ` • Grade: ${token.grade}`;
    
    watchlistItemDetails.textContent = detailsText;
    
    // Add last checked info
    if (token.lastChecked) {
      const lastCheckedSpan = document.createElement('span');
      lastCheckedSpan.style.marginLeft = 'auto';
      lastCheckedSpan.textContent = `Last updated: ${formatRelativeTime(token.lastChecked)}`;
      watchlistItemDetails.appendChild(lastCheckedSpan);
    }
    
    // Assemble info section
    watchlistItemInfo.appendChild(watchlistItemTitle);
    watchlistItemInfo.appendChild(watchlistItemAddress);
    watchlistItemInfo.appendChild(watchlistItemDetails);
    
    // Create actions section
    const watchlistActions = document.createElement('div');
    watchlistActions.className = 'watchlist-actions';
    
    const removeButton = document.createElement('button');
    removeButton.className = 'watchlist-action-button';
    removeButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `;
    
    removeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      chrome.runtime.sendMessage(
        { action: 'removeFromWatchlist', address: token.address },
        function(response) {
          if (response && response.success) {
            watchlistContainer.removeChild(watchlistItem);
            
            // Show empty state if no more items
            if (watchlistContainer.children.length === 1) {
              emptyWatchlist.style.display = 'block';
            }
          }
        }
      );
    });
    
    watchlistActions.appendChild(removeButton);
    
    // Handle clicking on a watchlist item
    watchlistItem.addEventListener('click', () => {
      tokenInput.value = token.address;
      
      // Switch to token checker tab
      tabButtons.forEach(btn => {
        if (btn.dataset.tab === 'checker') {
          btn.click();
        }
      });
      
      // Check the token
      checkCurrentUrl();
    });
    
    // Assemble watchlist item
    watchlistItem.appendChild(watchlistItemInfo);
    watchlistItem.appendChild(watchlistActions);
    
    // Add to container
    watchlistContainer.appendChild(watchlistItem);
  });
}

/**
 * Clear watchlist
 */
function clearWatchlist() {
  chrome.runtime.sendMessage(
    { action: 'clearWatchlist' },
    function(response) {
      if (response && response.success) {
        while (watchlistContainer.firstChild && watchlistContainer.firstChild !== emptyWatchlist) {
          watchlistContainer.removeChild(watchlistContainer.firstChild);
        }
        emptyWatchlist.style.display = 'block';
      }
    }
  );
}

/**
 * Check user auth status - simplified for no-login version
 */
async function checkAuthStatus() {
  // Always return authenticated status - no login required
  return { success: true, isAuthenticated: true };
}

/**
 * Get user data
 */
async function getUserData() {
  const token = await getStoredToken();
  if (!token) return;
  
  // This is a simple mock implementation
  // In a real extension, you would fetch this from your backend
  if (token.startsWith('wallet-')) {
    const walletType = token.replace('wallet-', '');
    userEmailElement.textContent = `${walletType.charAt(0).toUpperCase() + walletType.slice(1)} Wallet`;
    subscriptionBadgeElement.textContent = 'Premium';
    subscriptionBadgeElement.classList.add('premium');
  } else {
    userEmailElement.textContent = 'user@example.com';
    subscriptionBadgeElement.textContent = 'Free';
    subscriptionBadgeElement.classList.remove('premium');
  }
}

/**
 * Get stored token
 */
async function getStoredToken() {
  return new Promise(resolve => {
    chrome.storage.local.get(['authToken'], result => {
      resolve(result.authToken || null);
    });
  });
}

/**
 * Set stored token
 */
async function setStoredToken(token) {
  return new Promise(resolve => {
    chrome.storage.local.set({ authToken: token }, resolve);
  });
}

/**
 * Store token
 */
async function storeToken(token) {
  try {
    await setStoredToken(token);
    return true;
  } catch (error) {
    console.error('Error storing token:', error);
    return false;
  }
}

/**
 * Logout user - not needed in no-login version
 */
async function logout() {
  // No logout functionality needed
  return;
}

/**
 * Load and display usage statistics from local storage
 */
async function loadStats() {
  try {
    chrome.storage.local.get(['extensionStats'], function(result) {
      const stats = result.extensionStats || {
        tokensWatching: 0,
        alertsToday: 0,
        scansPerformed: 0,
        highRiskDetected: 0,
        lastResetDate: new Date().toDateString()
      };
      
      // Reset daily counters if it's a new day
      const today = new Date().toDateString();
      if (stats.lastResetDate !== today) {
        stats.alertsToday = 0;
        stats.lastResetDate = today;
        chrome.storage.local.set({ extensionStats: stats });
      }
      
      // Update the display
      document.getElementById('tokens-watching').textContent = stats.tokensWatching || 0;
      document.getElementById('alerts-today').textContent = stats.alertsToday || 0;
      document.getElementById('scans-performed').textContent = stats.scansPerformed || 0;
      document.getElementById('high-risk-detected').textContent = stats.highRiskDetected || 0;
    });
  } catch (error) {
    console.error('Error loading stats:', error);
    // Show zeros on error
    document.getElementById('tokens-watching').textContent = '0';
    document.getElementById('alerts-today').textContent = '0';
    document.getElementById('scans-performed').textContent = '0';
    document.getElementById('high-risk-detected').textContent = '0';
  }
}

/**
 * Load settings
 */
function loadSettings() {
  chrome.storage.local.get(['settings'], function(result) {
    const settings = result.settings || {
      notificationSounds: true,
      showBadge: true,
      autoScan: true
    };
    
    notificationSoundsCheckbox.checked = settings.notificationSounds;
    showBadgeCheckbox.checked = settings.showBadge;
    autoScanCheckbox.checked = settings.autoScan;
  });
}

/**
 * Save settings
 */
function saveSettings() {
  const settings = {
    notificationSounds: notificationSoundsCheckbox.checked,
    showBadge: showBadgeCheckbox.checked,
    autoScan: autoScanCheckbox.checked
  };
  
  chrome.storage.local.set({ settings });
  
  // Send message to content script to update badge visibility
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, { 
        action: 'updateSettings',
        settings: settings
      });
    }
  });
}

/**
 * Open a web page
 */
function openWebPage(url) {
  chrome.tabs.create({ url });
}

// Initialize the extension
document.addEventListener('DOMContentLoaded', function() {
  // Attach event listeners
  attachEventListeners();
  
  // Initialize extension
  init();
});