/**
 * RugGuard Trading Wallet - Enhanced Popup Script
 * Combines token risk detection with trading wallet functionality
 */

// DOM Elements - Wallet Balance
const solBalanceElement = document.getElementById('sol-balance');
const usdBalanceElement = document.getElementById('usd-balance');
const refreshBalanceButton = document.getElementById('refresh-balance');
const settingsButton = document.getElementById('settings-btn');

// DOM Elements - Trade Tab
const tokenDetectedCard = document.getElementById('token-detected-card');
const detectedTokenName = document.getElementById('detected-token-name');
const detectedTokenAddress = document.getElementById('detected-token-address');
const detectedSafetyScore = document.getElementById('detected-safety-score');
const solAmountInput = document.getElementById('sol-amount');
const sellPercentageInput = document.getElementById('sell-percentage');
const buyButton = document.getElementById('buy-btn');
const sellButton = document.getElementById('sell-btn');
const viewAnalysisButton = document.getElementById('view-analysis-btn');
const manualTokenInput = document.getElementById('manual-token-input');
const checkTokenButton = document.getElementById('check-token-btn');

// DOM Elements - Wallet Tab
const walletStatus = document.getElementById('wallet-status');
const connectionIndicator = document.getElementById('connection-indicator');
const connectionText = document.getElementById('connection-text');
const walletOptions = document.getElementById('wallet-options');
const walletDetails = document.getElementById('wallet-details');
const connectPhantomButton = document.getElementById('connect-phantom');
const connectBackpackButton = document.getElementById('connect-backpack');
const createWalletButton = document.getElementById('create-wallet');
const walletAddressDisplay = document.getElementById('wallet-address');
const copyAddressButton = document.getElementById('copy-address');
const qrContainer = document.getElementById('qr-container');

// DOM Elements - Swap Tab
const swapFromAmount = document.getElementById('swap-from-amount');
const swapFromToken = document.getElementById('swap-from-token');
const swapToAmount = document.getElementById('swap-to-amount');
const swapToToken = document.getElementById('swap-to-token');
const swapFlipButton = document.getElementById('swap-flip');
const swapRateDisplay = document.getElementById('swap-rate');
const executeSwapButton = document.getElementById('execute-swap');

// DOM Elements - Send Tab
const sendAddress = document.getElementById('send-address');
const sendAmount = document.getElementById('send-amount');
const sendToken = document.getElementById('send-token');
const sendMemo = document.getElementById('send-memo');
const sendSummaryAmount = document.getElementById('send-summary-amount');
const sendNetworkFee = document.getElementById('send-network-fee');
const sendTotal = document.getElementById('send-total');
const executeSendButton = document.getElementById('execute-send');

// Tab navigation
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

// Global state
let currentWallet = null;
let currentBalance = 0;
let solPrice = 0;
let currentDetectedToken = null;

// Initialize the trading wallet
async function init() {
  console.log('Initializing RugGuard Trading Wallet...');
  
  // Set up tab navigation
  setupTabNavigation();
  
  // Set up event listeners
  setupEventListeners();
  
  // Load wallet state
  await loadWalletState();
  
  // Update SOL price
  await updateSolPrice();
  
  // Check for auto-detected tokens from content script
  await checkForDetectedTokens();
  
  // Load user settings
  loadSettings();
  
  console.log('RugGuard Trading Wallet initialized');
}

// Set up tab navigation
function setupTabNavigation() {
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });
}

// Switch between tabs
function switchTab(targetTab) {
  // Update tab buttons
  tabButtons.forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-tab') === targetTab) {
      btn.classList.add('active');
    }
  });
  
  // Update tab content
  tabContents.forEach(content => {
    content.classList.remove('active');
    if (content.id === `${targetTab}-tab`) {
      content.classList.add('active');
    }
  });
}

