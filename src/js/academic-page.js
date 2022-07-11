/* academic-page v0.1.1 | (c) 2022 by Muhammad Syafrudin */

const YOUR_ORCID = "0000-0002-5640-4413"; // change this value with your actual ORCID

const fethWorks = async () => {
    try {
        const response = await axios.get('https://academic-page.herokuapp.com/orcid/'+YOUR_ORCID+'/works');
        const workItems = response.data;
        //console.log(workItems)
        const animateLoading = document.getElementById('animateLoading');
        const workCount = document.getElementById('workCount');
        const hIndex = document.getElementById('hIndex');
        const totalCitations = document.getElementById('totalCitations');
        const footerInfo = document.getElementById('additionalInfo');
        if (workItems) {
            animateLoading.classList.remove('animate-pulse');
            workCount.classList.remove('bg-gray-300');
            hIndex.classList.remove('bg-gray-300');
            totalCitations.classList.remove('bg-gray-300');
            workCount.classList.add('bg-red-800');
            hIndex.classList.add('bg-red-800');
            totalCitations.classList.add('bg-red-800');

            workCount.innerHTML = "<button id='detailPublications'>Publications*: " + workItems.total_papers + "</button>";
            totalCitations.innerHTML = "Citations*: " + workItems.total_citations;
            hIndex.innerHTML = "H-index*: " + workItems.hindex;
            footerInfo.innerHTML = '<p class="italic">*This data only shows the publications with valid Digital Object Identifier addresses. They are obtained from ORCID and Crossref independently, and may differ from Google Scholar. Generated as of ' + workItems.updated + '.</p>';
            const modal = document.getElementById("my-modal");
            const btnOpen = document.getElementById("detailPublications");
            const btnClose = document.getElementById("ok-btn");
            btnOpen.onclick = function () {
                modal.style.display = "block";
            }
            btnClose.onclick = function () {
                modal.style.display = "none";
            }
            const tblPub = document.getElementById("dtPublications");
            let dtTble = "";
            let no = workItems.data.length;
            for (var i = 0; i < workItems.data.length; i++) {
                dtTble += "<tr class='border'><td>" + no + "</td><td class='text-left'><a href='https://doi.org/" + workItems.data[i]["doi"] + "' target='_blank'>" + workItems.data[i]["title"] + "</a></td><td>" + workItems.data[i]["year"] + "</td><td>" + workItems.data[i]["type"].split('-')[0] + "</td><td><a href='https://scholar.google.com/scholar_lookup?doi=" + workItems.data[i]["doi"] + "' target='_blank'>" + workItems.data[i]["citation"] + "</a></td></tr>"
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
