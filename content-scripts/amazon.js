// content-scripts/amazon.js

const createReviewButton = () => {
  // Check if the button already exists to prevent duplicates
  if (document.getElementById('ai-review-button')) {
    return;
  }

  // Create the button element
  const button = document.createElement('button');
  button.innerText = '✍️ Write Review with AI';
  button.id = 'ai-review-button';

  // --- Styling the button ---
  // Makes it look modern and noticeable, similar to Amazon's UI
  Object.assign(button.style, {
    display: 'inline-block',
    padding: '10px 20px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#0F1111',
    backgroundColor: '#FFD814',
    border: '1px solid #FCD200',
    borderRadius: '8px',
    cursor: 'pointer',
    boxShadow: '0 2px 5px 0 rgba(213,217,217,.5)',
    margin: '20px 0 10px 0'
  });

  // Add hover effect
  button.addEventListener('mouseover', () => {
    button.style.backgroundColor = '#F7CA00';
  });
  button.addEventListener('mouseout', () => {
    button.style.backgroundColor = '#FFD814';
  });
  
  // Add click handler for future phases
  button.addEventListener('click', (e) => {
      e.preventDefault();
      alert("Review generation process will start here!");
  });


  // Find a good place to inject the button.
  // The element with the product image and title seems like a good anchor.
  const targetContainer = document.querySelector('.ryp__product-info-wrapper');

  if (targetContainer) {
    // Appending it after the product info container
    targetContainer.parentNode.insertBefore(button, targetContainer.nextSibling);
    console.log('AI Review button added to the page.');
  } else {
    console.error('Could not find a target element to place the AI review button.');
  }
};

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "show_write_review_button") {
    createReviewButton();
    sendResponse({ status: "button shown" });
  }
  return true; // Keep the message channel open for async response
});