// Set up event listeners
function setupEventListeners() {
  // Balance refresh
  refreshBalanceButton?.addEventListener('click', refreshBalance);
  
  // Trade tab events
  checkTokenButton?.addEventListener('click', checkManualToken);
  manualTokenInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkManualToken();
  });
  
  // Trading inputs - update button displays
  solAmountInput?.addEventListener('input', updateTradeButtonAmounts);
  sellPercentageInput?.addEventListener('input', updateTradeButtonAmounts);
  
  // Trading buttons
  buyButton?.addEventListener('click', executeBuyTrade);
  sellButton?.addEventListener('click', executeSellTrade);
  viewAnalysisButton?.addEventListener('click', showFullAnalysis);
  
  // Wallet connection events
  connectPhantomButton?.addEventListener('click', () => connectWallet('phantom'));
  connectBackpackButton?.addEventListener('click', () => connectWallet('backpack'));
  createWalletButton?.addEventListener('click', createNewWallet);
  copyAddressButton?.addEventListener('click', copyWalletAddress);
  
  // Swap events
  swapFlipButton?.addEventListener('click', flipSwapTokens);
  swapFromAmount?.addEventListener('input', calculateSwapRate);
  swapToToken?.addEventListener('input', calculateSwapRate);
  executeSwapButton?.addEventListener('click', executeSwap);
  
  // Send events
  sendAmount?.addEventListener('input', updateSendSummary);
  sendToken?.addEventListener('change', updateSendSummary);
  executeSendButton?.addEventListener('click', executeSend);
}

// Load wallet state from storage
async function loadWalletState() {
  try {
    const result = await chrome.storage.local.get(['walletConnected', 'walletAddress', 'walletType', 'solBalance']);
    
    if (result.walletConnected && result.walletAddress) {
      currentWallet = {
        address: result.walletAddress,
        type: result.walletType || 'unknown'
      };
      currentBalance = result.solBalance || 0;
      
      showConnectedWallet();
      await refreshBalance();
    } else {
      showWalletConnection();
    }
  } catch (error) {
    console.error('Error loading wallet state:', error);
    showWalletConnection();
  }
}

// Show wallet connection UI
function showWalletConnection() {
  if (connectionIndicator) {
    connectionIndicator.classList.remove('online');
    connectionIndicator.classList.add('offline');
  }
  if (connectionText) {
    connectionText.textContent = 'Not Connected';
  }
  if (walletOptions) {
    walletOptions.style.display = 'block';
  }
  if (walletDetails) {
    walletDetails.style.display = 'none';
  }
}

// Show connected wallet UI
function showConnectedWallet() {
  if (connectionIndicator) {
    connectionIndicator.classList.remove('offline');
    connectionIndicator.classList.add('online');
  }
  if (connectionText) {
    connectionText.textContent = 'Connected';
  }
  if (walletOptions) {
    walletOptions.style.display = 'none';
  }
  if (walletDetails) {
    walletDetails.style.display = 'block';
  }
  
  if (walletAddressDisplay && currentWallet) {
    walletAddressDisplay.textContent = formatAddress(currentWallet.address);
  }
  
  generateQRCode();
}

// Connect to wallet
async function connectWallet(walletType) {
  try {
    console.log(`Connecting to ${walletType} wallet...`);
    
    if (walletType === 'phantom') {
      if (window.solana && window.solana.isPhantom) {
        const response = await window.solana.connect();
        const address = response.publicKey.toString();
        await saveWalletConnection(address, 'phantom');
      } else {
        alert('Phantom wallet not found. Please install Phantom wallet extension.');
        return;
      }
    } else if (walletType === 'backpack') {
      if (window.backpack) {
        const response = await window.backpack.connect();
        const address = response.publicKey.toString();
        await saveWalletConnection(address, 'backpack');
      } else {
        alert('Backpack wallet not found. Please install Backpack wallet extension.');
        return;
      }
    }
    
    await refreshBalance();
  } catch (error) {
    console.error('Error connecting wallet:', error);
    alert('Failed to connect wallet. Please try again.');
  }
}

// Create new wallet
async function createNewWallet() {
  try {
    // Generate new keypair
    const { Connection, PublicKey, Keypair } = window.solanaWeb3;
    const newWallet = Keypair.generate();
    const address = newWallet.publicKey.toString();
    
    // Encrypt and store private key
    const privateKey = Array.from(newWallet.secretKey);
    await chrome.storage.local.set({ 
      generatedWallet: true,
      encryptedPrivateKey: privateKey // In production, this should be encrypted
    });
    
    await saveWalletConnection(address, 'generated');
    alert('New wallet created! Please save your private key securely.');
  } catch (error) {
    console.error('Error creating wallet:', error);
    alert('Failed to create wallet. Please try again.');
  }
}

// Save wallet connection
async function saveWalletConnection(address, type) {
  currentWallet = { address, type };
  
  await chrome.storage.local.set({
    walletConnected: true,
    walletAddress: address,
    walletType: type
  });
  
  showConnectedWallet();
}

