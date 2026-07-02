/* academic-page v0.2.0 | (c) 2026 by Muhammad Syafrudin */

const YOUR_ORCID = "0000-0002-5640-4413"; // change this value with your actual ORCID
const API_BACKEND_URL = "https://s.aintlab.com"; // change this with your API_BACKEND_URL
const YOUR_GS_ID = "WLTzkOMAAAAJ";

// Cache DOM elements
const elements = {
    yearofexp: document.getElementById("yearofexp"),
    footerInfo: document.getElementById('additionalInfo'),
    workCountText: document.getElementById("workCountText"),
    citedCount: document.getElementById("citedCount"),
    outletCount: document.getElementById("outletCount"),
    recentUpdates: document.getElementById('recentUpdates')
};

// Calculate years of experience
const d = new Date();
const curryear = d.getFullYear();
const yearofexp = curryear - 2014;
elements.yearofexp.innerHTML = yearofexp;

const fetchWorks = async () => {
    try {
        const response = await axios.get(`${API_BACKEND_URL}/authorid/${YOUR_GS_ID}.json`);
        const workItems = response.data;

        if (workItems) {
            elements.workCountText.innerHTML = workItems.total_papers;
            elements.citedCount.innerHTML = workItems.total_citations;
            elements.footerInfo.innerHTML = `<p class="italic">(*) Publications and citations from <a href="${workItems.gs_id}&view_op=list_works&sortby=pubdate" target="_blank" class="link">Google Scholar</a>, (**) reviews from <a href="https://orcid.org/0000-0002-5640-4413" target="_blank" class="link">ORCID</a>. Updated ${workItems.updated}.</p>`;
        }
        return workItems;
    } catch (errors) {
        console.error(errors);
    }
};

const fetchReviews = async () => {
    try {
        const response = await axios.get(`${API_BACKEND_URL}/orcid/${YOUR_ORCID}/reviews.json`);
        const workItems = response.data;

        if (workItems) {
            elements.outletCount.innerHTML = workItems.total_outlets;
        }
        return workItems;
    } catch (errors) {
        console.error(errors);
    }
};

const fetchUpdates = async () => {
    try {
        const response = await axios.get('https://aintlab.com/updates/rss.xml');
        const rssdataxml = response.data;
        const updatedata = fromXML(rssdataxml);
        const recentupdates = updatedata.rss.channel.item.slice(0, 4);

        let updates = recentupdates.map(item =>
            `<a href='${item.link}' target='_blank' class='link' data-tippy-content='View this update'>${item.title}</a>`
        ).join(', ');

        updates += `, <a href='https://aintlab.com/updates' class='link' data-tippy-content='View all updates' target='_blank'>All updates</a>`;
        elements.recentUpdates.innerHTML = updates;
    } catch (errors) {
        console.error(errors);
    }
};

// Initialize everything
const init = async () => {
    await Promise.all([
        fetchWorks(),
        fetchReviews(),
        fetchUpdates()
    ]);
};

// Start the application
init();

const yearbuild = document.getElementById("yearbuild");
yearbuild.innerHTML = new Date().getFullYear();

// Init tooltips
tippy('.link', {
    placement: 'bottom'
})

// Theme toggle (light/dark), persisted in localStorage
const toggle = document.querySelector('.js-change-theme');
const root = document.documentElement;

const setToggleIcon = () => {
    toggle.innerHTML = root.classList.contains('dark') ? '🌞' : '🌛';
};
setToggleIcon();

toggle.addEventListener('click', () => {
    const isDark = root.classList.toggle('dark');
    localStorage.theme = isDark ? 'dark' : 'light';
    setToggleIcon();
});
