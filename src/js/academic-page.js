/* academic-page v0.1.1 | (c) 2022 by Muhammad Syafrudin */

const YOUR_ORCID = "0000-0002-5640-4413"; // change this value with your actual ORCID
const API_BACKEND_URL = "https://s.aintlab.com"; // change this with your API_BACKEND_URL
const YOUR_GS_ID = "WLTzkOMAAAAJ";

// Cache DOM elements
const elements = {
    tblMetrics: document.getElementById("dtMetrics"),
    yearofexp: document.getElementById("yearofexp"),
    animateLoading: document.getElementById('animateLoading'),
    workCount: document.getElementById('workCount'),
    totalReviews: document.getElementById('totalReviews'),
    footerInfo: document.getElementById('additionalInfo'),
    tblTitle: document.getElementById('tblTitle'),
    tblReviewTitle: document.getElementById('tblReviewTitle'),
    workCountText: document.getElementById("workCountText"),
    citedCount: document.getElementById("citedCount"),
    citationSource: document.getElementById("citationSource"),
    outletCount: document.getElementById("outletCount"),
    metricnotes: document.getElementById('metricnotes'),
    recentUpdates: document.getElementById('recentUpdates')
};

// Add styling to metrics table
elements.tblMetrics.classList.add("text-xs");

// Calculate years of experience
const d = new Date();
const curryear = d.getFullYear();
const yearofexp = curryear - 2014;
elements.yearofexp.innerHTML = yearofexp;

const fethWorks = async () => {
    try {
        const response = await axios.get(`${API_BACKEND_URL}/authorid/${YOUR_GS_ID}.json`);
        const workItems = response.data;

        if (workItems) {
            // Update loading animation
            elements.animateLoading.classList.remove('animate-pulse');
            elements.workCount.classList.remove('bg-gray-300');
            elements.workCount.classList.add('bg-red-800');
            
            // Update content
            elements.tblTitle.innerHTML = `${workItems.total_papers} Publications* <span class='hidden lg:block'>(Citations: ${workItems.total_citations}, H-index: ${workItems.hindex})</span>`;
            elements.workCount.innerHTML = `<button id='detailPublications'>${workItems.total_papers}* Publications</button>`;
            elements.footerInfo.innerHTML = `<p class="italic">(*) This data was obtained from <a href="${workItems.gs_id}&view_op=list_works&sortby=pubdate" target="_blank">Google Scholar</a>, while (**) this data was obtained from <a href="https://orcid.org/${workItems.orcid}" target="_blank">ORCID</a>. Generated as of ${workItems.updated}.</p>`;
            
            // Update citation source
            elements.citationSource.innerHTML = `<a href="${workItems.gs_id}&view_op=list_works&sortby=pubdate" target="_blank" class="link" data-tippy-content="Visit Google Scholar page">Google Scholar</a>`;
            
            // Add metrics
            elements.tblMetrics.innerHTML += `<tr class='border'><td>#</td><td class='text-left'>Total publications*</td><td>${workItems.total_papers}</td></tr>`;
            elements.tblMetrics.innerHTML += `<tr class='border'><td>#</td><td class='text-left'>Total citations*</td><td>${workItems.total_citations}</td></tr>`;
            elements.tblMetrics.innerHTML += `<tr class='border'><td>#</td><td class='text-left'>H-index*</td><td>${workItems.hindex}</td></tr>`;
            
            // Setup modal functionality
            const modalpub = document.getElementById("my-modal-publications");
            const btnOpen = document.getElementById("detailPublications");
            const btnClose = document.getElementById("ok-btn-publications");
            const modalreview = document.getElementById("my-total-review-modal");
            const modalmetrics = document.getElementById("my-metrics-modal");

            btnOpen.onclick = () => {
                modalreview.style.display = "none";
                modalmetrics.style.display = "none";
                modalpub.style.display = "block";
            };
            btnClose.onclick = () => {
                modalpub.style.display = "none";
            };
            
            // Build publications table
            const tblPub = document.getElementById("dtPublications");
            let dtTble = workItems.data.map((item, index) => 
                `<tr class='border'><td>${workItems.data.length - index}</td><td class='text-left'><a href='${item.gs_view}' target='_blank'>${item.title}</a></td><td>${item.year}</td><td><a href='${item.gs_link}' target='_blank'>${item.citation}</a></td></tr>`
            ).join('');
            tblPub.innerHTML = dtTble;

            elements.workCountText.innerHTML = workItems.total_papers;
            elements.citedCount.innerHTML = workItems.total_citations;
        }
        return workItems;
    } catch (errors) {
        console.error(errors);
    }
};

fethWorks();


