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
let keywordText;

// WordHero Automation instance
let wordheroAutomation;

// WordHero Automation Class
class WordHeroAutomation {
    constructor() {
        this.wordheroUrl = 'https://app.wordhero.co/home';
    }

    // Open WordHero in a new tab and set up automation
    async openWordHero() {
        try {
            // Create new tab with WordHero
            const tab = await chrome.tabs.create({
                url: this.wordheroUrl,
                active: false // Don't switch to the new tab
            });

            // Wait for the page to load
            await this.waitForTabLoad(tab.id);

            // Set up automation
            await this.setupWordHeroAutomation(tab.id);

            return tab.id;
        } catch (error) {
            console.error('Error opening WordHero:', error);
            throw error;
        }
    }

    // Wait for tab to load
    waitForTabLoad(tabId) {
        return new Promise((resolve) => {
            const checkComplete = () => {
                chrome.tabs.get(tabId, (tab) => {
                    if (tab.status === 'complete') {
                        resolve();
                    } else {
                        setTimeout(checkComplete, 100);
                    }
                });
            };
            checkComplete();
        });
    }

    // Set up WordHero automation
    async setupWordHeroAutomation(tabId) {
        try {
            // Wait longer for the page to fully render
            console.log('Waiting for WordHero page to load...');
            await new Promise(resolve => setTimeout(resolve, 3000));

            // First, test if we can inject any script at all
            console.log('Step 1: Testing script injection...');
            await this.testScriptInjection(tabId);
            console.log('Step 1: Script injection test passed!');

            // Click on "Product Reviews" button with retry logic
            console.log('Step 2: Clicking Product Reviews button...');
            const clickResult = await this.clickProductReviewsButtonWithRetry(tabId);
            console.log('Step 2: Product Reviews button click result:', clickResult);

            // Wait for the form to load
            console.log('Step 3: Waiting for form to load...');
            await new Promise(resolve => setTimeout(resolve, 5000));

            // Fill in the product information
            console.log('Step 4: Filling product information...');
            const fillResult = await this.fillProductInformation(tabId);
            console.log('Step 4: Product information fill result:', fillResult);

            // Click the "WRITE FOR ME" button
            console.log('Step 5: Clicking WRITE FOR ME button...');
            const writeResult = await this.clickWriteForMeButton(tabId);
            console.log('Step 5: WRITE FOR ME button click result:', writeResult);

            // Wait for AI to finish writing (monitor button text changes)
            console.log('Step 6: Waiting for AI to finish writing...');
            await this.waitForWritingToComplete(tabId);

            // Extract generated content and save to localStorage
            console.log('Step 7: Extracting generated content...');
            const contentResult = await this.extractGeneratedContent(tabId);
            console.log('Step 7: Content extraction result:', contentResult);

            console.log('WordHero automation setup complete');
        } catch (error) {
            console.error('Error setting up WordHero automation:', error);
            console.error('Error stack:', error.stack);
            throw error;
        }
    }

