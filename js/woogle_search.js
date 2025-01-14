// Declare dc_identifier as a global variable
let dc_identifier;

const urlParams = new URLSearchParams(window.location.search);
publisher_code = urlParams.get('publisher-code');

if (!publisher_code) {
  publisher_code = 'woogle_config';
}

const config = fetch(`/data/${publisher_code}.json`).then(response => response.json());

function loadLogo() {
  const logoElement = document.querySelector('.woogle-logo-sm');
  if (!logoElement) return;

  logoElement.removeAttribute('src');

  const fileTypes = ['png', 'jpg', 'jpeg', 'svg', 'gif'];
  const defaultLogo = 'assets/img/woogle.svg';

  function checkFileExists(url) {
    return fetch(url, { method: 'HEAD' })
      .then(response => response.ok)
      .catch(() => false);
  }

  function preloadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(src);
      img.onerror = () => reject();
      img.src = src;
    });
  }

  (async function() {
    for (const type of fileTypes) {
      const src = `assets/img/${publisher_code}.${type}?t=${new Date().getTime()}`;
      if (await checkFileExists(src)) {
        try {
          await preloadImage(src);
          logoElement.src = src;
          return;
        } catch (error) {
          console.warn(`Failed to load ${src}`);
        }
      }
    }
    logoElement.src = defaultLogo;
  })();
}

function loadLogo(filename) {
  const logoElement = document.querySelector('.woogle-logo-sm');
  if (!logoElement) return;

  logoElement.removeAttribute('src');

  const fileTypes = ['png', 'jpg', 'jpeg', 'svg', 'gif'];
  const defaultLogo = 'assets/img/woogle.svg';

  function checkFileExists(url) {
    return fetch(url, { method: 'HEAD' })
      .then(response => response.ok)
      .catch(() => false);
  }

  function preloadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(src);
      img.onerror = () => reject();
      img.src = src;
    });
  }

  (async function() {
    for (const type of fileTypes) {
      const src = `assets/img/${filename}.${type}?t=${new Date().getTime()}`;
      if (await checkFileExists(src)) {
        try {
          await preloadImage(src);
          logoElement.src = src;
          return;
        } catch (error) {
          console.warn(`Failed to load ${src}`);
        }
      }
    }
    logoElement.src = defaultLogo;
  })();
}

function setAccentColor(color) {
  document.documentElement.style.setProperty('--accent-color', color);
}
function setFontStyles(config) {
  const root = document.documentElement;

  // Check and set body font
  if (config.general.appearance.fonts.bodyFont !== "default") {
    root.style.setProperty('--bodyFont', config.general.appearance.fonts.bodyFont);
  } else {
    // If 'default', remove any previously set custom font to use Bootstrap's default
    root.style.removeProperty('--bodyFont');
  }

  // Check and set facet font
  if (config.general.appearance.fonts.facetFont !== "default") {
    root.style.setProperty('--facetFont', config.general.appearance.fonts.facetFont);
  } else {
    // If 'default', remove any previously set custom font to use Bootstrap's default
    root.style.removeProperty('--facetFont');
  }

  // Check and set header font
  if (config.general.appearance.fonts.headerFont !== "default") {
    root.style.setProperty('--headerFont', config.general.appearance.fonts.headerFont);
  } else {
    // If 'default', remove any previously set custom font to use Bootstrap's default
    root.style.removeProperty('--headerFont');
  }

  // Check and set ui font
  if (config.general.appearance.fonts.uiFont !== "default") {
    root.style.setProperty('--uiFont', config.general.appearance.fonts.uiFont);
  } else {
    // If 'default', remove any previously set custom font to use Bootstrap's default
    root.style.removeProperty('--uiFont');
  }

  // Additional checks for other font settings like subheaderFont can be added similarly
}


function updateDocumentTitle(publisherName) {
    if (publisherName) {
        document.title = `Woogle ${publisherName}`;
    } else {
        document.title = 'Woogle';
    }
}

