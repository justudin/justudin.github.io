/* Staggered hero text reveal + stat orbit accents (DOM/CSS, no WebGL).
   Accessibility: the original text is kept intact in an .sr-only span; the
   animated per-character/word spans are aria-hidden, so screen readers and
   SEO see exactly the markup that was there before. The sr-only <h1> is
   never touched. */

const splitInto = (el, mode) => {
    const text = el.textContent.replace(/\s+/g, ' ').trim();
    if (!text) return;

    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = text;

    const wrap = document.createElement('span');
    wrap.className = 'fx-split';
    wrap.setAttribute('aria-hidden', 'true');

    let delay = 0;
    const step = mode === 'char' ? 42 : 28;
    text.split(' ').forEach((word, wi, words) => {
        const w = document.createElement('span');
        w.className = 'fx-w';
        if (mode === 'char') {
            Array.from(word).forEach((ch) => {
                const u = document.createElement('span');
                u.className = 'fx-u';
                u.style.setProperty('--fx-d', delay + 'ms');
                u.textContent = ch;
                w.appendChild(u);
                delay += step;
            });
        } else {
            const u = document.createElement('span');
            u.className = 'fx-u';
            u.style.setProperty('--fx-d', delay + 'ms');
            u.textContent = word;
            w.appendChild(u);
            delay += step;
        }
        wrap.appendChild(w);
        if (wi < words.length - 1) wrap.appendChild(document.createTextNode(' '));
    });

    el.textContent = '';
    el.appendChild(sr);
    el.appendChild(wrap);
};

export const revealHero = () => {
    const eyebrow = document.querySelector('.hero-eyebrow');
    const tagline = document.querySelector('.hero-tagline');
    if (eyebrow) splitInto(eyebrow, 'char');
    if (tagline) splitInto(tagline, 'word');
    // double rAF so the initial (hidden) styles are committed before the
    // transition class lands
    requestAnimationFrame(() => requestAnimationFrame(() => {
        [eyebrow, tagline].forEach((el) => el && el.classList.add('fx-in'));
        if (eyebrow) eyebrow.classList.add('fx-chroma');
    }));
};

/* One small orbiting particle per hero stat, staggered so they don't sync. */
export const statAccents = () => {
    document.querySelectorAll('.hero .stat-num').forEach((num, i) => {
        const ring = document.createElement('span');
        ring.className = 'fx-ring';
        ring.setAttribute('aria-hidden', 'true');
        const dot = document.createElement('i');
        dot.style.setProperty('--fx-od', (i * -1.6) + 's');
        ring.appendChild(dot);
        num.appendChild(ring);
    });
};
