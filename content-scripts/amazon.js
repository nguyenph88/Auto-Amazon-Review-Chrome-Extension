// AI Review Assistant Content Script for Amazon Review Pages
console.log("AI Review Assistant: Content script loaded on:", window.location.href);

// Check if this is an Amazon review page
function isReviewPage() {
  const url = window.location.href;
  return url.includes('amazon.com/review/') || url.includes('review-your-purchases');
}

// Function to extract ASIN from URL
function extractASIN() {
  try {
    const url = window.location.href;
    const urlObj = new URL(url);
    const asin = urlObj.searchParams.get('asin');
    if (asin) {
      console.log("AI Review Assistant: ASIN extracted using URLSearchParams:", asin);
      return asin;
    }
  } catch (error) {
    console.error("AI Review Assistant: Error extracting ASIN:", error);
  }
  
  // Fallback to regex if URLSearchParams fails
  const url = window.location.href;
  const asinMatch = url.match(/[?&]asin=([A-Z0-9]+)/);
  if (asinMatch && asinMatch[1]) {
    console.log("AI Review Assistant: ASIN extracted using regex fallback:", asinMatch[1]);
    return asinMatch[1];
  }
  
  return null;
}

// Function to inject the AI review button
function injectAIReviewButton() {
  // Check if buttons already exist
  if (document.getElementById('ai-review-button') || document.getElementById('fill-button')) {
    return;
  }

  // Look for the specific review textarea first
  const reviewTextarea = document.querySelector('textarea#reviewText[name="reviewText"]');
  
  if (reviewTextarea) {
    console.log("AI Review Assistant: Found review textarea, injecting button");
    
    // Create the AI review button
    const aiButton = document.createElement('button');
    aiButton.innerHTML = '🤖 Generate AI Review';
    aiButton.id = 'ai-review-button';
    aiButton.className = 'ai-review-btn';
    aiButton.type = 'button'; // Ensure it's not a submit button
    aiButton.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 10px 16px;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      margin: 8px 8px 8px 0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
      display: inline-block;
      vertical-align: top;
    `;

    // Add hover effects for AI button
    aiButton.addEventListener('mouseenter', () => {
      aiButton.style.transform = 'translateY(-1px)';
      aiButton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    });

    aiButton.addEventListener('mouseleave', () => {
      aiButton.style.transform = 'translateY(0)';
      aiButton.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    });

    // Add click handler for AI button
    aiButton.addEventListener('click', (event) => {
      console.log("AI Review Assistant: Generate AI Review button clicked");
      
      // Prevent form submission and default behavior
      event.preventDefault();
      event.stopPropagation();
      
      // Extract ASIN from URL
      const asin = extractASIN();
      if (asin) {
        console.log("AI Review Assistant: ASIN extracted:", asin);
        
        // Open the popup and send message to it
        chrome.runtime.sendMessage({
          action: 'openPopupAndLoadProduct',
          asin: asin
        }).catch(error => {
          console.error("AI Review Assistant: Error sending message:", error);
        });
      } else {
        alert("Could not extract product ASIN from URL");
      }
    });

    // Create the Fill button
    const fillButton = document.createElement('button');
    fillButton.innerHTML = '📋 Fill';
    fillButton.id = 'fill-button';
    fillButton.className = 'fill-btn';
    fillButton.type = 'button';
    fillButton.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 10px 16px;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      margin: 8px 0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
      display: inline-block;
      vertical-align: top;
    `;

    // Add hover effects for Fill button
    fillButton.addEventListener('mouseenter', () => {
      fillButton.style.transform = 'translateY(-1px)';
      fillButton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    });

    fillButton.addEventListener('mouseleave', () => {
      fillButton.style.transform = 'translateY(0)';
      fillButton.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    });

    // Add click handler for Fill button
    fillButton.addEventListener('click', async (event) => {
      console.log("AI Review Assistant: Fill button clicked");
      
      // Prevent form submission and default behavior
      event.preventDefault();
      event.stopPropagation();
      
      try {
        // Get text from clipboard
        const clipboardText = await navigator.clipboard.readText();
        
        if (clipboardText) {
          // Fill the textarea with clipboard content
          reviewTextarea.value = clipboardText;
          
          // Trigger input event to ensure any listeners are notified
          reviewTextarea.dispatchEvent(new Event('input', { bubbles: true }));
          reviewTextarea.dispatchEvent(new Event('change', { bubbles: true }));
          
          console.log("AI Review Assistant: Text pasted from clipboard to textarea");
        } else {
          alert("No text found in clipboard. Please copy some text first.");
        }
      } catch (error) {
        console.error("AI Review Assistant: Error reading clipboard:", error);
        alert("Error reading clipboard. Please make sure you have copied some text.");
      }
    });

    // Create a container div to hold both the textarea and button
    const container = document.createElement('div');
    container.style.cssText = `
      position: relative;
      margin-bottom: 15px;
    `;
    
    // Insert the container before the textarea
    reviewTextarea.parentNode.insertBefore(container, reviewTextarea);
    
    // Move the textarea into the container
    container.appendChild(reviewTextarea);
    
    // Add both buttons below the textarea
    container.appendChild(aiButton);
    container.appendChild(fillButton);
    
    console.log("AI Review Assistant: Button injected successfully near textarea");
    return;
  }

  // Fallback: Look for the review form or rating section
  const targetSelectors = [
    'div[data-hook="ryp-review-text-input"]',
    'div[data-hook="ryp-star-rating-card"]',
    '#ryp-review-your-purchases-form',
    'form',
    '.ryp-review-form'
  ];

  let targetContainer = null;
  for (const selector of targetSelectors) {
    targetContainer = document.querySelector(selector);
    if (targetContainer) {
      console.log("AI Review Assistant: Found fallback target container:", selector);
      break;
    }
  }

  if (targetContainer) {
    // Create a button container for both buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 10px;
      margin: 15px 0;
    `;

    // Create the AI review button
    const aiButton = document.createElement('button');
    aiButton.innerHTML = '🤖 Generate AI Review';
    aiButton.id = 'ai-review-button';
    aiButton.className = 'ai-review-btn';
    aiButton.type = 'button'; // Ensure it's not a submit button
    aiButton.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 20px;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      flex: 1;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
    `;

    // Add hover effects for AI button
    aiButton.addEventListener('mouseenter', () => {
      aiButton.style.transform = 'translateY(-2px)';
      aiButton.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
    });

    aiButton.addEventListener('mouseleave', () => {
      aiButton.style.transform = 'translateY(0)';
      aiButton.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
    });

    // Add click handler for AI button
    aiButton.addEventListener('click', (event) => {
      console.log("AI Review Assistant: Generate AI Review button clicked");
      
      // Prevent form submission and default behavior
      event.preventDefault();
      event.stopPropagation();
      
      // Extract ASIN from URL
      const asin = extractASIN();
      if (asin) {
        console.log("AI Review Assistant: ASIN extracted:", asin);
        
        // Open the popup and send message to it
        chrome.runtime.sendMessage({
          action: 'openPopupAndLoadProduct',
          asin: asin
        }).catch(error => {
          console.error("AI Review Assistant: Error sending message:", error);
        });
      } else {
        alert("Could not extract product ASIN from URL");
      }
    });

    // Create the Fill button
    const fillButton = document.createElement('button');
    fillButton.innerHTML = '📋 Fill';
    fillButton.id = 'fill-button';
    fillButton.className = 'fill-btn';
    fillButton.type = 'button';
    fillButton.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 20px;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      flex: 1;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
    `;

    // Add hover effects for Fill button
    fillButton.addEventListener('mouseenter', () => {
      fillButton.style.transform = 'translateY(-2px)';
      fillButton.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
    });

    fillButton.addEventListener('mouseleave', () => {
      fillButton.style.transform = 'translateY(0)';
      fillButton.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
    });

    // Add click handler for Fill button
    fillButton.addEventListener('click', async (event) => {
      console.log("AI Review Assistant: Fill button clicked");
      
      // Prevent form submission and default behavior
      event.preventDefault();
      event.stopPropagation();
      
      try {
        // Get text from clipboard
        const clipboardText = await navigator.clipboard.readText();
        
        if (clipboardText) {
          // Find the review textarea
          const reviewTextarea = document.querySelector('textarea#reviewText[name="reviewText"]');
          
          if (reviewTextarea) {
            // Fill the textarea with clipboard content
            reviewTextarea.value = clipboardText;
            
            // Trigger input event to ensure any listeners are notified
            reviewTextarea.dispatchEvent(new Event('input', { bubbles: true }));
            reviewTextarea.dispatchEvent(new Event('change', { bubbles: true }));
            
            console.log("AI Review Assistant: Text pasted from clipboard to textarea");
          } else {
            alert("Review textarea not found. Please make sure you're on the review page.");
          }
        } else {
          alert("No text found in clipboard. Please copy some text first.");
        }
      } catch (error) {
        console.error("AI Review Assistant: Error reading clipboard:", error);
        alert("Error reading clipboard. Please make sure you have copied some text.");
      }
    });

    // Add both buttons to the container
    buttonContainer.appendChild(aiButton);
    buttonContainer.appendChild(fillButton);

    // Insert the button container at the top of the target container
    targetContainer.insertBefore(buttonContainer, targetContainer.firstChild);
    console.log("AI Review Assistant: Buttons injected successfully");
  } else {
    console.log("AI Review Assistant: No target container found");
  }
}

// Function to wait for page to be completely loaded
function waitForPageLoad() {
  return new Promise((resolve) => {
    // Check if page is already loaded
    if (document.readyState === 'complete') {
      console.log("AI Review Assistant: Page already loaded");
      resolve();
      return;
    }
    
    // Wait for load event
    window.addEventListener('load', () => {
      console.log("AI Review Assistant: Page load event fired");
      resolve();
    });
    
    // Fallback timeout after 10 seconds
    setTimeout(() => {
      console.log("AI Review Assistant: Page load timeout reached");
      resolve();
    }, 10000);
  });
}

// Function to wait for specific elements to be present
function waitForElements() {
  return new Promise((resolve) => {
    const checkElements = () => {
      const reviewTextarea = document.querySelector('textarea#reviewText[name="reviewText"]');
      const reviewForm = document.querySelector('#ryp-review-your-purchases-form');
      const ratingCard = document.querySelector('div[data-hook="ryp-star-rating-card"]');
      
      if (reviewTextarea || reviewForm || ratingCard) {
        console.log("AI Review Assistant: Target elements found");
        resolve();
        return;
      }
      
      // Check again after a short delay
      setTimeout(checkElements, 500);
    };
    
    checkElements();
    
    // Fallback timeout after 15 seconds
    setTimeout(() => {
      console.log("AI Review Assistant: Element wait timeout reached");
      resolve();
    }, 15000);
  });
}

// Main initialization function
async function initialize() {
  if (isReviewPage()) {
    console.log("AI Review Assistant: Review page detected, initializing...");
    
    try {
      // Wait for page to be completely loaded
      console.log("AI Review Assistant: Waiting for page to load...");
      await waitForPageLoad();
      
      // Wait for specific elements to be present
      console.log("AI Review Assistant: Waiting for target elements...");
      await waitForElements();
      
      // Wait an additional second for any final rendering
      console.log("AI Review Assistant: Waiting additional 1 second for final rendering...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Now inject the button
      console.log("AI Review Assistant: Injecting button after page is fully loaded");
      injectAIReviewButton();
      
    } catch (error) {
      console.error("AI Review Assistant: Error during initialization:", error);
      // Fallback: try to inject anyway
      injectAIReviewButton();
    }
    
    // Also try after delays in case the page loads dynamically
    setTimeout(injectAIReviewButton, 2000);
    setTimeout(injectAIReviewButton, 5000);
    
    // Listen for dynamic content changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if any of the added nodes contain our target selectors
          const hasTargetContent = Array.from(mutation.addedNodes).some(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              return node.querySelector && (
                node.querySelector('textarea#reviewText[name="reviewText"]') ||
                node.querySelector('div[data-hook="ryp-review-text-input"]') ||
                node.querySelector('div[data-hook="ryp-star-rating-card"]') ||
                node.querySelector('#ryp-review-your-purchases-form')
              );
            }
            return false;
          });
          
          if (hasTargetContent) {
            console.log("AI Review Assistant: Dynamic content detected, injecting button");
            setTimeout(injectAIReviewButton, 100);
          }
        }
      });
    });
    
    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
  } else {
    console.log("AI Review Assistant: Not a review page, skipping initialization");
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