const fethReviews = async () => {
    try {
        const response = await axios.get(`${API_BACKEND_URL}/orcid/${YOUR_ORCID}/reviews.json`);
        const workItems = response.data;

        if (workItems) {
            elements.animateLoading.classList.remove('animate-pulse');
            elements.totalReviews.classList.remove('bg-gray-300');
            elements.totalReviews.classList.add('bg-red-800');
            elements.tblReviewTitle.innerHTML = `${workItems.total_reviews} Verified peer reviews** <span class='hidden lg:block'>(Total outlets: ${workItems.total_outlets})</span>`;
            elements.totalReviews.innerHTML = `<button id='detailReviews'>${workItems.total_reviews}** Reviews</button>`;

            // Setup modal functionality
            const modalreview = document.getElementById("my-total-review-modal");
            const btnOpenReview = document.getElementById("detailReviews");
            const btnCloseReview = document.getElementById("ok-btn-reviews");
            const modalpub = document.getElementById("my-modal-publications");
            const modalmetrics = document.getElementById("my-metrics-modal");

            btnOpenReview.onclick = () => {
                modalpub.style.display = "none";
                modalmetrics.style.display = "none";
                modalreview.style.display = "block";
            };
            btnCloseReview.onclick = () => {
                modalreview.style.display = "none";
            };
            
            // Build reviews table
            const tblPubReview = document.getElementById("dtReviews");
            let dtTbleReview = workItems.data.map((item, index) => 
                `<tr class='border'><td>${workItems.data.length - index}</td><td class='text-left'><a href='https://portal.issn.org/resource/ISSN/${item.issn}' target='_blank'>${item.outlet} (${item.issn})</a></td><td>${item.reviews}</td></tr>`
            ).join('');
            tblPubReview.innerHTML = dtTbleReview;

            // Add metrics
            elements.tblMetrics.innerHTML += `<tr class='border'><td>#</td><td class='text-left'>Total verified reviews**</td><td>${workItems.total_reviews}</td></tr>`;
            elements.tblMetrics.innerHTML += `<tr class='border'><td>#</td><td class='text-left'>Total served outlets**</td><td>${workItems.total_outlets}</td></tr>`;
            elements.outletCount.innerHTML = workItems.total_outlets;
        }
        return workItems;
    } catch (errors) {
        console.error(errors);
    }
};

fethReviews();

const fethMetrics = async () => {
    try {
        const response = await axios.get(`${API_BACKEND_URL}/orcid/${YOUR_ORCID}/reviews.json`);
        const workItems = response.data;

        if (workItems) {
            const modalmetrics = document.getElementById("my-metrics-modal");
            const btnOpenMetrics = document.getElementById("openMetrics");
            const btnCloseMetrics = document.getElementById("ok-btn-metrics");
            const modalpub = document.getElementById("my-modal-publications");
            const modalreview = document.getElementById("my-total-review-modal");

            btnOpenMetrics.onclick = () => {
                modalpub.style.display = "none";
                modalreview.style.display = "none";
                modalmetrics.style.display = "block";
            };
            btnCloseMetrics.onclick = () => {
                modalmetrics.style.display = "none";
            };
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
            `[<a href='${item.link}' target='_blank' class='link' data-tippy-content='View this update'>${item.title}</a>]`
        ).join(', ');
        
        updates += ", <a href='https://aintlab.com/updates' class='link' data-tippy-content='View all updates' target='_blank'>[All updates].</a>";
        elements.recentUpdates.innerHTML = "Recent updates: " + updates;
    } catch (errors) {
        console.error(errors);
    }
};

// Initialize everything
const init = async () => {
    elements.metricnotes.innerHTML += `<iframe src="${API_BACKEND_URL}/authorid/${YOUR_GS_ID}.chart" frameborder="0" style="width:100%;height:280px"></iframe>`;
    
    // Run all fetch operations
    await Promise.all([
        fethWorks(),
        fethReviews(),
        fethMetrics(),
        fetchUpdates()
    ]);
};

// Start the application
init();

const yearbuild = document.getElementById("yearbuild");
yearbuild.innerHTML = new Date().getFullYear();

//Init tooltips
tippy('.link', {
    placement: 'bottom'
})

//Toggle mode
const toggle = document.querySelector('.js-change-theme');
const body = document.querySelector('body');
const profile = document.getElementById('profile');
const modalreview = document.getElementById("my-total-review-modal");
const modalpub = document.getElementById("my-modal-publications");
const modalmetrics = document.getElementById("my-metrics-modal");

toggle.addEventListener('click', () => {
    if (body.classList.contains('text-gray-900')) {
        toggle.innerHTML = "🌞";
        body.classList.remove('text-gray-900');
        body.classList.add('text-gray-100');
        profile.classList.remove('bg-white');
        profile.classList.add('bg-gray-900');
        modalreview.classList.remove('bg-white');
        modalreview.classList.add('bg-gray-900');
        modalpub.classList.remove('bg-white');
        modalpub.classList.add('bg-gray-900');
        modalmetrics.classList.remove('bg-white');
        modalmetrics.classList.add('bg-gray-900');
    } else {
        toggle.innerHTML = "🌛";
        body.classList.remove('text-gray-100');
        body.classList.add('text-gray-900');
        profile.classList.remove('bg-gray-900');
        profile.classList.add('bg-white');
        modalreview.classList.remove('bg-gray-900');
        modalreview.classList.add('bg-white');
        modalpub.classList.remove('bg-gray-900');
        modalpub.classList.add('bg-white');
        modalmetrics.classList.remove('bg-gray-900');
        modalmetrics.classList.add('bg-white');
    }
});
