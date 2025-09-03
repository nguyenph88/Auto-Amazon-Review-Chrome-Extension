// Global variables
let currentRating = 0;
let isReviewPage = false;
let productData = null;

// Global DOM element references
let toggle;
let mainContent;
let disabledMessage;
let starRatingContainer;
let geminiBtn;
let wordheroBtn;
let productInfoContainer;
let productTitle;
let productImage;

// Function to display product information
function displayProductInfo(productInfo) {
    if (productInfo && productInfo.title && productInfo.imageUrl) {
        productData = productInfo;
        productTitle.textContent = productInfo.title;
        productImage.src = productInfo.imageUrl;
        productInfoContainer.style.display = 'flex';
        
        // Store product data for later use
        chrome.storage.sync.set({ productData: productInfo });
        
        console.log('Product info displayed:', productInfo);
    } else {
        console.error('Invalid product info received:', productInfo);
        productTitle.textContent = 'Product information not available';
        productImage.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjVGNUY1Ii8+Cjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC9mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+RXJyb3I8L3RleHQ+Cjwvc3ZnPgo=";
    }
}

// Function to check for pending product info
async function checkPendingProductInfo() {
    try {
        const result = await chrome.storage.local.get(['pendingProductInfo', 'timestamp']);
        if (result.pendingProductInfo && result.timestamp) {
            const age = Date.now() - result.timestamp;
            // Only use pending info if it's less than 5 minutes old
            if (age < 5 * 60 * 1000) {
                console.log('Found pending product info:', result.pendingProductInfo);
                displayProductInfo(result.pendingProductInfo);
                // Clear the pending info
                await chrome.storage.local.remove(['pendingProductInfo', 'timestamp']);
            } else {
                // Clear old pending info
                await chrome.storage.local.remove(['pendingProductInfo', 'timestamp']);
            }
        }
    } catch (error) {
        console.error('Error checking pending product info:', error);
    }
}

// Check if current page is an Amazon review page
async function checkCurrentPage() {
    try {
        const response = await chrome.runtime.sendMessage({ action: 'getCurrentTab' });
        if (response && response.isReviewPage) {
            isReviewPage = true;
            showReviewPageContent();
        } else {
            isReviewPage = false;
            showNonReviewPageContent();
        }
    } catch (error) {
        console.error('Error checking current page:', error);
        showNonReviewPageContent();
    }
}

function showReviewPageContent() {
    // Show the main review interface
    mainContent.style.display = 'block';
    disabledMessage.style.display = 'none';
    
    // Update title to indicate we're on a review page
    document.querySelector('.title').textContent = 'AI Review Assistant - Ready!';
    
    // Show product info section with initial message
    productInfoContainer.style.display = 'flex';
    productTitle.textContent = "Click 'Generate AI Review' on the review page to load product info";
    productImage.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjZjVmNWY1Ii8+Cjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Q2xpY2sgdG8gTG9hZDwvdGV4dD4KPC9zdmc+";
}

// Function to show loading state
function showLoadingState() {
    productTitle.textContent = "Loading product information...";
    productImage.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjZjVmNWY1Ii8+Cjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+TG9hZGluZy4uLjwvdGV4dD4KPC9zdmc+";
    productInfoContainer.style.display = 'flex';
}

function showNonReviewPageContent() {
    // Show message that extension is only available on review pages
    mainContent.style.display = 'none';
    disabledMessage.style.display = 'block';
    disabledMessage.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <h3>Extension Not Available</h3>
            <p>This extension only works on Amazon review pages.</p>
            <p>Please navigate to an Amazon product review page to use the AI Review Assistant.</p>
            <p style="font-size: 12px; color: #666;">
                Example: https://www.amazon.com/review/review-your-purchases/?asin=...
            </p>
        </div>
    `;
    
    // Update title
    document.querySelector('.title').textContent = 'AI Review Assistant';
    
    // Hide product info
    productInfoContainer.style.display = 'none';
}

// Initialize extension state
function initializeExtension() {
    chrome.storage.sync.get(['extensionEnabled', 'productData'], (result) => {
        const isEnabled = result.extensionEnabled !== false;
        toggle.checked = isEnabled;
        
        if (isEnabled) {
            checkCurrentPage();
            checkPendingProductInfo(); // Check for pending product info
        } else {
            updatePopupState(false);
        }

        if (result.productData && result.productData.title) {
            productData = result.productData;
            productTitle.textContent = result.productData.title;
            productImage.src = result.productData.imageUrl;
            productInfoContainer.style.display = 'flex';
        }
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    toggle = document.getElementById('extension-toggle');
    mainContent = document.getElementById('main-content');
    disabledMessage = document.getElementById('disabled-message');
    starRatingContainer = document.getElementById('star-rating');
    geminiBtn = document.getElementById('gemini-btn');
    wordheroBtn = document.getElementById('wordhero-btn');
    productInfoContainer = document.getElementById('product-info-container');
    productTitle = document.getElementById('product-title');
    productImage = document.getElementById('product-image');
  
  
    toggle.addEventListener('change', () => {
        const isEnabled = toggle.checked;
        chrome.storage.sync.set({ extensionEnabled: isEnabled });
        
        if (isEnabled) {
            initializeExtension(); // Re-initialize to check for product data
        } else {
            updatePopupState(false);
        }
    });

    starRatingContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('star')) {
            currentRating = parseInt(e.target.dataset.value, 10);
            starRatingContainer.dataset.rating = currentRating;
        }
    });

    geminiBtn.addEventListener('click', () => handleGeneration('gemini'));
    wordheroBtn.addEventListener('click', () => handleGeneration('wordhero'));

    function updatePopupState(isEnabled) {
        if (!isEnabled) {
            mainContent.style.display = 'none';
            disabledMessage.style.display = 'block';
            disabledMessage.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <h3>Extension Disabled</h3>
                    <p>Please enable the extension to use the AI Review Assistant.</p>
                </div>
            `;
        }
    }

    function handleGeneration(service) {
        if (currentRating === 0) {
            alert("Please select a star rating first.");
            return;
        }
        if (!isReviewPage) {
            alert("Please navigate to an Amazon review page to use this feature.");
            return;
        }
        chrome.runtime.sendMessage({
            action: "start_generation",
            data: {
                service: service,
                rating: currentRating,
                productData: productData
            }
        });
        window.close();
    }

    // Initialize the extension
    initializeExtension();

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'productInfoReceived') {
            console.log('Product info received:', request.productInfo);
            displayProductInfo(request.productInfo);
        } else if (request.action === 'productInfoError') {
            console.error('Product info error:', request.error);
            productTitle.textContent = 'Error loading product info: ' + request.error;
            productImage.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjVGNUY1Ii8+Cjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC9mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+RXJyb3I8L3RleHQ+Cjwvc3ZnPgo=";
        } else if (request.action === 'showLoading') {
            console.log('Showing loading state');
            showLoadingState();
        }
    });
});
  
  