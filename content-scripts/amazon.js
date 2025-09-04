// AI Review Assistant Content Script for Amazon Review Pages
console.log("AI Review Assistant: Content script loaded on:", window.location.href);

// Check if this is an Amazon review page
function isReviewPage() {
  const url = window.location.href;
  return url.includes('amazon.com/review/') || url.includes('review-your-purchases');
}

// Function to generate meaningful title from keyword (copied from popup.js)
function generateTitleFromKeyword(keyword, rating) {
    const titleTemplates = {
        1: [
            `A Complete Failure - ${keyword}`,
            `Do Not Buy: This is a ${keyword}`,
            `My Experience: A Total ${keyword}`,
            `Unfortunately, a ${keyword}`,
            `Regret this purchase - ${keyword}`,
            `A major letdown`,
            `Fails to deliver on every promise`,
            `Save your money, this is a ${keyword}`,
            `Extremely disappointed`,
            `If I could give zero stars, I would`
        ],
        2: [
            `Has some serious flaws`,
            `Not as good as I hoped`,
            `A ${keyword} experience`,
            `I expected more than this`,
            `Deeply flawed and ${keyword}`,
            `Frustrating to use`,
            `Barely functional, very ${keyword}`,
            `Wouldn't recommend this product`,
            `Significant drawbacks to consider`,
            `Underwhelming and not worth it`
        ],
        3: [
            `It's just okay`,
            `An average product`,
            `Decent, but that's all`,
            `My thoughts: It's ${keyword}`,
            `Nothing special here`,
            `Gets the job done, but it's ${keyword}`,
            `Three stars for a reason`,
            `It has pros and cons`,
            `Fair for the price`,
            `Unremarkable, but functional`
        ],
        4: [
            `A very solid choice!`,
            `I'm impressed, it's ${keyword}`,
            `Great value and high quality`,
            `Almost perfect, very ${keyword}`,
            `Happy with this purchase`,
            `Works very well`,
            `Would definitely recommend`,
            `A solid 4-star product`,
            `Mostly positive experience`,
            `A great find!`
        ],
        5: [
            `Absolutely perfect!`,
            `Exceeded all expectations!`,
            `A must-have product`,
            `Fantastic quality and truly ${keyword}`,
            `Top-notch in every way`,
            `Couldn't be happier with this!`,
            `Five stars all the way`,
            `An incredible, ${keyword} product`,
            `Highly recommend this purchase`,
            `Flawless performance!`
        ]
    };
    
    const templates = titleTemplates[rating] || titleTemplates[5];
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
    
    return randomTemplate;
}

// Function to preformat text and remove markdown formatting
function preformatText(text) {
    if (!text) return '';
    
    console.log("AI Review Assistant: Preformatting text, original length:", text.length);
    
    // Remove markdown formatting
    let formattedText = text
        // Remove bold/italic markdown (**text**, *text*, __text__, _text_)
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/__([^_]+)__/g, '$1')
        .replace(/_([^_]+)_/g, '$1')
        
        // Remove strikethrough (~~text~~)
        .replace(/~~([^~]+)~~/g, '$1')
        
        // Remove code blocks (```code``` and `code`)
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`([^`]+)`/g, '$1')
        
        // Remove headers (# ## ### ####)
        .replace(/^#{1,6}\s+/gm, '')
        
        // Remove links [text](url) and keep just the text
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        
        // Remove horizontal rules (---, ***, ___)
        .replace(/^[-*_]{3,}$/gm, '')
        
        // Remove blockquotes (> text)
        .replace(/^>\s*/gm, '')
        
        // Remove list markers (- item, * item, + item, 1. item)
        .replace(/^[\s]*[-*+]\s+/gm, '• ')
        .replace(/^[\s]*\d+\.\s+/gm, '')
        
        // Clean up extra whitespace
        .replace(/\n\s*\n\s*\n/g, '\n\n')  // Replace multiple newlines with double newlines
        .replace(/[ \t]+/g, ' ')           // Replace multiple spaces/tabs with single space
        .trim();                           // Remove leading/trailing whitespace
    
    console.log("AI Review Assistant: Preformatted text, new length:", formattedText.length);
    console.log("AI Review Assistant: Text preview:", formattedText.substring(0, 100) + '...');
    
    return formattedText;
}

// Function to wait for an element to appear (copied from popup.js)
function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (element) {
            resolve(element);
            return;
        }

        const observer = new MutationObserver((mutations, obs) => {
            const element = document.querySelector(selector);
            if (element) {
                obs.disconnect();
                resolve(element);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Element ${selector} not found within ${timeout}ms`));
        }, timeout);
    });
}