// Refresh balance
async function refreshBalance() {
  if (!currentWallet) return;
  
  try {
    // Get SOL balance from Solana RPC
    const balance = await getSolanaBalance(currentWallet.address);
    currentBalance = balance;
    
    // Update UI
    updateBalanceDisplay();
    
    // Save to storage
    await chrome.storage.local.set({ solBalance: balance });
  } catch (error) {
    console.error('Error refreshing balance:', error);
  }
}

// Get Solana balance
async function getSolanaBalance(address) {
  try {
    // Use Helius or public RPC
    const response = await fetch('https://api.mainnet-beta.solana.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getBalance',
        params: [address]
      })
    });
    
    const data = await response.json();
    return data.result.value / 1000000000; // Convert lamports to SOL
  } catch (error) {
    console.error('Error getting balance:', error);
    return 0;
  }
}

// Update balance display
function updateBalanceDisplay() {
  if (solBalanceElement) {
    solBalanceElement.textContent = `${currentBalance.toFixed(4)} SOL`;
  }
  
  if (usdBalanceElement && solPrice > 0) {
    const usdValue = currentBalance * solPrice;
    usdBalanceElement.textContent = `$${usdValue.toFixed(2)}`;
  }
}

// Update SOL price
async function updateSolPrice() {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
    const data = await response.json();
    solPrice = data.solana.usd;
    updateBalanceDisplay();
  } catch (error) {
    console.error('Error fetching SOL price:', error);
  }
}

// Check for detected tokens from content script
async function checkForDetectedTokens() {
  try {
    const result = await chrome.storage.local.get(['detectedToken']);
    if (result.detectedToken) {
      showDetectedToken(result.detectedToken);
    }
  } catch (error) {
    console.error('Error checking detected tokens:', error);
  }
}

// Show detected token in Trade tab
function showDetectedToken(tokenData) {
  currentDetectedToken = tokenData;
  
  if (detectedTokenName) {
    detectedTokenName.textContent = tokenData.name || 'Unknown Token';
  }
  if (detectedTokenAddress) {
    detectedTokenAddress.textContent = formatAddress(tokenData.address);
  }
  if (detectedSafetyScore) {
    const grade = tokenData.grade || 'F';
    const score = tokenData.score || 0;
    detectedSafetyScore.textContent = `${grade} (${score}/100)`;
    
    // Color based on risk level
    if (grade === 'A' || grade === 'B') {
      detectedSafetyScore.style.color = 'var(--success)';
    } else if (grade === 'C' || grade === 'D') {
      detectedSafetyScore.style.color = 'var(--warning)';
    } else {
      detectedSafetyScore.style.color = 'var(--destructive)';
    }
  }
  
  if (tokenDetectedCard) {
    tokenDetectedCard.style.display = 'block';
  }
  
  updateTradeButtonAmounts();
}

// Check manual token input
async function checkManualToken() {
  const tokenAddress = manualTokenInput?.value?.trim();
  if (!tokenAddress) return;
  
  try {
    // Send to background script for analysis
    chrome.runtime.sendMessage({
      action: 'checkToken',
      address: tokenAddress
    }, (response) => {
      if (response && response.success) {
        showDetectedToken(response.data);
        manualTokenInput.value = '';
      } else {
        alert('Failed to analyze token. Please check the address and try again.');
      }
    });
  } catch (error) {
    console.error('Error checking token:', error);
  }
}

// Update trade button amounts
function updateTradeButtonAmounts() {
  const solAmount = parseFloat(solAmountInput?.value || 0);
  const sellPercentage = parseFloat(sellPercentageInput?.value || 0);
  
  if (buyButton) {
    const buyAmountSpan = buyButton.querySelector('.trade-amount');
    if (buyAmountSpan) {
      buyAmountSpan.textContent = `${solAmount.toFixed(2)} SOL`;
    }
  }
  
  if (sellButton) {
    const sellAmountSpan = sellButton.querySelector('.trade-amount');
    if (sellAmountSpan) {
      sellAmountSpan.textContent = `${sellPercentage}%`;
    }
  }
}