window.onload = function () {

  // data/{publisher}.json
  fetch(`/data/${publisher_code}.json`)
    .then(response => response.json())
    .then(config => {
      dc_identifier = config.general.identifier;

      loadLogo(config.general.identifier);

      if (config.general && config.general.appearance && config.general.appearance.colors) {
        const accentColor = config.general.appearance.colors.accentColor;
        if (accentColor) {
          setAccentColor(accentColor);
        }
      }
      setFontStyles(config);

      document.querySelector('#year_min').addEventListener('change', function() {
        updateFilter('year-min', this.value);
      });

      document.querySelector('#year_max').addEventListener('change', function() {
        updateFilter('year-max', this.value);
      });

      document.querySelector('#type').addEventListener('change', function() {
        let selectedOption = this.list.querySelector(`option[value="${this.value}"]`);
        let type = selectedOption ? selectedOption.getAttribute('data-value') : '';
        updateFilter('type', type);
      });

      document.querySelector('#pid').addEventListener('change', function() {
        updateFilter('pid', this.value);
      });

      document.querySelector('#pid').addEventListener('input', function() {
        updateFilter('pid', this.value);
      });

      /* User clicks search button */
      document.querySelector('#search-button').onclick = function (e) {
        e.preventDefault();
        const searchQuery = document.querySelector('#query').value.trim();
        updateFilter('q', searchQuery);
      }

      /* User clicks enter */
      document.querySelector('#query').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          const searchQuery = this.value.trim();
          updateFilter('q', searchQuery);
        }
      });

      /* Municipality prefered layout */
      const layoutDirection = config.search.layout.direction;
            const layoutContainer = document.querySelector('.sui-layout-body__inner');

            if (layoutDirection === 'rtl') {
                layoutContainer.classList.remove('layout-ltr');
                layoutContainer.classList.add('layout-rtl');
            } else {
                layoutContainer.classList.remove('layout-rtl');
                layoutContainer.classList.add('layout-ltr');
            }
           
      ;

      try {
        document.querySelector('#order').addEventListener('change', function () {
          let href = new URL(window.location.href);
          let order = this.value;
          href.searchParams.set('order', order);
          
          // Remove 'infobox' and 'publisher' from the visible URL
          href.searchParams.delete('infobox');
          href.searchParams.delete('publisher');
          
          // Use history.pushState to update the URL without reloading the page
          window.history.pushState(null, '', href.toString());

          // Call getResults with refreshSidebar set to false
          getResults(false, dc_identifier);
        });
      } catch (error) { }

      /* set background of current tab */
      let current_url = document.location.href;
      document.querySelectorAll(".navbar .nav-link").forEach(function (e) {
        if (e.href == current_url) {
          e.classList.add("current");
        }
      });

      /* Change page */
      document.querySelectorAll('.woogle-pagination-nr').forEach(function (element) {
        element.onclick = function (e) {
          e.preventDefault();
          let href = new URL(window.location.href);
          
          href.searchParams.set('page', this.value);
          
          // Remove 'infobox' and 'publisher' from the visible URL
          href.searchParams.delete('infobox');
          href.searchParams.delete('publisher');
          
          window.history.pushState({}, '', href.toString());
          getResults(false, config.general.identifier);  // Pass publisher to getResults
        }
      });

      /* Facet selection */
      document.querySelectorAll('.woo-facet-value').forEach(function (element) {
        element.onclick = function (e) {
          e.preventDefault();
          let href = new URL(window.location.href);
          const publisher = href.searchParams.get('publisher');
          href.searchParams.set('page', 1);
          let parameterToSet = this.className.split(" ")[1];
          let value = this.getAttribute('data-value');
          
          href.searchParams.set(parameterToSet, value);
          
          // Remove 'infobox' and 'publisher' from the visible URL
          href.searchParams.delete('infobox');
          href.searchParams.delete('publisher');
          
          window.history.pushState({}, '', href.toString());
          getResults(true, publisher || dc_identifier);
        }
      });

      /* Expand facets */
      document.querySelectorAll('.woo-expand').forEach(function (element) {
        element.onclick = function () {
          let facetType = this.className.split(" ")[1];
          let collection = document.getElementsByClassName('facet-disabled ' + facetType);
          for (let i = 0; i < collection.length; i++) {
            collection[i].style.display = "block";
          }
          document.querySelector('.woo-collapse.' + facetType).style.display = 'block';
          this.style.display = 'none';
        }
      });

      /* Collapse facets */
      document.querySelectorAll('.woo-collapse').forEach(function (element) {
        element.onclick = function () {
          let facetType = this.className.split(" ")[1];
          let collection = document.getElementsByClassName('facet-disabled ' + facetType);
          for (let i = 0; i < collection.length; i++) {
            collection[i].style.display = "none";
          }
          document.querySelector('.woo-expand.' + facetType).style.display = 'block';
          this.style.display = 'none';
        }
      });

      /* Expand page hits */
      document.querySelectorAll('.woogle-expand-hits').forEach(function (element) {
        element.onclick = function () {
          let dossierId = this.className.split(" ")[1];
          let collection = document.getElementsByClassName('woogle-page-hits ' + dossierId);
          collection[0].style.display = 'block';
          document.querySelector('.woogle-collapse-hits.' + dossierId).style.display = 'block';
          this.style.display = 'none';
        }
      });

      /* Collapse page hits */
      document.querySelectorAll('.woogle-collapse-hits').forEach(function (element) {
        element.onclick = function () {
          let dossierId = this.className.split(" ")[1];
          let collection = document.getElementsByClassName('woogle-page-hits ' + dossierId);
          collection[0].style.display = 'none';
          document.querySelector('.woogle-expand-hits.' + dossierId).style.display = 'block';
          this.style.display = 'none';
        }
      });

      document.querySelectorAll('.crumb').forEach(function (element) {
        element.onclick = function () {
          handleDeleteCrumb(this);
        }
      });

      document.querySelectorAll('.register-click').forEach(function (element) {
        element.onclick = function () {
          registerClick(this);
        }
      });

      // Add event listener for search input
      document.querySelector('#query').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          const searchQuery = this.value.trim();
          updateFilter('q', searchQuery);
        }
      });

      // Add event listener for search button
      document.querySelector('#search-button').addEventListener('click', function(e) {
        e.preventDefault();
        const searchQuery = document.querySelector('#query').value.trim();
        updateFilter('q', searchQuery);
      });

      // Check for existing query parameter
      const urlParams = new URLSearchParams(window.location.search);
      const initialQuery = urlParams.get('q');
      if (initialQuery) {
        document.querySelector('#query').value = initialQuery;
      }

      // Move getResults call here
      getResults(true, dc_identifier);
    })
    .catch(error => {
      console.error('Error loading configuration:', error);
    });
};