// Function to find file input element (copied from popup.js)
async function findFileInput() {
    // Try multiple selectors for file input
    const selectors = [
        'input[type="file"]',
        'input[accept*="image"]',
        'input[accept*="video"]',
        'input[accept*="media"]',
        'input[data-testid*="file"]',
        'input[data-testid*="upload"]',
        'input[name*="file"]',
        'input[name*="upload"]',
        'input[id*="file"]',
        'input[id*="upload"]'
    ];

    for (const selector of selectors) {
        const input = document.querySelector(selector);
        if (input) {
            console.log(`Found file input with selector: ${selector}`);
            return input;
        }
    }

    // If no file input found, try to find it within the upload wrapper
    const uploadWrapper = document.querySelector('.in-context-ryp__form-field--mediaUploadInput--custom-wrapper');
    if (uploadWrapper) {
        const fileInput = uploadWrapper.querySelector('input[type="file"]');
        if (fileInput) {
            console.log('Found file input within upload wrapper');
            return fileInput;
        }
    }

    throw new Error('No file input element found');
}

// Function to upload product image (copied from popup.js)
async function uploadProductImage(imageUrl) {
    console.log('=== UPLOADING PRODUCT IMAGE ===');
    console.log('Image URL:', imageUrl);
    
    try {
        // 1. Wait for upload element to be rendered
        console.log('Waiting for upload element...');
        await waitForElement('.in-context-ryp__form-field--mediaUploadInput--custom-wrapper', 5000);
        console.log('Upload element found');
        
        // 2. Find the file input
        console.log('Looking for file input...');
        const fileInput = await findFileInput();
        console.log('File input found:', fileInput);
        
        // 3. Fetch the image
        console.log('Fetching image from URL...');
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        }
        
        const blob = await response.blob();
        console.log('Image blob created, size:', blob.size, 'type:', blob.type);
        
        // 4. Create File object
        const file = new File([blob], 'product-image.jpg', { 
            type: blob.type || 'image/jpeg',
            lastModified: Date.now()
        });
        console.log('File object created:', file.name, file.size, file.type);
        
        // 5. Create FileList and set files
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;
        console.log('Files set on input, count:', fileInput.files.length);
        
        // 6. Trigger events to notify React
        const events = ['input', 'change', 'blur'];
        for (const eventType of events) {
            const event = new Event(eventType, { 
                bubbles: true, 
                cancelable: true 
            });
            fileInput.dispatchEvent(event);
            console.log(`Dispatched ${eventType} event`);
        }
        
        // 7. Also try triggering on the upload wrapper
        const uploadWrapper = document.querySelector('.in-context-ryp__form-field--mediaUploadInput--custom-wrapper');
        if (uploadWrapper) {
            const changeEvent = new Event('change', { bubbles: true, cancelable: true });
            uploadWrapper.dispatchEvent(changeEvent);
            console.log('Dispatched change event on upload wrapper');
        }
        
        console.log('Image upload completed successfully');
        return true;
        
    } catch (error) {
        console.error('Error uploading product image:', error);
        return false;
    }
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
          // Preformat the clipboard text to remove markdown
          const formattedText = preformatText(clipboardText);
          
          // Fill the textarea with preformatted content
          reviewTextarea.value = formattedText;
          
          // Trigger input event to ensure any listeners are notified
          reviewTextarea.dispatchEvent(new Event('input', { bubbles: true }));
          reviewTextarea.dispatchEvent(new Event('change', { bubbles: true }));
          
          console.log("AI Review Assistant: Text pasted from clipboard to textarea");
          
          // Get current rating from chrome.storage.local (shared across extension contexts)
          console.log("AI Review Assistant: Checking chrome.storage.local for rating...");
          
          try {
            const result = await chrome.storage.local.get(['currentRating', 'starRating', 'selectedKeyword', 'productData']);
            console.log("AI Review Assistant: chrome.storage.local contents:", result);
            
            const currentRating = result.currentRating || result.starRating;
            const selectedKeyword = result.selectedKeyword;
            
            if (currentRating && selectedKeyword) {
              const rating = parseInt(currentRating, 10);
              console.log("AI Review Assistant: Setting star rating to:", rating);
              console.log("AI Review Assistant: Using keyword:", selectedKeyword);
              
              // Click the corresponding rating star using the same logic as popup.js
              const starSelector = `#in-context-ryp-form > div.a-section.in-context-ryp__form_fields_container-desktop > div:nth-child(1) > div > div > span:nth-child(${rating})`;
              const ratingStar = document.querySelector(starSelector);
              if (ratingStar) {
                ratingStar.click();
                console.log(`AI Review Assistant: Rating star ${rating} clicked`);
              } else {
                console.log(`AI Review Assistant: Rating star ${rating} not found with selector:`, starSelector);
              }
              
              // Generate and fill the review title
              const reviewTitle = generateTitleFromKeyword(selectedKeyword, rating);
              console.log("AI Review Assistant: Generated title:", reviewTitle);
              
              const reviewTitleField = document.querySelector('input[id="reviewTitle"]');
              if (reviewTitleField) {
                reviewTitleField.value = reviewTitle;
                reviewTitleField.dispatchEvent(new Event('input', { bubbles: true }));
                reviewTitleField.dispatchEvent(new Event('change', { bubbles: true }));
                console.log("AI Review Assistant: Review title field filled with:", reviewTitle);
              } else {
                console.log("AI Review Assistant: Review title field not found");
              }
              
              // Upload product image if available
              const productData = result.productData;
              if (productData && productData.imageUrl) {
                console.log("AI Review Assistant: Starting image upload...");
                const uploadSuccess = await uploadProductImage(productData.imageUrl);
                if (uploadSuccess) {
                  console.log("AI Review Assistant: Product image uploaded successfully");
                } else {
                  console.log("AI Review Assistant: Product image upload failed, but continuing...");
                }
              } else {
                console.log("AI Review Assistant: No product image URL available, skipping upload");
              }
            } else {
              console.log("AI Review Assistant: No rating or keyword found in chrome.storage.local");
            }
          } catch (error) {
            console.error("AI Review Assistant: Error accessing chrome.storage.local:", error);
          }
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
            // Preformat the clipboard text to remove markdown
            const formattedText = preformatText(clipboardText);
            
            // Fill the textarea with preformatted content
            reviewTextarea.value = formattedText;
            
            // Trigger input event to ensure any listeners are notified
            reviewTextarea.dispatchEvent(new Event('input', { bubbles: true }));
            reviewTextarea.dispatchEvent(new Event('change', { bubbles: true }));
            
            console.log("AI Review Assistant: Text pasted from clipboard to textarea");
            
            // Get current rating from chrome.storage.local (shared across extension contexts)
            console.log("AI Review Assistant: Checking chrome.storage.local for rating...");
            
            try {
              const result = await chrome.storage.local.get(['currentRating', 'starRating', 'selectedKeyword', 'productData']);
              console.log("AI Review Assistant: chrome.storage.local contents:", result);
              
              const currentRating = result.currentRating || result.starRating;
              const selectedKeyword = result.selectedKeyword;
              
              if (currentRating && selectedKeyword) {
                const rating = parseInt(currentRating, 10);
                console.log("AI Review Assistant: Setting star rating to:", rating);
                console.log("AI Review Assistant: Using keyword:", selectedKeyword);
                
                // Click the corresponding rating star using the same logic as popup.js
                const starSelector = `#in-context-ryp-form > div.a-section.in-context-ryp__form_fields_container-desktop > div:nth-child(1) > div > div > span:nth-child(${rating})`;
                const ratingStar = document.querySelector(starSelector);
                if (ratingStar) {
                  ratingStar.click();
                  console.log(`AI Review Assistant: Rating star ${rating} clicked`);
                } else {
                  console.log(`AI Review Assistant: Rating star ${rating} not found with selector:`, starSelector);
                }
                
                // Generate and fill the review title
                const reviewTitle = generateTitleFromKeyword(selectedKeyword, rating);
                console.log("AI Review Assistant: Generated title:", reviewTitle);
                
                const reviewTitleField = document.querySelector('input[id="reviewTitle"]');
                if (reviewTitleField) {
                  reviewTitleField.value = reviewTitle;
                  reviewTitleField.dispatchEvent(new Event('input', { bubbles: true }));
                  reviewTitleField.dispatchEvent(new Event('change', { bubbles: true }));
                  console.log("AI Review Assistant: Review title field filled with:", reviewTitle);
                } else {
                  console.log("AI Review Assistant: Review title field not found");
                }
                
                // Upload product image if available
                const productData = result.productData;
                if (productData && productData.imageUrl) {
                  console.log("AI Review Assistant: Starting image upload...");
                  const uploadSuccess = await uploadProductImage(productData.imageUrl);
                  if (uploadSuccess) {
                    console.log("AI Review Assistant: Product image uploaded successfully");
                  } else {
                    console.log("AI Review Assistant: Product image upload failed, but continuing...");
                  }
                } else {
                  console.log("AI Review Assistant: No product image URL available, skipping upload");
                }
              } else {
                console.log("AI Review Assistant: No rating or keyword found in chrome.storage.local");
              }
            } catch (error) {
              console.error("AI Review Assistant: Error accessing chrome.storage.local:", error);
            }
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

