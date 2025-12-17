// ==UserScript==
// @name         Imgur Sans Bullshit
// @version      0.5
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
    
    // Check for gallery URLs and extract ID (handle slugs)
    const galleryMatch = currentUrl.match(/imgur\.com\/gallery\/(?:[a-zA-Z0-9-]+-)?([a-zA-Z0-9]{4,10})(?:\.[a-zA-Z]+)?/);
    if (galleryMatch) {
        imgurId = galleryMatch[1];
    }
    // Check for album URLs and extract ID (handle slugs)
    else if (currentUrl.match(/imgur\.com\/a\/(?:[a-zA-Z0-9-]+-)?([a-zA-Z0-9]{4,10})(?:\.[a-zA-Z]+)?/)) {
        const albumMatch = currentUrl.match(/imgur\.com\/a\/(?:[a-zA-Z0-9-]+-)?([a-zA-Z0-9]{4,10})(?:\.[a-zA-Z]+)?/);
        if (albumMatch) {
            imgurId = albumMatch[1];
        }
    }
    // Check for single image URLs and extract ID (handle slugs)
    else if (currentUrl.match(/imgur\.com\/(?:[a-zA-Z0-9-]+-)?([a-zA-Z0-9]{4,10})(?:\.[a-zA-Z]+)?$/)) {
        const imageMatch = currentUrl.match(/imgur\.com\/(?:[a-zA-Z0-9-]+-)?([a-zA-Z0-9]{4,10})(?:\.[a-zA-Z]+)?$/);
        if (imageMatch) {
            imgurId = imageMatch[1];
        }
    }
    // Check for direct image URLs
    else if (currentUrl.match(/i\.imgur\.com\/([a-zA-Z0-9-]+)(?:\.[a-zA-Z]+)?$/)) {
        const directMatch = currentUrl.match(/i\.imgur\.com\/([a-zA-Z0-9-]+)(?:\.[a-zA-Z]+)?$/);
        if (directMatch) {
            imgurId = directMatch[1];
        }
    }
    
    if (imgurId) {
        window.location.replace(`https://${DOMAIN}/${imgurId}`);
    }
})();