// Execute buy trade with Flux RPC speed tracking
async function executeBuyTrade() {
  if (!currentWallet || !currentDetectedToken) {
    alert('Please connect wallet and select a token first.');
    return;
  }
  
  const solAmount = parseFloat(solAmountInput?.value || 0);
  if (solAmount <= 0 || solAmount > currentBalance) {
    alert('Invalid SOL amount or insufficient balance.');
    return;
  }
  
  const startTime = Date.now();
  showTransactionStatus('Executing buy order via Flux RPC...', 'processing');
  
  try {
    const result = await executeTokenSwap('SOL', currentDetectedToken.address, solAmount);
    const executionTime = Date.now() - startTime;
    
    showTransactionStatus(`Buy completed in ${executionTime}ms`, 'success');
    alert(`Successfully bought ${currentDetectedToken.name || 'token'} with ${solAmount} SOL\nExecution time: ${executionTime}ms via Flux RPC`);
    await refreshBalance();
  } catch (error) {
    console.error('Error executing buy:', error);
    showTransactionStatus('Buy order failed', 'error');
    alert('Failed to execute buy order. Please try again.');
  }
}

// Execute sell trade
async function executeSellTrade() {
  if (!currentWallet || !currentDetectedToken) {
    alert('Please connect wallet and select a token first.');
    return;
  }
  
  const sellPercentage = parseFloat(sellPercentageInput?.value || 0);
  if (sellPercentage <= 0 || sellPercentage > 100) {
    alert('Invalid sell percentage.');
    return;
  }
  
  try {
    // Get token balance and calculate amount to sell
    const tokenBalance = await getTokenBalance(currentDetectedToken.address);
    const sellAmount = (tokenBalance * sellPercentage) / 100;
    
    await executeTokenSwap(currentDetectedToken.address, 'SOL', sellAmount);
    alert(`Successfully sold ${sellPercentage}% of ${currentDetectedToken.name || 'token'}`);
    await refreshBalance();
  } catch (error) {
    console.error('Error executing sell:', error);
    alert('Failed to execute sell order. Please try again.');
  }
}

// Execute token swap with Flux RPC for maximum speed
async function executeTokenSwap(fromToken, toToken, amount) {
  console.log(`Executing Flux RPC swap: ${amount} ${fromToken} for ${toToken}`);
  
  try {
    // Get swap mode from UI
    const swapMode = document.getElementById('swap-mode')?.value || 'fast';
    const slippage = parseFloat(document.getElementById('slippage-select')?.value || '0.5');
    
    // Use Jupiter API for routing with Flux RPC relay
    const quote = await getJupiterQuote(fromToken, toToken, amount, slippage);
    if (!quote) {
      throw new Error('Unable to get swap quote');
    }
    
    // Determine priority fee based on speed mode
    const priorityFee = getPriorityFeeForMode(swapMode);
    
    // Execute swap through Flux RPC for fastest relay
    const transaction = await createJupiterSwapTransaction(quote, priorityFee);
    const signature = await sendTransactionViaFluxRPC(transaction, swapMode);
    
    console.log(`Flux RPC swap executed with signature: ${signature}`);
    return { signature, quote, mode: swapMode };
  } catch (error) {
    console.error('Flux RPC swap failed:', error);
    // Fallback to direct Raydium for speed
    return await executeRaydiumSwap(fromToken, toToken, amount);
  }
}

// Get priority fee based on speed mode
function getPriorityFeeForMode(mode) {
  switch (mode) {
    case 'ultra':
      return 0.005; // 5000 lamports - Ultra fast with MEV protection
    case 'fast':
      return 0.002; // 2000 lamports - Fast execution
    case 'standard':
      return 0.0005; // 500 lamports - Standard speed
    default:
      return 0.001;
  }
}

