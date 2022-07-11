# academic-page
- Tailwind v2 and Javascript were used to create a single academic page that displayed publications from ORCID and Crossref. 
- [Profile Card](https://github.com/tailwindtoolbox/Profile-Card) was used as a starting point.
- The publication data is independently pulled from ORCID and Crossref. So, please add your publication to the ORCID website at https://orcid.org.
- You need to have NodeJS: https://nodejs.org/en/installed on your computer in order to run the `npm` command.

![Academic-Page](academic-page-demo.gif)

# DEMO

LIVE: https://academic-page.pages.dev (Hosted on Pages, FREE, Thanks to Cloudflare!)

# How to
Use this template: https://github.com/justudin/academic-page/generate and make few 3 changes:

- In `src/img` https://github.com/justudin/academic-page/tree/main/src/img : change the images as you wish but please mantain the filename as the same.
```
background_{1,2,3} <- for the background images
profile_mobile <- for the profile picture shows in the mobile device
profile_desktop <- for the profile picture shows in the desktop
```

- In `src/js/academic-page.js` https://github.com/justudin/academic-page/blob/main/src/js/academic-page.js : Change the ORCID with your ID
```
const YOUR_ORCID = "0000-0002-5640-4413"; // change this value with your actual ORCID

``` 

- In `src/index.html` : change your name, biography, links, etc as you wish.

Finally, run the following commands to install the dependencies and build the website:

- To install the dependencies
```
npm install 
```

- To build the website
```
npm run build
```

The generated site will be placed in the `public` folder, where you can copy/upload the files to any static hosting, such as cloudflare pages, github pages, and so on.

# License
MIT