/* academic-page v0.1.1 | (c) 2022 by Muhammad Syafrudin */

const YOUR_ORCID = "0000-0002-5640-4413"; // change this value with your actual ORCID

let tblMetrics = document.getElementById("dtMetrics");

const fethWorks = async () => {
    try {
        const response = await axios.get('https://api.muhammadsyafrudin.com/orcid/'+YOUR_ORCID+'/works');
        const workItems = response.data;
        //console.log(workItems)
        const animateLoading = document.getElementById('animateLoading');
        const workCount = document.getElementById('workCount');
        const footerInfo = document.getElementById('additionalInfo');
        const tblTitle = document.getElementById('tblTitle');

        if (workItems) {
            animateLoading.classList.remove('animate-pulse');
            workCount.classList.remove('bg-gray-300');
            workCount.classList.add('bg-red-800');
            tblTitle.innerHTML = workItems.total_papers + "* Publications (Citations: "+ workItems.total_citations+", H-index: "+ workItems.hindex+")";
            workCount.innerHTML = "<button id='detailPublications'>" + workItems.total_papers + "* Publications</button>";

            footerInfo.innerHTML = '<p class="italic">*This data are obtained from ORCID and Crossref (with valid Digital Object Identifier) independently, and may differ from Google Scholar. Generated as of ' + workItems.updated + '.</p>';
            const modalpub = document.getElementById("my-modal-publications");
            const btnOpen = document.getElementById("detailPublications");
            const btnClose = document.getElementById("ok-btn-publications");
            const modalreview = document.getElementById("my-total-review-modal");
            const modalmetrics = document.getElementById("my-metrics-modal");

            //add the metrics
            tblMetrics.innerHTML += "<tr class='border'><td>#</td><td class='text-left'>Total publications</td><td>"+ workItems.total_papers +"</td></tr>";
            tblMetrics.innerHTML += "<tr class='border'><td>#</td><td class='text-left'>Total citations</td><td>"+ workItems.total_citations +"</td></tr>";
            tblMetrics.innerHTML += "<tr class='border'><td>#</td><td class='text-left'>H-index</td><td>"+ workItems.hindex +"</td></tr>";

            btnOpen.onclick = function () {
                modalreview.style.display = "none";
                modalmetrics.style.display = "none";
                modalpub.style.display = "block";
            }
            btnClose.onclick = function () {
                modalpub.style.display = "none";
            }
            const tblPub = document.getElementById("dtPublications");
            let dtTble = "";
            let no = workItems.data.length;
            for (var i = 0; i < workItems.data.length; i++) {
                dtTble += "<tr class='border'><td>" + no + "</td><td class='text-left'><a href='https://doi.org/" + workItems.data[i]["doi"] + "' target='_blank'>" + workItems.data[i]["title"] + "</a></td><td>" + workItems.data[i]["year"] + "</td><td class='hidden lg:block'>" + workItems.data[i]["type"] + "</td><td><a href='https://scholar.google.com/scholar_lookup?doi=" + workItems.data[i]["doi"] + "' target='_blank'>" + workItems.data[i]["citation"] + "</a></td></tr>"
                no -= 1;
            }
            tblPub.innerHTML = dtTble;
            //console.log(dtTble);


        }
        return workItems;
    } catch (errors) {
        console.error(errors);
    }
};

fethWorks();


