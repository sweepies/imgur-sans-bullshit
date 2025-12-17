// ==UserScript==
// @name         Imgur Sans Bullshit
// @version      0.4
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

    // Check for gallery URLs
    const galleryMatch = currentUrl.match(/imgur\.com\/gallery\/([a-zA-Z0-9-]+)/);
    if (galleryMatch) {
        window.location.replace(`https://${DOMAIN}/gallery/${galleryMatch[1]}`);
        return;
    }
    
    // Check for album URLs
    const albumMatch = currentUrl.match(/imgur\.com\/a\/([a-zA-Z0-9-]+)/);
    if (albumMatch) {
        window.location.replace(`https://${DOMAIN}/a/${albumMatch[1]}`);
        return;
    }
    
    // Check for single image URLs
    const imageMatch = currentUrl.match(/imgur\.com\/([a-zA-Z0-9-]+)(?:\.[a-zA-Z]+)?$/);
    if (imageMatch) {
        window.location.replace(`https://${DOMAIN}/${imageMatch[1]}`);
        return;
    }
    
    // Check for direct image URLs
    const directMatch = currentUrl.match(/i\.imgur\.com\/([a-zA-Z0-9-]+)(?:\.[a-zA-Z]+)?$/);
    if (directMatch) {
        window.location.replace(`https://${DOMAIN}/${directMatch[1]}`);
        return;
    }
})();