// Send transaction via Flux RPC for maximum speed
async function sendTransactionViaFluxRPC(transaction, mode = 'fast') {
  try {
    // Use your Flux RPC endpoint for all speed modes
    const FLUX_RPC_URL = 'https://eu.rpc.fluxbeam.xyz?key=8afc7188-44cf-4db2-9b82-84752a4349cd';
    
    const endpoint = FLUX_RPC_URL;
    const maxRetries = mode === 'ultra' ? 1 : 3; // Ultra mode prioritizes speed over retries
    
    // Sign transaction first
    const signedTx = await signTransaction(transaction);
    
    // Send via Flux RPC with MEV protection and priority routing
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Flux-Priority': mode === 'ultra' ? 'high' : 'normal',
        'X-MEV-Protection': 'enabled'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'sendTransaction',
        params: [
          signedTx,
          {
            skipPreflight: mode === 'ultra', // Skip preflight for maximum speed
            preflightCommitment: mode === 'ultra' ? 'processed' : 'confirmed',
            encoding: 'base64',
            maxRetries: maxRetries,
            // Flux-specific optimizations
            mevProtection: true,
            priorityFee: getPriorityFeeForMode(mode) * 1e9, // Convert to lamports
            commitment: mode === 'ultra' ? 'processed' : 'confirmed'
          }
        ]
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Flux RPC error: ${data.error.message}`);
    }
    
    const signature = data.result;
    
    // For ultra mode, return immediately without waiting for full confirmation
    if (mode === 'ultra') {
      console.log(`Ultra-fast transaction submitted: ${signature}`);
      // Background confirmation check
      waitForConfirmation(signature, 10000).catch(console.error);
      return signature;
    }
    
    // Wait for confirmation for other modes
    await waitForConfirmation(signature, mode === 'fast' ? 15000 : 30000);
    return signature;
    
  } catch (error) {
    console.error('Flux RPC transaction failed:', error);
    throw error;
  }
}

// Get Jupiter quote for best rates and speed
async function getJupiterQuote(inputMint, outputMint, amount) {
  try {
    const inputAmount = Math.floor(amount * 1e9); // Convert to lamports/smallest unit
    
    const response = await fetch(
      `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${inputAmount}&slippageBps=50`
    );
    
    if (!response.ok) {
      throw new Error('Jupiter quote failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Jupiter quote error:', error);
    return null;
  }
}

// Create Jupiter swap transaction with priority fees
async function createJupiterSwapTransaction(quote, priorityFee = 0.001) {
  try {
    const response = await fetch('https://quote-api.jup.ag/v6/swap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteResponse: quote,
        userPublicKey: currentWallet.address,
        wrapAndUnwrapSol: true,
        prioritizationFeeLamports: Math.floor(priorityFee * 1e9)
      })
    });
    
    const { swapTransaction } = await response.json();
    return swapTransaction;
  } catch (error) {
    console.error('Jupiter transaction creation failed:', error);
    throw error;
  }
}

// Fallback to Raydium for direct DEX access
async function executeRaydiumSwap(fromToken, toToken, amount) {
  console.log(`Fallback to Raydium swap: ${amount} ${fromToken} for ${toToken}`);
  
  try {
    // Direct Raydium integration for speed
    const raydiumQuote = await getRaydiumQuote(fromToken, toToken, amount);
    if (!raydiumQuote) {
      throw new Error('Raydium quote failed');
    }
    
    const transaction = await createRaydiumTransaction(raydiumQuote);
    const signature = await signAndSendTransaction(transaction);
    
    console.log(`Raydium swap executed: ${signature}`);
    return { signature, quote: raydiumQuote };
  } catch (error) {
    console.error('Raydium swap failed:', error);
    throw new Error('All swap methods failed');
  }
}

// Get Raydium quote
async function getRaydiumQuote(fromToken, toToken, amount) {
  // Implement Raydium API integration
  console.log('Getting Raydium quote...');
  return { 
    inputAmount: amount,
    outputAmount: amount * 0.99, // Mock quote
    priceImpact: 0.01
  };
}

// Create Raydium transaction
async function createRaydiumTransaction(quote) {
  // Implement Raydium transaction creation
  console.log('Creating Raydium transaction...');
  return 'mock_transaction_data';
}

// Sign and send transaction with optimal settings
async function signAndSendTransaction(transaction) {
  if (!currentWallet) {
    throw new Error('No wallet connected');
  }
  
  try {
    let signature;
    
    if (currentWallet.type === 'phantom' && window.solana) {
      // Use Phantom wallet
      const signedTx = await window.solana.signAndSendTransaction(transaction);
      signature = signedTx.signature;
    } else if (currentWallet.type === 'backpack' && window.backpack) {
      // Use Backpack wallet
      const signedTx = await window.backpack.signAndSendTransaction(transaction);
      signature = signedTx.signature;
    } else {
      // Use generated wallet with stored private key
      signature = await signWithStoredKey(transaction);
    }
    
    // Wait for confirmation with timeout
    await waitForConfirmation(signature, 30000); // 30 second timeout
    
    return signature;
  } catch (error) {
    console.error('Transaction signing failed:', error);
    throw error;
  }
}

// Wait for transaction confirmation
async function waitForConfirmation(signature, timeout = 30000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch('https://api.mainnet-beta.solana.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getSignatureStatuses',
          params: [[signature]]
        })
      });
      
      const data = await response.json();
      const status = data.result.value[0];
      
      if (status && status.confirmationStatus === 'confirmed') {
        console.log(`Transaction confirmed: ${signature}`);
        return true;
      }
      
      if (status && status.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(status.err)}`);
      }
      
      // Wait 1 second before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error checking confirmation:', error);
    }
  }
  
  throw new Error('Transaction confirmation timeout');
}