const fethReviews = async () => {
    try {
        const response = await axios.get('https://api.muhammadsyafrudin.com/orcid/'+YOUR_ORCID+'/reviews');
        const workItems = response.data;
        //console.log(workItems)
        const animateLoading = document.getElementById('animateLoading');
        const totalReviews = document.getElementById('totalReviews');
        const tblReviewTitle = document.getElementById('tblReviewTitle');

        if (workItems) {
            animateLoading.classList.remove('animate-pulse');
            totalReviews.classList.remove('bg-gray-300');
            totalReviews.classList.add('bg-red-800');
            tblReviewTitle.innerHTML = workItems.total_reviews + "* Verified peer reviews (Total outlets: "+ workItems.total_outlets+")";
            totalReviews.innerHTML = "<button id='detailReviews'>" + workItems.total_reviews+ "* Reviews</button>";

            const modalreview = document.getElementById("my-total-review-modal");
            const btnOpenReview = document.getElementById("detailReviews");
            const btnCloseReview = document.getElementById("ok-btn-reviews");
            const modalpub = document.getElementById("my-modal-publications");
            const modalmetrics = document.getElementById("my-metrics-modal");


            btnOpenReview.onclick = function () {
                modalpub.style.display = "none";
                modalmetrics.style.display = "none";
                modalreview.style.display = "block";
            }
            btnCloseReview.onclick = function () {
                modalreview.style.display = "none";
            }
            const tblPubReview = document.getElementById("dtReviews");
            let dtTbleReview = "";
            let no = workItems.data.length;
            for (var i = 0; i < workItems.data.length; i++) {
                dtTbleReview += "<tr class='border'><td>" + no + "</td><td class='text-left'><a href='https://portal.issn.org/resource/ISSN/" + workItems.data[i]["issn"] + "' target='_blank'>" + workItems.data[i]["outlet"] + " ("+workItems.data[i]["issn"]+")</a></td><td>" + workItems.data[i]["reviews"] + "</td></tr>"
                no -= 1;
            }
            tblPubReview.innerHTML = dtTbleReview;

            tblMetrics.innerHTML += "<tr class='border'><td>#</td><td class='text-left'>Total verified reviews</td><td>"+ workItems.total_reviews +"</td></tr>";
            tblMetrics.innerHTML += "<tr class='border'><td>#</td><td class='text-left'>Total outlets</td><td>"+ workItems.total_outlets +"</td></tr>";
            //console.log(dtTble);
        }
        return workItems;
    } catch (errors) {
        console.error(errors);
    }
};

fethReviews();

//metrics dtMetrics

const fethMetrics = async () => {
    try {
        const response = await axios.get('https://api.muhammadsyafrudin.com/orcid/'+YOUR_ORCID+'/reviews');
        const workItems = response.data;

        if (workItems) {

            const modalmetrics = document.getElementById("my-metrics-modal");
            const btnOpenMetrics = document.getElementById("openMetrics");
            const btnCloseMetrics = document.getElementById("ok-btn-metrics");
            const modalpub = document.getElementById("my-modal-publications");
            const modalreview = document.getElementById("my-total-review-modal");

            btnOpenMetrics.onclick = function () {
                modalpub.style.display = "none";
                modalreview.style.display = "none";
                modalmetrics.style.display = "block";
            }
            btnCloseMetrics.onclick = function () {
                modalmetrics.style.display = "none";
            }


        }
        return workItems;
    } catch (errors) {
        console.error(errors);
    }
};

fethMetrics()

const metricnotes = document.getElementById('metricnotes');
metricnotes.innerHTML = "<p class='pt-4 text-left text-gray-500 text-xs ps-2 italic'>*This data are obtained from ORCID and Crossref (with valid Digital Object Identifier) independently, and may differ from <a href='https://scholar.google.co.kr/citations?user=WLTzkOMAAAAJ&hl=en' target='_blank'>Google Scholar.</a></p>";

//recentUpdates
const fetchUpdates = async () => {
    try {
            const recentData = document.getElementById('recentUpdates');
            const response = await axios.get('https://research.muhammadsyafrudin.com/updates/rss.xml');
            const rssdataxml = response.data;
            const updatedata = fromXML(rssdataxml);
            const recentupdates = updatedata.rss.channel.item.slice(0, 4);
            //console.log(recentupdates);
            let updates = "";
            for (var i = 0; i < recentupdates.length; i++) {
                updates += "[<a href='"+recentupdates[i].link+"' target='_blank' class='link' data-tippy-content='View this update'>"+ recentupdates[i].title + "</a>], "
            }
            updates += "<a href='https://research.muhammadsyafrudin.com/updates' class='link' data-tippy-content='View all updates' target='_blank'>[All updates].</a>";
            recentData.innerHTML = "Recent updates: "+updates;

        } catch (errors) {
        console.error(errors);
    }
};

fetchUpdates();

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
const modal = document.getElementById("my-modal");

toggle.addEventListener('click', () => {
    if (body.classList.contains('text-gray-900')) {
        toggle.innerHTML = "🌞";
        body.classList.remove('text-gray-900');
        body.classList.add('text-gray-100');
        profile.classList.remove('bg-white');
        profile.classList.add('bg-gray-900');
        modal.classList.remove('bg-white');
        modal.classList.add('bg-gray-900');
    } else {
        toggle.innerHTML = "🌛";
        body.classList.remove('text-gray-100');
        body.classList.add('text-gray-900');
        profile.classList.remove('bg-gray-900');
        profile.classList.add('bg-white');
        modal.classList.remove('bg-gray-900');
        modal.classList.add('bg-white');
    }
});