    // Test script injection capability
    async testScriptInjection(tabId) {
        const testFunction = () => {
            console.log('TEST SCRIPT INJECTION: SUCCESS!');
            console.log('Current URL:', window.location.href);
            console.log('Page title:', document.title);
            return { success: true, message: 'Script injection works!' };
        };

        return new Promise((resolve, reject) => {
            console.log('Testing script injection capability...');
            
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: testFunction
            }, (results) => {
                console.log('Test script injection results:', results);
                
                if (chrome.runtime.lastError) {
                    console.error('Test script injection failed:', chrome.runtime.lastError);
                    reject(new Error('Script injection not working: ' + chrome.runtime.lastError.message));
                } else if (results && results[0] && results[0].result.success) {
                    console.log('Test script injection successful!');
                    resolve(results[0].result);
                } else {
                    console.error('Test script injection returned unexpected results:', results);
                    reject(new Error('Test script injection failed - unexpected results'));
                }
            });
        });
    }

    // Click on the "Product Reviews" button with retry logic
    async clickProductReviewsButtonWithRetry(tabId) {
        const maxRetries = 5;
        const retryDelay = 1000;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`=== ATTEMPT ${attempt} TO CLICK PRODUCT REVIEWS BUTTON ===`);
                console.log(`Tab ID: ${tabId}`);
                
                // First, let's check if we can access the tab
                const tab = await chrome.tabs.get(tabId);
                console.log('Tab info:', {
                    id: tab.id,
                    url: tab.url,
                    status: tab.status,
                    title: tab.title
                });
                
                console.log('Calling clickProductReviewsButton...');
                const result = await this.clickProductReviewsButton(tabId);
                console.log('clickProductReviewsButton result:', result);
                
                if (result.success) {
                    console.log('Product Reviews button clicked successfully');
                    return result;
                } else {
                    console.log('Product Reviews button click failed:', result.message);
                }
            } catch (error) {
                console.error(`Attempt ${attempt} failed:`, error);
                console.error('Error details:', {
                    message: error.message,
                    stack: error.stack
                });
            }

            if (attempt < maxRetries) {
                console.log(`Waiting ${retryDelay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }

        throw new Error(`Failed to click Product Reviews button after ${maxRetries} attempts`);
    }

    // Click on the "Product Reviews" button
    async clickProductReviewsButton(tabId) {
        const clickFunction = () => {
            console.log('=== DEBUGGING PRODUCT REVIEWS BUTTON CLICK ===');
            console.log('Current URL:', window.location.href);
            console.log('Page title:', document.title);
            console.log('Document ready state:', document.readyState);
            
            // Try multiple selectors to find the Product Reviews button
            const selectors = [
                'h4.bubble-element.Text.cnaAub',
                'h4[class*="bubble-element"]',
                'h4'
            ];
            
            console.log('Trying selectors:', selectors);
            
            for (let selector of selectors) {
                console.log('Trying selector:', selector);
                const elements = document.querySelectorAll(selector);
                console.log('Found', elements.length, 'elements with selector:', selector);
                
                for (let i = 0; i < elements.length; i++) {
                    const element = elements[i];
                    const text = element.textContent.trim();
                    console.log('Element', i, 'text:', text);
                    
                    if (text === 'Product Reviews') {
                        console.log('FOUND Product Reviews button!');
                        console.log('Element details:', {
                            tagName: element.tagName,
                            className: element.className,
                            id: element.id,
                            textContent: element.textContent
                        });
                        
                        // Check if element is visible and clickable
                        const rect = element.getBoundingClientRect();
                        const isVisible = rect.width > 0 && rect.height > 0;
                        console.log('Element visibility:', {
                            isVisible: isVisible,
                            rect: rect,
                            computedStyle: window.getComputedStyle(element).display
                        });
                        
                        if (isVisible) {
                            console.log('Element is visible, attempting to click...');
                            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            
                            // Try immediate click first
                            try {
                                element.click();
                                console.log('Click executed successfully!');
                                return { success: true, message: 'Product Reviews button clicked', selector: selector };
                            } catch (clickError) {
                                console.log('Click failed:', clickError);
                                // Try with setTimeout as fallback
                                setTimeout(() => {
                                    try {
                                        element.click();
                                        console.log('Delayed click executed successfully!');
                                    } catch (delayedError) {
                                        console.log('Delayed click also failed:', delayedError);
                                    }
                                }, 500);
                                return { success: true, message: 'Product Reviews button click attempted', selector: selector };
                            }
                        } else {
                            console.log('Element found but not visible');
                            return { success: false, message: 'Element found but not visible', selector: selector };
                        }
                    }
                }
            }
            
            // Debug: Log all h4 elements found
            const allH4s = document.querySelectorAll('h4');
            const h4Texts = Array.from(allH4s).map((h4, index) => ({
                index: index,
                text: h4.textContent.trim(),
                className: h4.className,
                id: h4.id
            }));
            console.log('All h4 elements found:', h4Texts);
            
            // Also check for any elements containing "Product" or "Review"
            const productElements = document.querySelectorAll('*');
            const productTexts = [];
            for (let elem of productElements) {
                const text = elem.textContent.trim();
                if (text.includes('Product') || text.includes('Review')) {
                    productTexts.push({
                        tagName: elem.tagName,
                        text: text,
                        className: elem.className
                    });
                }
            }
            console.log('Elements containing "Product" or "Review":', productTexts.slice(0, 10)); // Limit to first 10
            
            return { 
                success: false, 
                message: 'Product Reviews button not found', 
                foundElements: h4Texts,
                productElements: productTexts.slice(0, 10)
            };
        };

        return new Promise((resolve, reject) => {
            console.log('Attempting to inject script into tab:', tabId);
            
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: clickFunction
            }, (results) => {
                console.log('Script injection completed. Results:', results);
                
                if (chrome.runtime.lastError) {
                    console.error('Script execution error:', chrome.runtime.lastError);
                    console.error('Error details:', {
                        message: chrome.runtime.lastError.message,
                        code: chrome.runtime.lastError.code
                    });
                    reject(new Error(chrome.runtime.lastError.message));
                } else if (results && results[0]) {
                    console.log('Script execution result:', results[0].result);
                    resolve(results[0].result);
                } else {
                    console.error('No results returned from script');
                    console.error('Results object:', results);
                    reject(new Error('No results returned from script'));
                }
            });
        });
    }

    // Fill in the product information
    async fillProductInformation(tabId) {
        // Get product data from localStorage
        const productData = this.getProductData();
        
        if (!productData) {
            throw new Error('No product data available');
        }

        const fillFunction = (productData) => {
            console.log('=== DEBUGGING TEXTAREA FILL ===');
            console.log('Product data:', productData);
            
            // Try multiple selectors to find the textarea
            const selectors = [
                'textarea[id="textfield_1"]',
                'textarea.bubble-element.MultiLineInput',
                'textarea[class*="bubble-element"]',
                'textarea'
            ];
            
            console.log('Trying textarea selectors:', selectors);
            
            for (let selector of selectors) {
                console.log('Trying selector:', selector);
                const textareas = document.querySelectorAll(selector);
                console.log('Found', textareas.length, 'textareas with selector:', selector);
                
                for (let i = 0; i < textareas.length; i++) {
                    const textarea = textareas[i];
                    console.log('Textarea', i, 'details:', {
                        id: textarea.id,
                        className: textarea.className,
                        placeholder: textarea.placeholder,
                        visible: textarea.offsetWidth > 0 && textarea.offsetHeight > 0
                    });
                    
                    // Check if this is the right textarea (by id or placeholder)
                    if (textarea.id === 'textfield_1' || 
                        (textarea.placeholder && textarea.placeholder.includes('WordHero'))) {
                        
                        console.log('FOUND target textarea!');
                        
                        // Check if element is visible
                        const rect = textarea.getBoundingClientRect();
                        const isVisible = rect.width > 0 && rect.height > 0;
                        console.log('Textarea visibility:', {
                            isVisible: isVisible,
                            rect: rect,
                            computedStyle: window.getComputedStyle(textarea).display
                        });
                        
                        if (isVisible) {
                            // Combine product title and keyword with pipe separator
                            const productInfo = `${productData.title} | ${productData.keyword}`;
                            console.log('Filling textarea with:', productInfo);
                            
                            // Clear existing content
                            textarea.value = '';
                            
                            // Set the new value
                            textarea.value = productInfo;
                            
                            // Focus the textarea
                            textarea.focus();
                            
                            // Trigger multiple events to ensure the form recognizes the change
                            textarea.dispatchEvent(new Event('input', { bubbles: true }));
                            textarea.dispatchEvent(new Event('change', { bubbles: true }));
                            textarea.dispatchEvent(new Event('blur', { bubbles: true }));
                            
                            console.log('Textarea filled successfully!');
                            
                            return { 
                                success: true, 
                                message: 'Product information filled',
                                data: productInfo,
                                selector: selector
                            };
                        } else {
                            console.log('Textarea found but not visible');
                        }
                    }
                }
            }
            
            // Debug: Log all textareas found
            const allTextareas = document.querySelectorAll('textarea');
            const textareaInfo = Array.from(allTextareas).map((textarea, index) => ({
                index: index,
                id: textarea.id,
                className: textarea.className,
                placeholder: textarea.placeholder,
                visible: textarea.offsetWidth > 0 && textarea.offsetHeight > 0
            }));
            console.log('All textareas found:', textareaInfo);
            
            return { 
                success: false, 
                message: 'Target textarea not found', 
                foundTextareas: textareaInfo
            };
        };

        return new Promise((resolve, reject) => {
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: fillFunction,
                args: [productData]
            }, (results) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else if (results && results[0] && results[0].result.success) {
                    console.log('Product information filled successfully:', results[0].result.data);
                    resolve(results[0].result);
                } else {
                    reject(new Error('Failed to fill product information'));
                }
            });
        });
    }

    // Click the "WRITE FOR ME" button
    async clickWriteForMeButton(tabId) {
        const clickFunction = () => {
            console.log('=== DEBUGGING WRITE FOR ME BUTTON CLICK ===');
            console.log('Current URL:', window.location.href);
            console.log('Page title:', document.title);
            
            // Try multiple selectors to find the WRITE FOR ME button
            const selectors = [
                'button.clickable-element.bubble-element.Button.cmaZpaH',
                'button[class*="cmaZpaH"]',
                'button:contains("WRITE FOR ME")',
                'button'
            ];
            
            console.log('Trying WRITE FOR ME button selectors:', selectors);
            
            for (let selector of selectors) {
                console.log('Trying selector:', selector);
                const elements = document.querySelectorAll(selector);
                console.log('Found', elements.length, 'elements with selector:', selector);
                
                for (let i = 0; i < elements.length; i++) {
                    const element = elements[i];
                    const text = element.textContent.trim();
                    console.log('Element', i, 'text:', text);
                    
                    if (text === 'WRITE FOR ME') {
                        console.log('FOUND WRITE FOR ME button!');
                        console.log('Element details:', {
                            tagName: element.tagName,
                            className: element.className,
                            id: element.id,
                            textContent: element.textContent
                        });
                        
                        // Check if element is visible and clickable
                        const rect = element.getBoundingClientRect();
                        const isVisible = rect.width > 0 && rect.height > 0;
                        console.log('Element visibility:', {
                            isVisible: isVisible,
                            rect: rect,
                            computedStyle: window.getComputedStyle(element).display
                        });
                        
                        if (isVisible) {
                            console.log('Element is visible, attempting to click...');
                            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            
                            // Try immediate click first
                            try {
                                element.click();
                                console.log('WRITE FOR ME button click executed successfully!');
                                return { success: true, message: 'WRITE FOR ME button clicked', selector: selector };
                            } catch (clickError) {
                                console.log('Click failed:', clickError);
                                // Try with setTimeout as fallback
                                setTimeout(() => {
                                    try {
                                        element.click();
                                        console.log('Delayed WRITE FOR ME click executed successfully!');
                                    } catch (delayedError) {
                                        console.log('Delayed click also failed:', delayedError);
                                    }
                                }, 500);
                                return { success: true, message: 'WRITE FOR ME button click attempted', selector: selector };
                            }
                        } else {
                            console.log('WRITE FOR ME button found but not visible');
                            return { success: false, message: 'WRITE FOR ME button found but not visible', selector: selector };
                        }
                    }
                }
            }
            
            // Debug: Log all buttons found
            const allButtons = document.querySelectorAll('button');
            const buttonTexts = Array.from(allButtons).map((button, index) => ({
                index: index,
                text: button.textContent.trim(),
                className: button.className,
                id: button.id
            }));
            console.log('All buttons found:', buttonTexts);
            
            return { 
                success: false, 
                message: 'WRITE FOR ME button not found', 
                foundButtons: buttonTexts
            };
        };

        return new Promise((resolve, reject) => {
            console.log('Attempting to click WRITE FOR ME button in tab:', tabId);
            
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: clickFunction
            }, (results) => {
                console.log('WRITE FOR ME button click script injection completed. Results:', results);
                
                if (chrome.runtime.lastError) {
                    console.error('WRITE FOR ME button click script execution error:', chrome.runtime.lastError);
                    reject(new Error(chrome.runtime.lastError.message));
                } else if (results && results[0]) {
                    console.log('WRITE FOR ME button click script execution result:', results[0].result);
                    resolve(results[0].result);
                } else {
                    console.error('No results returned from WRITE FOR ME button click script');
                    reject(new Error('No results returned from WRITE FOR ME button click script'));
                }
            });
        });
    }

    // Wait for AI writing to complete by monitoring button text changes
    async waitForWritingToComplete(tabId, maxWaitTime = 60000) {
        console.log('Starting to monitor button text for writing completion...');
        const startTime = Date.now();
        
        return new Promise((resolve, reject) => {
            const checkButtonText = async () => {
                try {
                    const result = await this.checkWriteButtonStatus(tabId);
                    console.log('Button status check result:', result);
                    
                    if (result.success) {
                        if (result.isWriting) {
                            console.log('AI is still writing, waiting...');
                            
                            // Check if we've exceeded the maximum wait time
                            if (Date.now() - startTime > maxWaitTime) {
                                reject(new Error(`Timeout waiting for AI to finish writing. Waited ${maxWaitTime}ms`));
                                return;
                            }
                            
                            // Continue checking every 2 seconds
                            setTimeout(checkButtonText, 2000);
                        } else {
                            console.log('AI writing completed! Button text:', result.buttonText);
                            resolve(result);
                        }
                    } else {
                        console.log('Could not check button status, assuming writing is complete');
                        resolve(result);
                    }
                } catch (error) {
                    console.error('Error checking button status:', error);
                    reject(error);
                }
            };
            
            // Start checking
            checkButtonText();
        });
    }

    // Check the current status of the write button
    async checkWriteButtonStatus(tabId) {
        const checkFunction = () => {
            console.log('=== CHECKING WRITE BUTTON STATUS ===');
            console.log('Current URL:', window.location.href);
            
            // Try multiple selectors to find the write button
            const selectors = [
                'button.clickable-element.bubble-element.Button.cmaZpaH',
                'button[class*="cmaZpaH"]',
                'button'
            ];
            
            for (let selector of selectors) {
                const elements = document.querySelectorAll(selector);
                
                for (let element of elements) {
                    const text = element.textContent.trim();
                    console.log('Found button with text:', text);
                    
                    // Check if this is the write button (contains "WRITE" or "*WRITING*")
                    if (text.includes('WRITE') || text.includes('WRITING')) {
                        console.log('Found write button! Text:', text);
                        
                        // Check if it's currently writing
                        const isWriting = text.includes('*WRITING*') || text.includes('WRITING');
                        
                        return {
                            success: true,
                            buttonText: text,
                            isWriting: isWriting,
                            element: {
                                tagName: element.tagName,
                                className: element.className,
                                id: element.id
                            }
                        };
                    }
                }
            }
            
            return {
                success: false,
                message: 'Write button not found',
                buttonText: null,
                isWriting: false
            };
        };

        return new Promise((resolve, reject) => {
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: checkFunction
            }, (results) => {
                if (chrome.runtime.lastError) {
                    console.error('Error checking button status:', chrome.runtime.lastError);
                    reject(new Error(chrome.runtime.lastError.message));
                } else if (results && results[0]) {
                    resolve(results[0].result);
                } else {
                    reject(new Error('No results returned from button status check'));
                }
            });
        });
    }

    // Extract generated content and save to localStorage
    async extractGeneratedContent(tabId) {
        const extractFunction = () => {
            console.log('=== EXTRACTING GENERATED CONTENT ===');
            console.log('Current URL:', window.location.href);
            console.log('Page title:', document.title);
            
            // Try multiple selectors to find the generated content
            const selectors = [
                'div#clicktocopy_text_1',
                'div[class*="cmaZpy"]',
                'div[class*="bubble-element Text"]',
                'div[class*="clicktocopy_text"]'
            ];
            
            console.log('Trying content selectors:', selectors);
            
            for (let selector of selectors) {
                console.log('Trying selector:', selector);
                const elements = document.querySelectorAll(selector);
                console.log('Found', elements.length, 'elements with selector:', selector);
                
                for (let i = 0; i < elements.length; i++) {
                    const element = elements[i];
                    const id = element.id;
                    const text = element.textContent.trim();
                    
                    console.log('Element', i, 'details:', {
                        id: id,
                        className: element.className,
                        textLength: text.length,
                        textPreview: text.substring(0, 100) + '...'
                    });
                    
                    if (id === 'clicktocopy_text_1' || text.length > 50) {
                        console.log('FOUND generated content!');
                        console.log('Content details:', {
                            id: id,
                            className: element.className,
                            textLength: text.length,
                            fullText: text
                        });
                        
                        // Save to localStorage
                        try {
                            localStorage.setItem('generatedReview', text);
                            console.log('Generated review saved to localStorage');
                            
                            return {
                                success: true,
                                message: 'Generated content extracted and saved',
                                content: text,
                                contentLength: text.length,
                                selector: selector
                            };
                        } catch (error) {
                            console.error('Error saving to localStorage:', error);
                            return {
                                success: false,
                                message: 'Failed to save content to localStorage',
                                error: error.message
                            };
                        }
                    }
                }
            }
            
            // Debug: Log all div elements found
            const allDivs = document.querySelectorAll('div');
            const divDetails = Array.from(allDivs).map((div, index) => ({
                index: index,
                id: div.id,
                className: div.className,
                textLength: div.textContent.trim().length,
                textPreview: div.textContent.trim().substring(0, 50) + '...'
            })).filter(div => div.textLength > 20); // Only show divs with substantial content
            
            console.log('All divs with content found:', divDetails);
            
            return { 
                success: false, 
                message: 'Generated content not found', 
                foundDivs: divDetails
            };
        };

        return new Promise((resolve, reject) => {
            console.log('Attempting to extract generated content from tab:', tabId);
            
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: extractFunction
            }, (results) => {
                console.log('Content extraction script injection completed. Results:', results);
                
                if (chrome.runtime.lastError) {
                    console.error('Content extraction script execution error:', chrome.runtime.lastError);
                    reject(new Error(chrome.runtime.lastError.message));
                } else if (results && results[0]) {
                    console.log('Content extraction script execution result:', results[0].result);
                    resolve(results[0].result);
                } else {
                    console.error('No results returned from content extraction script');
                    reject(new Error('No results returned from content extraction script'));
                }
            });
        });
    }

    // Get product data from localStorage
    getProductData() {
        try {
            const productData = localStorage.getItem('productData');
            const keyword = localStorage.getItem('selectedKeyword');
            
            if (productData && keyword) {
                const parsed = JSON.parse(productData);
                return {
                    title: parsed.title,
                    keyword: keyword
                };
            }
            return null;
        } catch (error) {
            console.error('Error getting product data:', error);
            return null;
        }
    }
}

// Star Rating Keywords
const STAR_KEYWORDS = {
    1: [
        "Waste of money",
        "Very disappointed",
        "Poor experience",
        "Not as advertised",
        "Terrible quality",
        "Regret this purchase",
        "Avoid at all costs",
        "Major letdown",
        "Fails to deliver",
        "Complete failure"
    ],
    2: [
        "Deeply flawed",
        "Wouldn't recommend",
        "Underwhelming",
        "Not worth the price",
        "Frustrating to use",
        "Significant drawbacks",
        "I expected more",
        "Low quality",
        "Barely functional",
        "Disappointing"
    ],
    3: [
        "It's average",
        "Gets the job done",
        "Nothing special",
        "Decent but not great",
        "Met expectations",
        "Has pros and cons",
        "Fair for the price",
        "Could be improved",
        "Unremarkable",
        "Serviceable"
    ],
    4: [
        "Very good",
        "Solid choice",
        "Great value",
        "Happy with it",
        "Works well",
        "Impressive",
        "Would recommend",
        "Mostly positive",
        "High quality",
        "Almost perfect"
    ],
    5: [
        "Absolutely perfect",
        "Exceeded expectations",
        "Outstanding",
        "Highly recommend",
        "Excellent quality",
        "Fantastic purchase",
        "A must-have",
        "Top-notch",
        "Incredible value",
        "Flawless"
    ]
};

// Function to get a random keyword for a given star rating
function getRandomKeyword(rating) {
    if (STAR_KEYWORDS[rating] && STAR_KEYWORDS[rating].length > 0) {
        const randomIndex = Math.floor(Math.random() * STAR_KEYWORDS[rating].length);
        return STAR_KEYWORDS[rating][randomIndex];
    }
    return "";
}

// Function to display product information
function displayProductInfo(productInfo) {
    if (productInfo && productInfo.title && productInfo.imageUrl) {
        productData = productInfo;
        productTitle.textContent = productInfo.title;
        productImage.src = productInfo.imageUrl;
        productInfoContainer.style.display = 'flex';
        
        // Store product data for later use
        chrome.storage.sync.set({ productData: productInfo });
        
        // Also save to localStorage for persistence
        localStorage.setItem('productData', JSON.stringify(productInfo));
        
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
    // Only show default message if we don't have product data
    if (!productData || !productData.title) {
        productTitle.textContent = "Click 'Generate AI Review' on the review page to load product info";
        productImage.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjZjVmNWY1Ii8+Cjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC9tYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Q2xpY2sgdG8gTG9hZDwvdGV4dD4KPC9zdmc+Cg==";
    }
    // If we have product data, it will already be displayed from loadFromLocalStorage
}

// Function to load data from localStorage
function loadFromLocalStorage() {
    try {
        // Load product data
        const savedProductData = localStorage.getItem('productData');
        if (savedProductData) {
            const productInfo = JSON.parse(savedProductData);
            if (productInfo && productInfo.title && productInfo.imageUrl) {
                productData = productInfo;
                productTitle.textContent = productInfo.title;
                productImage.src = productInfo.imageUrl;
                productInfoContainer.style.display = 'flex';
                console.log('Product data loaded from localStorage:', productInfo);
            }
        }
        
        // Load star rating
        const savedRating = localStorage.getItem('starRating');
        if (savedRating) {
            currentRating = parseInt(savedRating, 10);
            starRatingContainer.dataset.rating = currentRating;
            console.log('Star rating loaded from localStorage:', currentRating);
            
            // Load saved keyword if available
            const savedKeyword = localStorage.getItem('selectedKeyword');
            if (savedKeyword) {
                keywordText.textContent = savedKeyword;
                console.log('Keyword loaded from localStorage:', savedKeyword);
            }
        }
    } catch (error) {
        console.error('Error loading from localStorage:', error);
    }
}

// Function to save star rating to localStorage
function saveStarRating(rating) {
    localStorage.setItem('starRating', rating.toString());
    console.log('Star rating saved to localStorage:', rating);
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
        
        // Load data from localStorage first (most recent)
        loadFromLocalStorage();
      
      if (isEnabled) {
        checkCurrentPage();
            checkPendingProductInfo(); // Check for pending product info
      } else {
        updatePopupState(false);
      }

        // Fallback to chrome.storage.sync if localStorage is empty
        if (!productData && result.productData && result.productData.title) {
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
    keywordText = document.getElementById('keyword-text');
  
  
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
            
            // Get and display random keyword for the selected rating
            const keyword = getRandomKeyword(currentRating);
            keywordText.textContent = keyword;
            
            // Save both rating and keyword to localStorage
            saveStarRating(currentRating);
            localStorage.setItem('selectedKeyword', keyword);
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
      
      if (service === 'wordhero') {
        // Handle WordHero automation
        handleWordHeroGeneration();
      } else if (service === 'gemini') {
        // Handle Gemini (existing logic)
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
    }

    // Handle WordHero generation
    async function handleWordHeroGeneration() {
      try {
        // Check if we have product data and keyword
        const productData = localStorage.getItem('productData');
        const keyword = localStorage.getItem('selectedKeyword');
        
        if (!productData || !keyword) {
          alert("Please load product information and select a star rating first.");
          return;
        }

        // Initialize WordHero automation
        wordheroAutomation = new WordHeroAutomation();
        
        // Show loading message
        wordheroBtn.textContent = 'Opening WordHero...';
        wordheroBtn.disabled = true;
        
        // Open WordHero and set up automation
        await wordheroAutomation.openWordHero();
        
        // Reset button
        wordheroBtn.textContent = 'Generate with WordHero.ai';
        wordheroBtn.disabled = false;
        
        // Close popup
        window.close();
        
      } catch (error) {
        console.error('WordHero automation error:', error);
        alert('Error opening WordHero: ' + error.message);
        
        // Reset button
        wordheroBtn.textContent = 'Generate with WordHero.ai';
        wordheroBtn.disabled = false;
      }
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
  
  