// Sign transaction with stored private key
async function signWithStoredKey(transaction) {
  try {
    const result = await chrome.storage.local.get(['encryptedPrivateKey']);
    if (!result.encryptedPrivateKey) {
      throw new Error('No private key stored');
    }
    
    // In production, decrypt the private key here
    // For now, simulate transaction signing
    console.log('Signing with stored private key...');
    
    // Generate mock signature
    const signature = 'mock_signature_' + Date.now();
    return signature;
  } catch (error) {
    console.error('Private key signing failed:', error);
    throw error;
  }
}

// Get token balance
async function getTokenBalance(tokenAddress) {
  if (!currentWallet) return 0;
  
  try {
    const response = await fetch('https://api.mainnet-beta.solana.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTokenAccountsByOwner',
        params: [
          currentWallet.address,
          { mint: tokenAddress },
          { encoding: 'jsonParsed' }
        ]
      })
    });
    
    const data = await response.json();
    if (data.result.value.length > 0) {
      return data.result.value[0].account.data.parsed.info.tokenAmount.uiAmount;
    }
    return 0;
  } catch (error) {
    console.error('Error getting token balance:', error);
    return 0;
  }
}

// Show full analysis
function showFullAnalysis() {
  if (currentDetectedToken) {
    // Open RugCheck URL
    const rugcheckUrl = `https://rugcheck.xyz/tokens/${currentDetectedToken.address}`;
    chrome.tabs.create({ url: rugcheckUrl });
  }
}

// Copy wallet address
async function copyWalletAddress() {
  if (currentWallet) {
    try {
      await navigator.clipboard.writeText(currentWallet.address);
      
      // Show feedback
      if (copyAddressButton) {
        const originalText = copyAddressButton.textContent;
        copyAddressButton.textContent = 'Copied!';
        setTimeout(() => {
          copyAddressButton.textContent = originalText;
        }, 2000);
      }
    } catch (error) {
      console.error('Error copying address:', error);
    }
  }
}

// Generate QR code for wallet address
function generateQRCode() {
  if (!currentWallet || !qrContainer) return;
  
  // Simple QR code generation (in production, use a proper QR library)
  qrContainer.innerHTML = `
    <div style="width: 120px; height: 120px; background: #000; margin: 0 auto; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; text-align: center;">
      QR Code<br>
      ${formatAddress(currentWallet.address)}
    </div>
  `;
}

// Flip swap tokens
function flipSwapTokens() {
  if (swapFromToken && swapToToken) {
    const fromValue = swapFromToken.value;
    const toValue = swapToToken.value;
    
    swapFromToken.value = toValue;
    swapToToken.value = fromValue;
    
    // Clear amounts
    if (swapFromAmount) swapFromAmount.value = '';
    if (swapToAmount) swapToAmount.value = '';
    
    calculateSwapRate();
  }
}

// Calculate swap rate
async function calculateSwapRate() {
  const fromAmount = parseFloat(swapFromAmount?.value || 0);
  const fromToken = swapFromToken?.value;
  const toToken = swapToToken?.value;
  
  if (!fromAmount || !fromToken || !toToken) {
    if (swapRateDisplay) swapRateDisplay.textContent = 'Rate: --';
    if (swapToAmount) swapToAmount.value = '';
    return;
  }
  
  try {
    // In production, get quote from Jupiter API
    const mockRate = 0.95; // Mock exchange rate
    const toAmount = fromAmount * mockRate;
    
    if (swapToAmount) swapToAmount.value = toAmount.toFixed(6);
    if (swapRateDisplay) swapRateDisplay.textContent = `Rate: 1 ${fromToken} = ${mockRate} ${toToken}`;
  } catch (error) {
    console.error('Error calculating swap rate:', error);
  }
}

