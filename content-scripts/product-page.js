// This script runs on the Amazon product detail page (/dp/...)

const getProductData = () => {
    const titleElement = document.querySelector('span#productTitle');
    const title = titleElement ? titleElement.innerText.trim() : 'Unknown Product';
  
    const imageElement = document.querySelector('div#imgTagWrapperId img#landingImage');
    const imageUrl = imageElement ? imageElement.src : '';
  
    if (title && imageUrl) {
      chrome.runtime.sendMessage({
        action: "product_data_scraped",
        data: { title, imageUrl }
      });
    }
  };
  
  // The page might load data dynamically, so we wait a moment.
  setTimeout(getProductData, 1000);
  
  