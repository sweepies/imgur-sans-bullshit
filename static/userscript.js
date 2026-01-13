// ==UserScript==
// @name         Image Viewer Sans Bullshit
// @version      1.0
// @description  Redirect image host links to clean viewer
// @author       sweepies
// @match        https://imgur.com/*
// @match        https://www.imgur.com/*
// @match        https://i.imgur.com/*
// @match        https://postimg.cc/*
// @match        https://i.postimg.cc/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';
    const DOMAIN = 'imgur-sans-bullshit.sweepy.dev';
    
    // Get the current URL
    const currentUrl = window.location.href;
    
    // Check if the URL should be redirected
    if (shouldRedirect(currentUrl)) {
        // Redirect to the viewer with the full URL
        window.location.replace(`https://${DOMAIN}/view?url=${encodeURIComponent(currentUrl)}`);
    }
    
    function shouldRedirect(url) {
        // Imgur URLs
        if (url.includes('imgur.com')) {
            // Match gallery, album, or single image URLs
            return /imgur\.com\/(gallery\/|a\/)?(?:[a-zA-Z0-9-]+-)?[a-zA-Z0-9]{4,10}/.test(url) ||
                   /i\.imgur\.com\/[a-zA-Z0-9-]+\.[a-zA-Z]+/.test(url);
        }
        
        // Postimages URLs
        if (url.includes('postimg.cc')) {
            // Match gallery, page, or direct image URLs
            return /postimg\.cc\/(gallery\/)?[A-Za-z0-9]+/.test(url) ||
                   /i\.postimg\.cc\/[^?#\s]+/.test(url);
        }
        
        return false;
    }
})();