function getDataListSelectedOption(txt_input, data_list_options) {
  let shownValElement = document.getElementById(txt_input);
  if (!shownValElement) return null;

  let shownVal = shownValElement.value;
  let docvalue = document.querySelector("#" + data_list_options + ' option[value="' + shownVal + '"]');
  if (docvalue == null) {
    return null;
  }
  let value2send = docvalue.dataset.value;
  return value2send;
}

// Add this debounce function at the top of your file
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

async function getResults(refreshSidebar, publisher) {
  showLoading();
  let href = new URL(window.location.href);
  let apiParams = new URLSearchParams(href.search);
  
  // Ensure the search query is included in the API call
  const searchQuery = href.searchParams.get('q') || document.querySelector('#query').value.trim() || '*';
  apiParams.set('q', searchQuery);

  // Remove 'infobox' from the visible URL
  href.searchParams.delete('infobox');
  
  // Remove 'publisher' from the visible URL, but keep it for the API call
  const publisherParam = publisher || href.searchParams.get('publisher');
  href.searchParams.delete('publisher');

  // Update the visible URL without reloading the page
  window.history.replaceState({}, '', href.toString());

  // Add 'infobox' and 'publisher' for the API call
  apiParams.set('infobox', 'true');
  if (publisherParam) {
    apiParams.set('publisher', publisherParam);
  }

  const cacheKey = `woogle_search_${apiParams.toString()}`;
  const cachedData = getCachedData(cacheKey);

  try {
    let data;
    if (cachedData) {
      data = cachedData;
    } else {
      const response = await fetch(`https://woogle.wooverheid.nl/search?${apiParams.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      data = await response.json();
      setCachedData(cacheKey, data);
    }

    const pid = href.searchParams.get('pid');
    updateResults(data, pid);
    updatePagingInfo(data);
    updatePagination(data.parameters.page, Math.ceil(data.total_hits / data.results_per_page));
    
    if (refreshSidebar) {
      updateSidebarFacets(data.facets);
      updateFilterInputs(data.parameters, data.facets);
      updateBreadcrumbs(data.parameters, data.facets);
    }

    prefetchNextPage(parseInt(data.parameters.page), apiParams);
    updatePagination(data.parameters.page, Math.ceil(data.total_hits / data.results_per_page));

  } catch (error) {
    console.error("Error fetching data:", error);
    showError("An error occurred while fetching results. Please try again later.");
  } finally {
    hideLoading();
  }
}function updateResults(data, pid) {
  const resultsContainer = document.querySelector('.sui-results-container');
  resultsContainer.innerHTML = ''; // Clear previous results

  if (!Array.isArray(data.hits)) {
    console.error('Unexpected response structure:', data);
    return;
  }

  function sanitizeHtml(html) {
    return (html || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/&lt;em&gt;/g, '<em>')
      .replace(/&lt;\/em&gt;/g, '</em>');
  }

  data.hits.forEach(result => {
    const li = document.createElement('li');
    li.className = 'sui-result accent-color-border';

    const header = document.createElement('div');
    header.className = 'sui-result__header';

    const title = document.createElement('h3');
    title.className = 'woogle-result-title';

    const titleLink = document.createElement('a');
    titleLink.className = 'register-click';

    if (result.dc_title) {
      // Regular search mode or PID search with dc_title available
      if (publisher_code === 'woogle_config') {
        titleLink.href = `dossier.html?pid=${result.dc_identifier}`;
      } else {
        titleLink.href = `dossier.html?publisher-code=${publisher_code}&pid=${result.dc_identifier}`;
      }
      titleLink.setAttribute('data-resource', result.dc_identifier || '');
      titleLink.innerHTML = sanitizeHtml(result.dc_title);
    } else {
      // Fallback for PID-specific search or when dc_title is not available
      titleLink.href = result.dc_source || '#';
      titleLink.setAttribute('data-resource', result.foi_documentId || result.dc_identifier || '');
      titleLink.target = '_blank';
      titleLink.innerHTML = sanitizeHtml(`📄 ${result.foi_fileName || 'Untitled'} - ${result.foi_dossierId || result.dc_identifier || 'Unknown'}`);
    }

    title.appendChild(titleLink);
    header.appendChild(title);
    li.appendChild(header);

    const body = document.createElement('div');
    body.className = 'sui-result__body';

    const description = document.createElement('div');
    description.className = 'sui-result__details woogle-result-description';
    
    if (pid) {
      // PID-specific search mode or when dc_description is not available
      description.innerHTML = sanitizeHtml(result.foi_highlight || '');
    } else {
      // Regular search mode
      if (result.dc_description) {
        description.innerHTML = sanitizeHtml(result.dc_description || '');
      } else {
        description.innerHTML = sanitizeHtml(result.dc_title || '');
      }
    }

    body.appendChild(description);
    li.appendChild(body);

    const footer = document.createElement('div');
    footer.className = 'sui-result__footer';

    const attributes = document.createElement('div');
    attributes.className = 'woogle-result-attributes';
    
    if (pid || result.foi_pageNumber) {
      attributes.innerHTML = `<span id="tags" class="text-bg-success">Pagina ${result.foi_pageNumber || ''}</span>`;
    } else {
      attributes.innerHTML = `<span id="tags">${result.dc_type_description || ''}</span><span id="tags">${result.dc_date || ''}</span>`;
    }

    footer.appendChild(attributes);

    // Add foi_pagehits information only if the search term is not '*'
    if (data.parameters.q !== '*' && result.foi_pagehits && Object.keys(result.foi_pagehits).length > 0) {
      const pageHitsContainer = document.createElement('div');
      pageHitsContainer.className = 'woogle-result-pages sui-result__details';
      pageHitsContainer.setAttribute('data-identifier', result.dc_identifier);

      const expandButton = document.createElement('a');
      expandButton.className = 'woogle-expand-hits woo-expand-collapse-button';
      expandButton.textContent = 'Bekijk pagina hits';
      expandButton.style.display = 'block';
      expandButton.setAttribute('data-identifier', result.dc_identifier);

      const collapseButton = document.createElement('a');
      collapseButton.className = 'woogle-collapse-hits woo-expand-collapse-button';
      collapseButton.textContent = 'Verberg pagina hits';
      collapseButton.style.display = 'none';
      collapseButton.setAttribute('data-identifier', result.dc_identifier);

      const pageHitsDiv = document.createElement('div');
      pageHitsDiv.className = 'woogle-page-hits';
      pageHitsDiv.setAttribute('data-identifier', result.dc_identifier);
      pageHitsDiv.style.display = 'none';

      Object.values(result.foi_pagehits).forEach(pagehit => {
        const pageHit = document.createElement('div');
        pageHit.className = 'woogle-page-hit';

        pageHit.innerHTML = `
          <h3 class="woogle-result-title">
            <a class="register-click" href="${pagehit.dc_source}" data-resource="${pagehit.foi_documentId}" target="_blank">
              📄 ${pagehit.foi_fileName} - ${pagehit.foi_pageNumber}
            </a>
          </h3>
          <div class="sui-result__details woogle-result-description">
            <span>${pagehit.foi_highlight}</span>
          </div>
        `;

        pageHitsDiv.appendChild(pageHit);
        pageHitsDiv.appendChild(document.createElement('hr'));
      });

      pageHitsContainer.appendChild(expandButton);
      pageHitsContainer.appendChild(collapseButton);
      pageHitsContainer.appendChild(pageHitsDiv);

      footer.appendChild(pageHitsContainer);
    }

    li.appendChild(footer);
    resultsContainer.appendChild(li);
  });

  // Update event listeners
  document.querySelectorAll('.woogle-expand-hits').forEach(button => {
    button.addEventListener('click', function() {
      const id = this.getAttribute('data-identifier');
      document.querySelector(`.woogle-page-hits[data-identifier="${id}"]`).style.display = 'block';
      this.style.display = 'none';
      document.querySelector(`.woogle-collapse-hits[data-identifier="${id}"]`).style.display = 'block';
    });
  });

  document.querySelectorAll('.woogle-collapse-hits').forEach(button => {
    button.addEventListener('click', function() {
      const id = this.getAttribute('data-identifier');
      document.querySelector(`.woogle-page-hits[data-identifier="${id}"]`).style.display = 'none';
      this.style.display = 'none';
      document.querySelector(`.woogle-expand-hits[data-identifier="${id}"]`).style.display = 'block';
    });
  });
}

function updateFilterInputs(parameters, facets) {
  // Update the search input with the current query, but don't show '*'
  const searchQuery = parameters['q'];
  document.querySelector('#query').value = searchQuery === '*' ? '' : (searchQuery || '');

  document.querySelector('#year_min').value = parameters['year-min'] || '';
  document.querySelector('#year_max').value = parameters['year-max'] || '';
  document.querySelector('#pid').value = parameters['pid'] || '';

  const typeInput = document.querySelector('#type');
  const typeDatalist = document.querySelector('#woo-types');
  if (typeInput && typeDatalist) {
    // Clear existing options
    typeDatalist.innerHTML = '';
    // Populate type options from facets
    if (facets && facets[2]) {
      Object.entries(facets[2]).forEach(([key, value]) => {
        const option = document.createElement('option');
        option.value = value.facet_name;
        option.setAttribute('data-value', key);
        typeDatalist.appendChild(option);
      });
    }
    // Set selected value
    if (parameters['type']) {
      const selectedOption = typeDatalist.querySelector(`option[data-value="${parameters['type']}"]`);
      typeInput.value = selectedOption ? selectedOption.value : '';
    } else {
      typeInput.value = '';
    }
  }

  // Populate year options
  const yearMinDatalist = document.querySelector('#woo-years-min');
  const yearMaxDatalist = document.querySelector('#woo-years-max');
  if (yearMinDatalist && yearMaxDatalist && facets && facets[1]) {
    // Clear existing options
    yearMinDatalist.innerHTML = '';
    yearMaxDatalist.innerHTML = '';
    // Populate year options from facets
    Object.keys(facets[1]).sort((a, b) => b - a).forEach(year => {
      const optionMin = document.createElement('option');
      const optionMax = document.createElement('option');
      optionMin.value = year;
      optionMax.value = year;
      yearMinDatalist.appendChild(optionMin);
      yearMaxDatalist.appendChild(optionMax);
    });
  }
}

function updatePagingInfo(data) {
  const pagingInfoContainer = document.querySelector('.paging-info');
  if (!pagingInfoContainer) return;

  const totalHits = data.total_hits;
  const resultsPerPage = data.results_per_page;
  const currentPage = parseInt(data.parameters.page) || 1;
  const startResult = (currentPage - 1) * resultsPerPage + 1;
  const endResult = Math.min(startResult + resultsPerPage - 1, totalHits);
  
  let pagingInfoText = `Resultaat <strong>${startResult.toLocaleString('nl')}</strong> - <strong>${endResult.toLocaleString('nl')}</strong> van de <strong>${totalHits.toLocaleString('nl')}</strong> resultaten`;

  // Add search term info only if it's not '*'
  if (data.parameters.q && data.parameters.q !== '*') {
    pagingInfoText += ` voor zoekterm '<strong>${data.parameters.q}</strong>'`;
  }

  // Add dossier info if present
  if (data.parameters.pid) {
    pagingInfoText += ` in dossier(s) <strong>${data.parameters.pid}</strong>`;
  }

  const pagingInfoElement = document.querySelector('.paging-info');
  pagingInfoElement.innerHTML = pagingInfoText;
}

function updateSidebarFacets(facetData) {
    const facetContainer = document.querySelector('.woo-facets');
    facetContainer.innerHTML = ''; // Clear existing facets and titles

    // Facet labels and keys mapping
    const facetLabels = {
        type: 'Publicatietype',
        year: 'Jaar'
    };

    // Function to create and append a facet group
    function createFacetGroup(facetKey, facetValues) {
        if (Object.keys(facetValues).length > 0) {
            // Create and append legend (title)
            const legend = document.createElement('legend');
            legend.className = 'sui-facet__title accent-color-border';
            legend.textContent = facetLabels[facetKey];
            facetContainer.appendChild(legend);

            // Create and append ul
            const ul = document.createElement('ul');
            ul.className = 'woo-facet';
            facetContainer.appendChild(ul);

            // Sort facet values
            const sortedFacets = Object.entries(facetValues).sort((a, b) => {
                if (facetKey === 'year') {
                    return parseInt(b[0]) - parseInt(a[0]); // Descending order for years
                } else {
                    return a[1].facet_name.localeCompare(b[1].facet_name); // Alphabetical order for others
                }
            });

            const debouncedGetResults = debounce((refreshSidebar) => {
                getResults(refreshSidebar, dc_identifier);
            }, 300); // 300ms debounce time

            // Append facet values as list items
            sortedFacets.forEach(([key, value]) => {
                const li = document.createElement('li');
                const button = document.createElement('button');
                button.className = `woo-facet-value ${facetKey}`;
                button.textContent = `${value.facet_name || key} (${value.value.toLocaleString('nl')})`;
                button.value = key;
                button.onclick = function (event) {
                    event.preventDefault();
                    let href = new URL(window.location.href);
                    const publisher = href.searchParams.get('publisher');
                    href.searchParams.set('page', 1);
                    if (facetKey === 'year') {
                        href.searchParams.set('year', this.value);
                    } else {
                        href.searchParams.set(facetKey, this.value);
                    }
                    
                    // Remove 'infobox' and 'publisher' from the visible URL
                    href.searchParams.delete('infobox');
                    href.searchParams.delete('publisher');
                    
                    // Update the URL without reloading the page
                    window.history.pushState({}, '', href.toString());
                    
                    // Show loading indicator
                    showLoading();
                    
                    // Use debounced getResults
                    debouncedGetResults(true);
                };
                li.appendChild(button);
                ul.appendChild(li);
            });
        }
    }

    // Create facet groups in the desired order
    createFacetGroup('type', facetData[2] || {}); // Publicatietype
    createFacetGroup('year', facetData[1] || {}); // Jaar
}

function updateBreadcrumbs(parameters, facets) {
    const breadcrumbContainer = document.querySelector('.breadcrumbs');
    if (!breadcrumbContainer) return; // Check if the element exists
    breadcrumbContainer.innerHTML = ''; // Clear existing breadcrumbs

    // Keys to include in the breadcrumbs
    const keysToInclude = ['q', 'type', 'year', 'year-min', 'year-max'];

    keysToInclude.forEach(key => {
        if (parameters[key] && parameters[key] !== '*') {
            const crumb = document.createElement('span');
            crumb.className = 'btn btn-outline-danger btn-sm crumb';
            crumb.setAttribute('data-crumb', `crumb_${key}`);
            crumb.onclick = function () {
                handleDeleteCrumb(this);
            };

            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete is-small';
            deleteButton.innerHTML = '&times;';

            const crumbText = document.createElement('span');
            let displayText = '';

            switch (key) {
                case 'q':
                    displayText = `Zoekterm: ${parameters[key]}`;
                    break;
                case 'type':
                    // Look up the type_name in the facets
                    const typeInfo = facets.find(facet => facet[parameters[key]]);
                    const typeName = typeInfo ? typeInfo[parameters[key]].facet_name : parameters[key];
                    displayText = `Type: ${typeName}`;
                    break;
                case 'year':
                    displayText = `Jaar: ${parameters[key]}`;
                    break;
                case 'year-min':
                    displayText = `Vanaf: ${parameters[key]}`;
                    break;
                case 'year-max':
                    displayText = `Tot: ${parameters[key]}`;
                    break;
                default:
                    displayText = parameters[key];
            }

            crumbText.textContent = ` ${displayText}`;

            crumb.appendChild(deleteButton);
            crumb.appendChild(crumbText);
            breadcrumbContainer.appendChild(crumb);
        }
    });
}

function updatePagination(currentPage, totalPages) {
  const paginationContainer = document.querySelector('.woogle-pagination');
  if (!paginationContainer) return;

  currentPage = parseInt(currentPage);
  totalPages = parseInt(totalPages);

  let paginationHTML = '';

  // Show << only if there are more than 10 pages and we're not on the first page
  if (totalPages > 10 && currentPage > 1) {
    paginationHTML += `<button class="woogle-pagination-nr btn btn-light" value="1"><<</button>`;
  }

  // Show < if we're not on the first page
  if (currentPage > 1) {
    paginationHTML += `<button class="woogle-pagination-nr btn btn-light" value="${currentPage - 1}"><</button>`;
  }

  // Calculate the range of page numbers to show
  let startPage = Math.max(1, currentPage - 4);
  let endPage = Math.min(totalPages, startPage + 9);
  startPage = Math.max(1, endPage - 9);

  for (let i = startPage; i <= endPage; i++) {
    if (i === currentPage) {
      paginationHTML += `<button class="woogle-pagination-nr btn btn-dark" value="${i}">${i}</button>`;
    } else {
      paginationHTML += `<button class="woogle-pagination-nr btn btn-light" value="${i}">${i}</button>`;
    }
  }

  // Show > if we're not on the last page
  if (currentPage < totalPages) {
    paginationHTML += `<button class="woogle-pagination-nr btn btn-light" value="${currentPage + 1}">></button>`;
  }

  // Show >> only if there are more than 10 pages and we're not on the last page
  if (totalPages > 10 && currentPage < totalPages) {
    paginationHTML += `<button class="woogle-pagination-nr btn btn-light" value="${totalPages}">>></button>`;
  }

  paginationContainer.innerHTML = paginationHTML;

  // Add event listeners to the new pagination buttons
  document.querySelectorAll('.woogle-pagination-nr').forEach(function (element) {
    element.onclick = function (e) {
      e.preventDefault();
      let href = new URL(window.location.href);
      
      href.searchParams.set('page', this.value);
      
      href.searchParams.delete('infobox');
      href.searchParams.delete('publisher');
      
      window.history.pushState({}, '', href.toString());

      config.then(config => {
        getResults(false, config.general.identifier);
      });
    }
  });
}

function handleDeleteCrumb(crumbElement) {
  const crumb = crumbElement.getAttribute('data-crumb').split('_')[1];
  const publisher = new URL(window.location.href).searchParams.get('publisher');

  if (crumb === 'q') {
    document.querySelector('#query').value = ''; // Clear the search input
  }
  updateFilter(crumb, null); // This will delete the parameter or set q to '*'
}

function registerClick(resource) {
  var click_data = {
    'resourceID': resource.getAttribute('data-resource'),
    'query': document.querySelector('#query').value,
    'publisher': getDataListSelectedOption('publisher', 'woo-creators'),
    'year_min': document.querySelector('#year_min').value,
    'year_max': document.querySelector('#year_max').value,
    'publication_type': getDataListSelectedOption('type', 'woo-types')
  };

  /* Send click data to server */
  $.ajax({
    url: '/register_click',
    type: 'POST',
    data: JSON.stringify(click_data),   // converts js value to JSON string
    contentType: 'application/json',  // sends json
  })
    .done(function () {     // on success get the return object from server
      return true;       // do whatever with it. In this case see it in console
    });
}

window.addEventListener("pageshow", function (event) {
  var historyTraversal = event.persisted ||
    (typeof window.performance != "undefined" &&
      window.performance.navigation.type === 2);
  if (historyTraversal) {
    // Handle page restore.
    window.location.reload();
  }

  var perfEntries = performance.getEntriesByType("navigation");

  if (perfEntries[0].type === "back_forward") {
    location.reload();
  }
});

// Make sure to call getResults when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Load configuration
    fetch(`/data/${publisher_code}.json`)
        .then(response => response.json())
        .then(config => {
            dc_identifier = config.general.identifier;
            // Initial load
            getResults(true, dc_identifier);
        })
        .catch(error => {
            console.error('Error loading configuration:', error);
        });

    // ... (other event listeners)
});

function showLoading() {
    document.getElementById('loading-overlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading-overlay').style.display = 'none';
}

function prefetchNextPage(currentPage, searchParams) {
  const nextPage = currentPage + 1;
  const nextPageParams = new URLSearchParams(searchParams);
  nextPageParams.set('page', nextPage);
  nextPageParams.set('infobox', 'true');
  
  // Always add 'publisher' for the API call
  const publisher = new URL(window.location.href).searchParams.get('publisher-code');
  if (publisher) {
    nextPageParams.set('publisher', publisher);
  }
  
  const cacheKey = `woogle_search_${nextPageParams.toString()}`;
  
  // Check if we already have this page cached
  if (getCachedData(cacheKey)) {
    return;
  }

  fetch(`https://woogle.wooverheid.nl/search?${nextPageParams.toString()}`)
    .then(response => response.json())
    .then(data => {
      setCachedData(cacheKey, data);
    })
    .catch(error => console.error('Error prefetching next page:', error));
}

function setCachedData(key, data) {
  try {
    clearOldCache();
    localStorage.setItem(key, JSON.stringify({
      ...data,
      parameters: {
        ...data.parameters,
        page: data.parameters.page || '1'
      },
      lastAccessed: Date.now() // Add timestamp for cache management
    }));
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      clearAllCache();
      // Try setting the item again
      try {
        localStorage.setItem(key, JSON.stringify({
          ...data,
          parameters: {
            ...data.parameters,
            page: data.parameters.page || '1'
          },
          lastAccessed: Date.now()
        }));
      } catch (e) {
      }
    } else {
    }
  }
}

function clearAllCache() {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('woogle_search_')) {
      localStorage.removeItem(key);
    }
  });
}

