/* Promise wrapper around the same lazy three.min.js load academic-page.js
   uses for the About/brand scenes. If the classic script has already added
   (or is currently fetching) the tag, reuse it so three.js is only ever
   downloaded once per page. */

let promise = null;

export const loadThree = () => {
    if (window.THREE) return Promise.resolve(window.THREE);
    if (promise) return promise;
    promise = new Promise((resolve, reject) => {
        let s = document.querySelector('script[src$="three.min.js"]');
        if (!s) {
            s = document.createElement('script');
            s.src = 'js/three.min.js';
            s.async = true;
            document.head.appendChild(s);
        }
        s.addEventListener('load', () => {
            if (window.THREE) resolve(window.THREE);
            else reject(new Error('three.min.js loaded but THREE is missing'));
        });
        s.addEventListener('error', () => reject(new Error('three.min.js failed to load')));
        // the tag may have finished loading before we attached the listener
        if (window.THREE) resolve(window.THREE);
    });
    return promise;
};