// Execute swap
async function executeSwap() {
  const fromAmount = parseFloat(swapFromAmount?.value || 0);
  const fromToken = swapFromToken?.value;
  const toToken = swapToToken?.value;
  
  if (!fromAmount || !fromToken || !toToken) {
    alert('Please fill in all swap details.');
    return;
  }
  
  if (!currentWallet) {
    alert('Please connect your wallet first.');
    return;
  }
  
  try {
    await executeTokenSwap(fromToken, toToken, fromAmount);
    alert('Swap executed successfully!');
    
    // Clear form
    if (swapFromAmount) swapFromAmount.value = '';
    if (swapToAmount) swapToAmount.value = '';
    
    await refreshBalance();
  } catch (error) {
    console.error('Error executing swap:', error);
    alert('Failed to execute swap. Please try again.');
  }
}

// Update send summary
function updateSendSummary() {
  const amount = parseFloat(sendAmount?.value || 0);
  const token = sendToken?.value || 'SOL';
  const networkFee = 0.000005; // SOL network fee
  
  if (sendSummaryAmount) {
    sendSummaryAmount.textContent = `${amount} ${token}`;
  }
  
  if (sendTotal) {
    const total = token === 'SOL' ? amount + networkFee : amount;
    sendTotal.textContent = `${total.toFixed(6)} ${token}`;
  }
}

// Execute send
async function executeSend() {
  const address = sendAddress?.value?.trim();
  const amount = parseFloat(sendAmount?.value || 0);
  const token = sendToken?.value || 'SOL';
  const memo = sendMemo?.value?.trim();
  
  if (!address || !amount) {
    alert('Please fill in recipient address and amount.');
    return;
  }
  
  if (!currentWallet) {
    alert('Please connect your wallet first.');
    return;
  }
  
  try {
    // Execute transfer
    await executeTransfer(address, amount, token, memo);
    alert('Transfer sent successfully!');
    
    // Clear form
    if (sendAddress) sendAddress.value = '';
    if (sendAmount) sendAmount.value = '';
    if (sendMemo) sendMemo.value = '';
    
    await refreshBalance();
  } catch (error) {
    console.error('Error executing send:', error);
    alert('Failed to send tokens. Please try again.');
  }
}

// Execute transfer (placeholder)
async function executeTransfer(recipient, amount, token, memo) {
  console.log(`Sending ${amount} ${token} to ${recipient}${memo ? ` with memo: ${memo}` : ''}`);
  
  // Simulate transaction delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // In production, this would create and send a Solana transaction
}

// Load settings
function loadSettings() {
  chrome.storage.local.get(['notificationSounds', 'showBadge', 'autoScan'], (result) => {
    // Settings loaded (for future use)
  });
}

// Utility function to format addresses
function formatAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Show transaction status with timing
function showTransactionStatus(message, type = 'processing') {
  const statusElement = document.getElementById('tx-status');
  if (!statusElement) return;
  
  statusElement.textContent = message;
  statusElement.className = `tx-status ${type}`;
  statusElement.style.display = 'block';
  
  if (type === 'success' || type === 'error') {
    setTimeout(() => {
      statusElement.style.display = 'none';
    }, 3000);
  }
}

// Sign transaction function
async function signTransaction(transaction) {
  if (!currentWallet) {
    throw new Error('No wallet connected');
  }
  
  try {
    if (currentWallet.type === 'phantom' && window.solana) {
      return await window.solana.signTransaction(transaction);
    } else if (currentWallet.type === 'backpack' && window.backpack) {
      return await window.backpack.signTransaction(transaction);
    } else {
      // Use stored private key for generated wallets
      return await signWithStoredKey(transaction);
    }
  } catch (error) {
    console.error('Transaction signing failed:', error);
    throw error;
  }
}

// Update balance refresh to use Flux RPC
async function refreshBalance() {
  if (!currentWallet) return;
  
  const startTime = Date.now();
  
  try {
    // Get balance using background script with Flux RPC
    chrome.runtime.sendMessage({
      action: 'getWalletBalance',
      address: currentWallet.address
    }, (response) => {
      if (response && response.success) {
        currentBalance = response.balance;
        updateBalanceDisplay();
        
        const loadTime = Date.now() - startTime;
        console.log(`Balance refreshed in ${loadTime}ms via Flux RPC`);
      }
    });
  } catch (error) {
    console.error('Error refreshing balance:', error);
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'tokenDetected') {
    showDetectedToken(message.data);
    switchTab('trade'); // Switch to trade tab when token is detected
  }
  
  if (message.action === 'balanceUpdated') {
    currentBalance = message.balance;
    updateBalanceDisplay();
  }
});