function getCachedData(key) {
  const cachedData = localStorage.getItem(key);
  if (cachedData) {
    const parsedData = JSON.parse(cachedData);
    // Update last accessed time
    setCachedData(key, { ...parsedData, lastAccessed: Date.now() });
    return parsedData;
  }
  return null;
}

function updateFilter(paramName, value) {
  let href = new URL(window.location.href);
  
  if (value && value !== '*') {
    href.searchParams.set(paramName, value);
  } else {
    if (paramName === 'q') {
      href.searchParams.set(paramName, '*');
    } else {
      href.searchParams.delete(paramName);
    }
  }
  
  href.searchParams.delete('page');
  href.searchParams.delete('infobox');
  href.searchParams.delete('publisher');
  
  window.history.pushState({}, '', href.toString());
  getResults(true, dc_identifier);
}

// Add this function to display errors to the user
function showError(message) {
  const errorContainer = document.createElement('div');
  errorContainer.className = 'error-message';
  errorContainer.textContent = message;
  document.querySelector('.sui-results-container').appendChild(errorContainer);
}

function clearOldCache() {
  const maxCacheEntries = 20; // Adjust this number based on your needs
  const cacheKeys = Object.keys(localStorage).filter(key => key.startsWith('woogle_search_'));
  
  if (cacheKeys.length > maxCacheEntries) {
    // Sort cache keys by access time (oldest first)
    cacheKeys.sort((a, b) => {
      const aData = JSON.parse(localStorage.getItem(a));
      const bData = JSON.parse(localStorage.getItem(b));
      return (aData.lastAccessed || 0) - (bData.lastAccessed || 0);
    });

    // Remove oldest entries
    const entriesToRemove = cacheKeys.length - maxCacheEntries;
    for (let i = 0; i < entriesToRemove; i++) {
      localStorage.removeItem(cacheKeys[i]);
    }
  }
}

// Update event listeners
document.querySelector('#search-button').addEventListener('click', function(e) {
  e.preventDefault();
  const searchQuery = document.querySelector('#query').value.trim();
  updateFilter('q', searchQuery);
});

document.querySelector('#query').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    const searchQuery = this.value.trim();
    updateFilter('q', searchQuery);
  }
});