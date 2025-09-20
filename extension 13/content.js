// RugGuard Content Script
// This script injects risk analysis information into Solana explorer pages and displays a persistent badge

// Configuration
const API_URL = ;

// Add floating badge stylesheet
const badgeStylesheet = document.createElement('link');
badgeStylesheet.rel = 'stylesheet';
badgeStylesheet.href = chrome.runtime.getURL('floating-badge.css');
document.head.appendChild(badgeStylesheet);

const SUPPORTED_EXPLORERS = [
  {
    domain: "solscan.io",
    tokenAddressSelector: ".address-content:first-of-type",
    infoContainerSelector: ".card-body, .detail-content-item, .detail-item",
    injectionPoint: "afterend"
  },
  {
    domain: "solana.fm",
    tokenAddressSelector: ".address-details",
    infoContainerSelector: ".card, .account-details-card",
    injectionPoint: "beforeend"
  },
  {
    domain: "explorer.solana.com",
    tokenAddressSelector: ".sc-a44648b-0:contains('Address')",
    infoContainerSelector: ".sc-a44648b-0, .details-container",
    injectionPoint: "afterend"
  }
];

// Create and inject floating badge that persists on all web pages
function createFloatingBadge() {
  // Check if badge already exists
  if (document.querySelector('.rugguard-floating-badge')) return;
  
  // Create badge element
  const badge = document.createElement('div');
  badge.className = 'rugguard-floating-badge';
  
  // Set initial content
  badge.innerHTML = `<span class="icon">🛡️</span>RugGuard Active`;
  
  // Add to page
  document.body.appendChild(badge);
  
  // Check subscription status and update badge
  checkSubscriptionStatus().then(isPremium => {
    if (isPremium) {
      badge.classList.add('premium');
      badge.innerHTML = `<span class="icon">🛡️</span>RugGuard Premium`;
    }
  });
  
  // Add click handler to open popup
  badge.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'openPopup' });
  });
}

// Check if user has a premium subscription
async function checkSubscriptionStatus() {
  try {
    const token = await getStoredToken();
    if (!token) return false;
    
    // Check subscription status from background service
    return new Promise(resolve => {
      chrome.runtime.sendMessage(
        { action: 'getAuthStatus' },
        response => {
          resolve(response && response.subscription === 'premium');
        }
      );
    });
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
}

// Main functionality
async function init() {
  // Always create floating badge on every page
  createFloatingBadge();
  
  // Determine which explorer we're on
  const currentExplorer = SUPPORTED_EXPLORERS.find(explorer => 
    window.location.hostname.includes(explorer.domain)
  );
  
  if (!currentExplorer) return;
  
  // Extract token address
  const tokenAddressElement = document.querySelector(currentExplorer.tokenAddressSelector);
  if (!tokenAddressElement) return;
  
  // Extract the address (handling different explorer formats)
  let tokenAddress;
  if (currentExplorer.domain === "solscan.io") {
    tokenAddress = tokenAddressElement.textContent.trim();
  } else if (currentExplorer.domain === "solana.fm") {
    tokenAddress = tokenAddressElement.querySelector(".address-value").textContent.trim();
  } else {
    tokenAddress = tokenAddressElement.nextElementSibling.textContent.trim();
  }
  
  if (!tokenAddress) return;
  
  // Check if this is actually a token page (not a wallet or other type)
  if (!isTokenPage()) return;
  
  // Get token risk data
  const riskData = await getTokenRiskData(tokenAddress);
  if (!riskData) return;
  
  // Inject the risk information into the page
  injectRiskInfo(riskData, currentExplorer);
}

function isTokenPage() {
  // Simple check if we're on a token page
  return window.location.pathname.includes('/token/');
}

async function getTokenRiskData(address) {
  try {
    const token = await getStoredToken();
    
    const response = await fetch(`${API_URL}/api/token/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ address })
    });
    
    if (!response.ok) {
      console.error(`RugGuard API error: ${response.status}`);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('RugGuard error:', error);
    return null;
  }
}

function injectRiskInfo(riskData, explorer) {
  // Find where to inject our information
  const infoContainer = document.querySelector(explorer.infoContainerSelector);
  if (!infoContainer) return;
  
  // Create our risk information element
  const riskElement = document.createElement('div');
  riskElement.className = 'rugguard-risk-container';
  
  // Set the risk score color
  let riskClass = 'low-risk';
  if (riskData.riskScore >= 70) {
    riskClass = 'high-risk';
  } else if (riskData.riskScore >= 30) {
    riskClass = 'medium-risk';
  }
  
  // Subscription status
  const isPremium = riskData.isPremium || false;
  const subscriptionType = riskData.userSubscription || 'free';
  
  // Create HTML for the risk information
  riskElement.innerHTML = `
    <div class="rugguard-header">
      <div class="rugguard-logo"></div>
      <h3>RugGuard Risk Analysis</h3>
      ${isPremium ? '<div class="premium-badge">Premium</div>' : ''}
    </div>
    <div class="rugguard-score ${riskClass}">
      <div class="score-label">Risk Score</div>
      <div class="score-value">${riskData.riskScore || 0}</div>
    </div>
    <div class="rugguard-factors">
      <h4>Risk Factors</h4>
      <ul>
        ${riskData.riskFactors && riskData.riskFactors.length > 0 
          ? riskData.riskFactors.map(factor => 
              `<li class="${factor.severity.toLowerCase()}">${factor.description}</li>`
            ).join('')
          : '<li class="low">No risk factors detected</li>'
        }
      </ul>
      ${!isPremium ? `
        <div class="subscription-note">
          <p>You're viewing limited results with a free account.</p>
          <a href="${API_URL}/subscribe" target="_blank" class="upgrade-button">Upgrade to Premium</a>
        </div>
      ` : ''}
    </div>
    <div class="rugguard-footer">
      <a href="${API_URL}/token/${riskData.address}" target="_blank">View Full Report</a>
      ${isPremium ? '' : `<span class="free-badge">Free</span>`}
    </div>
  `;
  
  // Inject the element
  if (explorer.injectionPoint === 'afterend') {
    infoContainer.insertAdjacentElement('afterend', riskElement);
  } else {
    infoContainer.insertAdjacentElement('beforeend', riskElement);
  }
}

async function getStoredToken() {
  return new Promise(resolve => {
    chrome.storage.local.get(['authToken'], result => {
      resolve(result.authToken || null);
    });
  });
}

// Initialize when the page is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
