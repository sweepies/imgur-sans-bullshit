// ==UserScript==
// @name         Imgur Sans Bullshit
// @version      0.2
// @description  Redirect Imgur links to Imgur Sans Bullshit
// @author       sweepies
// @match        https://imgur.com/*
// @match        https://www.imgur.com/*
// @match        https://i.imgur.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';
    const DOMAIN = 'imgur-sans-bullshit.sweepy.dev';
    
    // Get the current URL
    const currentUrl = window.location.href;
    
    // Extract the Imgur ID from the URL
    let imgurId = null;
    
    // Handle gallery URLs
    const galleryMatch = currentUrl.match(/imgur\.com\/gallery\/([a-zA-Z0-9-]+)/);
    if (galleryMatch) {
        imgurId = galleryMatch[1];
    }
    
    // Handle album URLs
    const albumMatch = currentUrl.match(/imgur\.com\/a\/([a-zA-Z0-9-]+)/);
    if (albumMatch) {
        imgurId = albumMatch[1];
    }
    
    // Handle single image URLs
    const imageMatch = currentUrl.match(/imgur\.com\/([a-zA-Z0-9-]+)(?:\.[a-zA-Z]+)?$/);
    if (imageMatch) {
        imgurId = imageMatch[1];
    }
    
    // Handle direct image URLs
    const directMatch = currentUrl.match(/i\.imgur\.com\/([a-zA-Z0-9-]+)(?:\.[a-zA-Z]+)?$/);
    if (directMatch) {
        imgurId = directMatch[1];
    }
    
    // If we found an ID and we're not already on the clean viewer
    if (imgurId && !window.location.hostname.includes('imgur-sans-bullshit')) {
        // Determine if it's an album
        const isAlbum = currentUrl.includes('/a/') || currentUrl.includes('/album/') || currentUrl.includes('/gallery/');
        
        // Build the redirect URL
        const redirectUrl = isAlbum 
            ? `https://${DOMAIN}/a/${imgurId}`
            : `https://${DOMAIN}/${imgurId}`;
        
        // Redirect immediately
        window.location.replace(redirectUrl);
    }
})();
