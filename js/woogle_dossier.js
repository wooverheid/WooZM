// Define hidden fields at the top of the script
const SOCIAL_METADATA_FIELDS = ['foi_twitter', 'foi_linkedIn', 'foaf_homepage', 'foi_wikipedia'];

// Get code from url
const urlParams = new URLSearchParams(window.location.search);
publisher_code = urlParams.get('publisher-code');

if (!publisher_code) {
    publisher_code = 'woogle_config';
}

const HIDDEN_METADATA_FIELDS = [
    ...SOCIAL_METADATA_FIELDS,
    'foi_function',
    'dc_type',
    'dc_creator',
    'foi_page_title',
    'tooiwl_rubriek',
    'tooiwl_rubriekCode'
];

document.addEventListener('DOMContentLoaded', function () {
    
    save_config = null;
    
    fetch(`/data/${publisher_code}.json`)
        .then(response => response.json())
        .then(config => {
            if (config.general && config.general.appearance && config.general.appearance.colors) {
                const accentColor = config.general.appearance.colors.accentColor;
                if (accentColor) {
                    setAccentColor(accentColor);
                }
            }
            setFontStyles(config);
            
            // Adjust this line to correctly access the metadataLayout
            if (config.dossier && config.dossier.metadataLayout) {
                adjustLayout(config.dossier.metadataLayout);
            }

            save_config = config;
        })
        .catch(error => {
            console.error('Error loading configuration:', error);
        });

    const pid = urlParams.get('pid');

    if (pid) {
        const proxyUrl = `/api/proxy?pid=${pid}`;
    
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        fetch(proxyUrl, { signal: controller.signal })
        .then(response => {
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (!data || !data.infobox) {
                throw new Error('Invalid data structure received from API');
            }
            updatePageContent(data, save_config.dossier.metadata);
        })
        .catch(error => {
            console.log(error);
            let errorMessage = 'Er is een fout opgetreden bij het ophalen van de dossiergegevens. ';
            if (error.name === 'AbortError') {
                errorMessage += 'De server reageert niet binnen de verwachte tijd. ';
            } else if (error.message.includes('504')) {
                errorMessage += 'De externe server reageert niet (Gateway Timeout). ';
            }
            errorMessage += 'Probeer het later opnieuw.';
            
            document.body.innerHTML = `
                <div style="text-align: center; padding: 20px; font-family: Arial, sans-serif;">
                    <h1>Fout</h1>
                    <p>${errorMessage}</p>
                </div>
            `;
        });
    } else {
        document.body.innerHTML = '<p>Geen PID opgegeven in de URL. Controleer de URL en probeer het opnieuw.</p>';
    }

    function updatePageContent(data, metadataConfig) {
        const infobox = data.infobox;

        try {
            document.title = infobox.foi_page_title || infobox.dc_title || 'Dossier';
            document.getElementById('page_title').textContent = infobox.foi_page_title || infobox.dc_title || 'Dossier';
            
            if (publisher_code === 'woogle_config') {
                setElementContent('woogle_id', infobox.dc_identifier, `dossier.html?pid=${infobox.dc_identifier}`);
                setElementContent('woogle_titel', infobox.dc_title, `dossier.html?pid=${infobox.dc_identifier}`);
            } else {
                setElementContent('woogle_id', infobox.dc_identifier, `dossier.html?publisher-code=${publisher_code}&pid=${infobox.dc_identifier}`);
                setElementContent('woogle_titel', infobox.dc_title, `dossier.html?publisher-code=${publisher_code}&pid=${infobox.dc_identifier}`);
            }
            setElementContent('woogle_json', null, `https://pid.wooverheid.nl/?pid=${infobox.dc_identifier}&infobox=true`);
            setElementContent('woogle_date_result', 
                [
                    infobox.foi_publishedDate ? `[Gepubliceerd: ${infobox.foi_publishedDate}]` : '',
                    infobox.dc_description ? infobox.dc_description : infobox.dc_title
                ].filter(Boolean).join(' ')
            );
            
            updateZipDownloadLink(infobox.dc_identifier);
            updateDocuments(infobox.foi_files, infobox);
            updateSocialLinks(infobox);
            updateMetadataTable(infobox, metadataConfig);
            updateWooIndexInfobox(infobox);
            updateMetaAttributes(infobox);

        } catch (error) {
            document.body.innerHTML += `<p>Error updating content: ${error.message}</p>`;
        }
    }

    function setElementContent(id, text, href) {
        const element = document.getElementById(id);
        if (element) {
            if (text) element.textContent = text;
            if (href) element.href = href;
        } else {
            console.warn(`Element with id '${id}' not found`);
        }
    }

    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    async function updateMetadataTable(infobox, metadataConfig) {
        try {

            
            const response = await fetch('/api/metadata_translation');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const tableBody = document.querySelector('.infobox table tbody');
            tableBody.innerHTML = '';

            for (const metadataField of metadataConfig) {
                
                if (metadataField.visible === false) {
                    continue;
                }
                
                if (!infobox[metadataField.key] === undefined || HIDDEN_METADATA_FIELDS.includes(metadataField.key)) {
                    continue;
                }

                console.log(metadataField.key);

                let value = infobox[metadataField.key];
                let key = metadataField.key;

                if (!value || typeof value === 'object') {
                    continue;
                }

                const row = document.createElement('tr');
                
                const labelCell = document.createElement('td');
                const label = metadataField.label || key;
                labelCell.textContent = label;
                
                const valueCell = document.createElement('td');
                
                if (key === 'dc_source') {
                    // Special handling for dc_source
                    const link = document.createElement('a');
                    link.href = value;
                    link.target = '_blank';
                    link.textContent = 'Originele publicatie';
                    valueCell.appendChild(link);
                } else {
                    valueCell.textContent = value;
                }
                
                row.appendChild(labelCell);
                row.appendChild(valueCell);
                tableBody.appendChild(row);
            }
        } catch (error) {
            console.log(error);
            updateMetadataTableWithoutLabels(infobox);
        }
    }

    function updateMetadataTableWithoutLabels(infobox) {
        const tableBody = document.querySelector('.infobox table tbody');
        tableBody.innerHTML = '';

        for (const [key, value] of Object.entries(infobox)) {
            if (value && typeof value !== 'object' && !HIDDEN_METADATA_FIELDS.includes(key)) {
                const row = document.createElement('tr');
                
                const labelCell = document.createElement('td');
                labelCell.textContent = key;
                
                const valueCell = document.createElement('td');
                valueCell.textContent = value;
                
                row.appendChild(labelCell);
                row.appendChild(valueCell);
                tableBody.appendChild(row);
            }
        }
    }

    function updateDocuments(foiFiles, infobox) {
        const documentContainer = document.querySelector('.documents');
        if (!documentContainer) {
            console.error('Document container not found');
            return;
        }
        documentContainer.innerHTML = '';

        const sortedFileTypes = ['verzoek', 'besluit', 'bijlage'];
        const fileTypes = { verzoek: [], besluit: [], bijlage: [] };
        const otherTypes = {};

        foiFiles.forEach(file => {
            if (fileTypes.hasOwnProperty(file.dc_type)) {
                fileTypes[file.dc_type].push(file);
            } else {
                if (!otherTypes[file.dc_type]) {
                    otherTypes[file.dc_type] = [];
                }
                otherTypes[file.dc_type].push(file);
            }
        });

        function createDocumentLink(file) {
            let additionalInfo = [];
            if (file.foi_nrPages) {
                additionalInfo.push(`${file.foi_nrPages} pagina${file.foi_nrPages !== '1' ? 's' : ''}`);
            }
            if (file.dc_format) {
                additionalInfo.push(file.dc_format);
            }
            let infoString = additionalInfo.length > 0 ? ` (${additionalInfo.join(', ')})` : '';
            
            // Choose the icon based on dc_type
            let icon = file.dc_type === "URL" ? "🔗" : "📄";
            
            return `${icon} <a href="${file.dc_source || `https://pid.wooverheid.nl/${file.dc_identifier}`}" target="_blank">${file.dc_title || file.foi_fileName || 'Untitled'}</a>${infoString}`;
        }

        sortedFileTypes.forEach(type => {
            if (fileTypes[type].length > 0) {
                const header = document.createElement('h5');
                header.id = 'woogle_document_type';
                header.textContent = `${capitalize(type)} (${fileTypes[type].length})`;
                documentContainer.appendChild(header);

                const list = document.createElement('ul');
                list.id = 'woogle_document_list';

                fileTypes[type].forEach(file => {
                    const listItem = document.createElement('li');
                    listItem.innerHTML = createDocumentLink(file);
                    list.appendChild(listItem);
                });

                documentContainer.appendChild(list);
                // documentContainer.appendChild(document.createElement('br')); // Add a line break after each list
            }
        });

        Object.keys(otherTypes).forEach(type => {
            if (otherTypes[type].length > 0) {
                const header = document.createElement('h5');
                header.id = 'woogle_document_type';
                header.textContent = `${capitalize(type)} (${otherTypes[type].length})`;
                documentContainer.appendChild(header);

                const list = document.createElement('ul');
                list.id = 'woogle_document_list';

                otherTypes[type].forEach(file => {
                    const listItem = document.createElement('li');
                    listItem.innerHTML = createDocumentLink(file);
                    list.appendChild(listItem);
                });

                documentContainer.appendChild(list);
                // documentContainer.appendChild(document.createElement('br')); // Add a line break after each list
            }
        });

        // Add linked dossiers if they exist
        if (infobox.foi_linkedDossier && infobox.foi_linkedDossier.length > 0) {
            const header = document.createElement('h5');
            header.textContent = 'Gelinkt aan';
            documentContainer.appendChild(header);

            const list = document.createElement('ul');

            infobox.foi_linkedDossier.forEach(linkedDossier => {
                const listItem = document.createElement('li');
                listItem.innerHTML = '🔗 ';
                const link = document.createElement('a');
                if (publisher_code === 'woogle_config') {
                    link.href = `dossier.html?pid=${linkedDossier}`;
                } else {
                    link.href = `dossier.html?publisher-code=${publisher_code}&pid=${linkedDossier}`;
                }
                link.textContent = 'Laden...'; // Placeholder text
                listItem.appendChild(link);
                list.appendChild(listItem);

                // Fetch the linked dossier's title
                fetch(`/api/proxy?pid=${linkedDossier}`)
                    .then(response => response.json())
                    .then(data => {
                        link.textContent = data.infobox.dc_title || linkedDossier;
                    })
                    .catch(error => {
                        link.textContent = linkedDossier; // Fallback to PID if fetch fails
                    });
            });

            documentContainer.appendChild(list);
            // documentContainer.appendChild(document.createElement('br'));
        }

    }

    function updateMetaAttributes(infobox) {
        const metaAttributesContainer = document.querySelector('.meta-attributes');
        metaAttributesContainer.innerHTML = ''; // Clear existing meta-attributes

        const desiredAttributes = ['dc_date_year', 'dc_publisher_name', 'foi_functionDescription', 'foi_party'];

        desiredAttributes.forEach(key => {
            if (infobox[key]) {
                const span = document.createElement('span');
                span.className = 'tags';
                span.textContent = `${infobox[key]}`;
                metaAttributesContainer.appendChild(span);
            }
        });
    }

    function adjustLayout(layout) {
        const row = document.querySelector('.big-card > .row');
        const resultCol = row.querySelector('.col.md-6[style="max-width: 60%;"]');
        const metadataCol = row.querySelector('.col.md-6:not([style="max-width: 60%;"])');

        if (layout === 'left') {
            row.insertBefore(metadataCol, resultCol);
        } else {
            row.insertBefore(resultCol, metadataCol);
        }
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
            root.style.removeProperty('--bodyFont');
        }

        // Check and set header font
        if (config.general.appearance.fonts.headerFont !== "default") {
            root.style.setProperty('--headerFont', config.general.appearance.fonts.headerFont);
        } else {
            root.style.removeProperty('--headerFont');
        }

        // Check and set UI font 
        if (config.general.appearance.fonts.uiFont !== "default") {
            root.style.setProperty('--uiFont', config.general.appearance.fonts.uiFont);
        } else {
            root.style.removeProperty('--uiFont');
        }

        
    }

    // Update the selector to match the new button ID
    const searchButton = document.getElementById('search-button');
    if (searchButton) {
        searchButton.addEventListener('click', function () {
            const query = document.getElementById('woogle_search').value;
            if (query) {
                woogleSearch(pid, query);
            } else {
            }
        });
    } else {
    }

    function woogleSearch(pid, query) {
        if (publisher_code === 'woogle_config') {
            window.location.href = `search?pid=${pid}&q=${query}`;
        } else {
            window.location.href = `search?publisher-code=${publisher_code}&pid=${pid}&q=${query}`;
        }
    }

    // Helper functions
    function createH1Element() {
        const h1 = document.createElement('h1');
        const mainContent = document.querySelector('.container');
        if (mainContent) {
            mainContent.insertBefore(h1, mainContent.firstChild);
        }
        return h1;
    }

    function updateZipDownloadLink(dcIdentifier) {
        const zipLink = document.getElementById('woogle_dossier');
        if (zipLink) {
            zipLink.href = `https://pid.wooverheid.nl/?pid=${dcIdentifier}&zip=true`;
            zipLink.setAttribute('download', '');
            zipLink.addEventListener('click', function(event) {
                event.preventDefault();
                window.location.href = this.href;
            });
        }
    }

    function updateSocialLinks(infobox) {
        const socialLinks = SOCIAL_METADATA_FIELDS.filter(link => infobox[link]);
        
        if (socialLinks.length > 0) {
            const socialLinksHTML = `
                <div class="row socials">
                    <div class="col-auto d-flex align-items-center">
                        <h5 style="margin-bottom: 0 !important;">Links:</h5>
                    </div>
                    <div class="col">
                        ${socialLinks.map(link => `
                            <a class="link" href="${infobox[link]}" target="_blank">
                                <img src="https://www.google.com/s2/favicons?sz=32&domain=${infobox[link]}">
                            </a>
                        `).join('')}
                    </div>
                </div>
            `;
            
            const infoboxElement = document.querySelector('.infobox');
            infoboxElement.insertAdjacentHTML('beforebegin', socialLinksHTML);
        }
    }

    async function updateWooIndexInfobox(infobox) {
        try {
            const response = await fetch('/api/metadata_translation');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const labels = await response.json();

            const wooIndexFields = Object.entries(infobox).filter(([key]) => key.startsWith('foi_wooIndex'));

            if (wooIndexFields.length > 0) {
                const wooIndexInfobox = document.createElement('div');
                wooIndexInfobox.className = 'infobox';
                wooIndexInfobox.innerHTML = `
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Attribuut</th>
                                <th>Waarde</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                `;

                const tableBody = wooIndexInfobox.querySelector('tbody');

                for (const [key, value] of wooIndexFields) {
                    if (value) {
                        const row = document.createElement('tr');
                        
                        const labelCell = document.createElement('td');
                        // Use the translated label if available, otherwise use the original key
                        const label = labels[key] || key;
                        labelCell.textContent = label;
                        
                        const valueCell = document.createElement('td');
                        valueCell.textContent = value;
                        
                        row.appendChild(labelCell);
                        row.appendChild(valueCell);
                        tableBody.appendChild(row);
                    }
                }

                // Insert the new infobox before the existing one
                const existingInfobox = document.querySelector('.infobox');
                existingInfobox.parentNode.insertBefore(wooIndexInfobox, existingInfobox);
            }
        } catch (error) {
        }
    }

});
