// Define updateFontPreview function at the top level of the script
function updateFontPreview() {
  try {
    const bodyFont = document.getElementById('font-picker-body').value;
    const headerFont = document.getElementById('font-picker-header').value;
    const uiFont = document.getElementById('font-picker-ui').value;

    const fontPreview = document.getElementById('fontPreview');
    if (fontPreview) {
      fontPreview.innerHTML = `
        <p id="bodyFontPreview" style="font-family: ${bodyFont}">Dit is hoe uw bodytekst eruit zal zien (${bodyFont.split(',')[0]}).</p>
        <p id="headerFontPreview" style="font-family: ${headerFont}">Dit is hoe uw headers eruit zullen zien (${headerFont.split(',')[0]}).</p>
        <p id="uiFontPreview" style="font-family: ${uiFont}">Dit is hoe uw UI-tekst eruit zal zien (${uiFont.split(',')[0]}).</p>
      `;
    } else {
      console.warn('Font preview container not found');
    }
  } catch (error) {
    console.error('Error updating font preview:', error);
  }
}

// Add event listener for DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
  try {
    const bodyFontPicker = document.getElementById('font-picker-body');
    const headerFontPicker = document.getElementById('font-picker-header');
    const uiFontPicker = document.getElementById('font-picker-ui');

    if (bodyFontPicker && headerFontPicker && uiFontPicker) {
      bodyFontPicker.addEventListener('change', updateFontPreview);
      headerFontPicker.addEventListener('change', updateFontPreview);
      uiFontPicker.addEventListener('change', updateFontPreview);
      
      updateFontPreview(); // Initial update
    } else {
      console.warn('One or more font picker elements not found');
    }
  } catch (error) {
    console.error('Error setting up font preview:', error);
  }
});

// Global configuration object
let config = {};
let hasUnsavedChanges = false;
let selectedPublisher = null; // New variable to store the selected publisher

// Fetch initial configuration
async function fetchConfig() {
  try {
    const response = await fetch('/api/read_config');
    if (!response.ok) throw new Error('Failed to fetch configuration');
    config = await response.json();
    updateUIFromConfig();
  } catch (error) {
    console.error('Error fetching configuration:', error);
  }
}

// Update UI elements based on current configuration
function updateUIFromConfig() {
  document.getElementById('category').value = config.general.identifier || '';
  document.getElementById('publisher').value = config.general.identifier || '';
  document.getElementById('font-picker-body').value = config.general.appearance.fonts.bodyFont || '';
  document.getElementById('font-picker-header').value = config.general.appearance.fonts.headerFont || '';
  document.getElementById('font-picker-ui').value = config.general.appearance.fonts.uiFont || '';
  document.getElementById('accent-color-picker').value = config.general.appearance.colors.accentColor || '#000000';
  document.getElementById('layout-direction').value = config.search.layout.direction || '';
  document.getElementById('metadataLayout').value = config.dossier.metadataLayout || '';
  
  updateMetadataFields();
}

// Update configuration from UI inputs
function updateConfigFromUI() {
  config.general.identifier = document.getElementById('publisher').value;
  config.general.appearance.fonts = {
    bodyFont: document.getElementById('font-picker-body').value,
    headerFont: document.getElementById('font-picker-header').value,
    uiFont: document.getElementById('font-picker-ui').value
  };
  config.general.appearance.colors.accentColor = document.getElementById('accent-color-picker').value;
  config.search.layout.direction = document.getElementById('layout-direction').value;
  config.dossier.metadataLayout = document.getElementById('metadataLayout').value;

  // If you need to update other properties, do so here

  // Get the logo file
  const logoUploader = document.getElementById('logo-uploader');
  const logoFile = logoUploader.files[0];

  // Add the logo file to the config object if it exists
  if (logoFile) {
    config.logo = {
      filename: logoFile.name,
      type: logoFile.type
    };
  }

  return config; // Return the updated config object
}

// Save configuration to server
async function saveConfig() {
  try {
    const updatedConfig = updateConfigFromUI();
    
    // Create a FormData object to send both JSON and file data
    const formData = new FormData();
    formData.append('config', JSON.stringify(updatedConfig));

    // Append the logo file if it exists
    const logoUploader = document.getElementById('logo-uploader');
    if (logoUploader.files.length > 0) {
      formData.append('logo', logoUploader.files[0]);
    }

    const response = await fetch('/api/save_config', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error('Failed to save configuration');
    hasUnsavedChanges = false;
    return true;
  } catch (error) {
    console.error('Error saving configuration:', error);
    return false;
  }
}

// Generate files for download
async function generateFiles() {
  try {
    // First, update the configuration
    const configUpdated = await saveConfig();

    const zip = new JSZip();

    const fetchAndAddFile = async (url, path) => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
        }
        const data = await response.text();
        zip.file(path, data);
      } catch (error) {
        console.warn(`Warning: Could not add ${url} to the zip file. ${error.message}`);
      }
    };

    const fetchAndAddBinaryFile = async (url, path) => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
        }
        const data = await response.blob();
        zip.file(path, data);
      } catch (error) {
        console.warn(`Warning: Could not add ${url} to the zip file. ${error.message}`);
      }
    };

    const files = [
      'search.html',
      'dossier.html',
      'config.html',
      'css/woogle_custom.css',
      'css/woogle_search.css',
      'css/woogle_searchui.css',
      'css/woogle_dossier.css',
      'css/woogle_config.css',
      'js/woogle_config.js',
      'js/woogle_search.js',
      'js/woogle_dossier.js',
      'README.md',
      'server.js',
      'package.json'
    ];

    for (const file of files) {
      await fetchAndAddFile(`/${file}`, `woogle/${file}`);
    }

    // Add binary files (images)
    await fetchAndAddBinaryFile('/assets/img/favicon.ico', 'woogle/assets/img/favicon.ico');
    await fetchAndAddBinaryFile('/assets/img/woogle.svg', 'woogle/assets/img/woogle.svg');

    const logoUploader = document.getElementById('logo-uploader');
    const logoFile = logoUploader.files[0];
    const publisher = document.getElementById('publisher').value;

    await fetchAndAddFile(`/data/${publisher}.json`, `woogle/data/woogle_config.json`);

    if (logoFile) {
      zip.file(`woogle/assets/img/${publisher}.${logoFile.name.split('.').pop()}`, logoFile);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const element = document.createElement('a');
    element.href = URL.createObjectURL(content);
    element.download = 'woogle.zip';
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    if (configUpdated) {
      alert('Configuration updated successfully and files generated. The download should start shortly.');
    } else {
      alert('Files generated, but there was an issue updating the configuration. The download should start shortly.');
    }
  } catch (error) {
    console.error('Error generating files:', error);
    alert('Failed to generate files: ' + error.message);
  }
}

// Helper function to update metadata fields
function updateMetadataFields() {
  const metadataFieldsBody = document.getElementById('metadataFieldsBody');
  if (!metadataFieldsBody) return;

  metadataFieldsBody.innerHTML = '';
  config.dossier.metadata.forEach((field, index) => {
    const row = document.createElement('tr');
    row.draggable = true;
    row.dataset.key = field.key;
    
    const defaultTextCell = document.createElement('td');
    defaultTextCell.textContent = field.label;
    row.appendChild(defaultTextCell);

    const labelInputCell = document.createElement('td');
    const labelInput = document.createElement('input');
    labelInput.type = 'text';
    labelInput.value = field.label;
    labelInput.name = `label_${field.key}`;
    labelInput.placeholder = 'Custom Text';
    labelInputCell.appendChild(labelInput);
    row.appendChild(labelInputCell);

    const visibleCheckboxCell = document.createElement('td');
    const visibleCheckbox = document.createElement('input');
    visibleCheckbox.type = 'checkbox';
    visibleCheckbox.checked = field.visible;
    visibleCheckbox.name = `visible_${field.key}`;
    visibleCheckboxCell.appendChild(visibleCheckbox);
    row.appendChild(visibleCheckboxCell);

    row.addEventListener('dragstart', dragStart);
    row.addEventListener('dragover', dragOver);
    row.addEventListener('dragend', dragEnd);
    row.addEventListener('drop', drop);

    metadataFieldsBody.appendChild(row);
  });
}

function dragStart(e) {
  e.dataTransfer.setData('text/plain', e.target.dataset.key);
  e.target.classList.add('dragging');
}

function dragOver(e) {
  e.preventDefault();
  const draggedItem = document.querySelector('.dragging');
  const tbody = document.getElementById('metadataFieldsBody');
  const siblings = [...tbody.querySelectorAll('tr:not(.dragging)')];
  
  // Remove existing drop-zone classes
  siblings.forEach(sibling => sibling.classList.remove('drop-zone'));
  
  const nextSibling = siblings.find(sibling => {
    const rect = sibling.getBoundingClientRect();
    return e.clientY <= rect.top + rect.height / 2;
  });

  if (nextSibling) {
    nextSibling.classList.add('drop-zone');
  }
}

function dragEnd(e) {
  e.target.classList.remove('dragging');
  document.querySelectorAll('#metadataFieldsBody tr').forEach(row => {
    row.classList.remove('drop-zone');
  });
}

function drop(e) {
  e.preventDefault();
  const draggedKey = e.dataTransfer.getData('text');
  const tbody = document.getElementById('metadataFieldsBody');
  const draggedElement = document.querySelector(`tr[data-key="${draggedKey}"]`);
  const dropTarget = e.target.closest('tr');
  
  if (dropTarget && dropTarget !== draggedElement) {
    dropTarget.before(draggedElement);
  }
  
  updateMetadataOrder();
  dragEnd(e);
}

function updateMetadataOrder() {
  const rows = document.querySelectorAll('#metadataFieldsBody tr');
  config.dossier.metadata = Array.from(rows).map((row, index) => {
    const key = row.dataset.key;
    const field = config.dossier.metadata.find(f => f.key === key);
    return {
      ...field,
      order: index,
      label: row.querySelector(`input[name="label_${key}"]`).value,
      visible: row.querySelector(`input[name="visible_${key}"]`).checked
    };
  });
  hasUnsavedChanges = true;
}

// Function to upload logo
function uploadLogo() {
  const input = document.getElementById('logo-uploader');
  const file = input.files[0];

  const publisher = document.getElementById('publisher').value;
  if (file) {
    const formData = new FormData();
    formData.append('logo', file, `${publisher}.${file.name.split('.').pop()}`); // Specify the desired file name

    formData.append('config', JSON.stringify({"general": {"identifier": publisher}})); // Add the publisher code to the form data
    
    fetch('/api/upload_logo', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const logoImg = document.querySelector('.woogle-logo-lg');
        if (logoImg) {
          logoImg.src = data.path + '?t=' + new Date().getTime(); // Add timestamp to force reload
        }
        loadLogo(); // Reload the logo after successful upload
      } else {
        alert('Failed to upload logo: ' + data.message);
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('An error occurred while uploading the logo');
    });
  }
}

// Update the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function() {
  const categorySelect = document.getElementById('category');
  const publisherSelect = document.getElementById('publisher');

  if (categorySelect) {
    fetchCategories();
    categorySelect.addEventListener('change', function() {
      const selectedCategory = this.value;
      if (selectedCategory) {
        fetchPublishers(selectedCategory);
      } else {
        if (publisherSelect) {
          publisherSelect.innerHTML = '<option value="">Selecteer een aanbieder...</option>';
        }
      }
    });
  }

  if (publisherSelect) {
    publisherSelect.addEventListener('change', function() {
      selectedPublisher = this.value; // Store the selected value
      if (selectedPublisher) {
        hasUnsavedChanges = true;
      }
    });
  }

  fetchConfig();
  
  document.getElementById('updateConfigButton').addEventListener('click', async () => {
    updateConfigFromUI();
    const success = await saveConfig();
    if (success) {
      alert('Configuration updated successfully!');
    } else {
      alert('Failed to update configuration.');
    }
  });
  
  document.getElementById('generateFilesButton').addEventListener('click', async (event) => {
    event.preventDefault();
    updateConfigFromUI();
    const success = await saveConfig();
    if (success) {
      await generateFiles();
    } else {
      alert('Failed to save configuration before generating files.'); 
    }
  });
  
  const logoUploader = document.getElementById('logo-uploader');
  // if (logoUploader) {
  //   logoUploader.addEventListener('change', uploadLogo);
  // }

  // Update event listeners for real-time updates
  const configInputs = [
    'publisher', 'font-picker-body', 'font-picker-header', 'font-picker-ui',
    'accent-color-picker', 'layout-direction', 'metadataLayout'
  ];

  configInputs.forEach(id => {
    document.getElementById(id).addEventListener('change', () => {
      hasUnsavedChanges = true;
    });
  });

  // Metadata fields event listeners
  const metadataFieldsBody = document.getElementById('metadataFieldsBody');
  metadataFieldsBody.addEventListener('change', () => {
    hasUnsavedChanges = true;
  });

  metadataFieldsBody.addEventListener('dragend', () => {
    updateMetadataOrder();
  });

  // Fetch municipalities for dropdown
  fetchCategories();

  // Load logo
  loadLogo();

  // Color picker event listener
  document.getElementById('accent-color-picker').addEventListener('input', updateColorPreview);

  // Font picker event listeners
  document.getElementById('font-picker-body').addEventListener('change', updateFontPreview);
  document.getElementById('font-picker-header').addEventListener('change', updateFontPreview);
  document.getElementById('font-picker-ui').addEventListener('change', updateFontPreview);

  // Initialize the preview with the default color
  updateColorPreview();

  // Update preview when color changes
  document.getElementById('accent-color-picker').addEventListener('input', updateColorPreview);

  // Initial preview updates
  updateColorPreview();
  updateFontPreview();

  // Initialize tooltips
  var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
  var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl)
  })

  // Logo drag and drop functionality
  const logoDragDrop = document.getElementById('logoDragDrop');
  const logoPreview = document.getElementById('logoPreview');
  const logoImage = document.getElementById('logoImage');

  if (logoDragDrop && logoUploader && logoPreview && logoImage) {
    initLogoUpload();
  }

  function initLogoUpload() {
    logoDragDrop.addEventListener('click', () => logoUploader.click());

    logoUploader.addEventListener('change', handleFileSelect);

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      logoDragDrop.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      logoDragDrop.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      logoDragDrop.addEventListener(eventName, unhighlight, false);
    });

    logoDragDrop.addEventListener('drop', handleDrop, false);
  }

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function highlight() {
    logoDragDrop.classList.add('bg-light');
  }

  function unhighlight() {
    logoDragDrop.classList.remove('bg-light');
  }

  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
  }

  function handleFiles(files) {
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
          logoImage.src = e.target.result;
          logoPreview.classList.remove('d-none');
        }
        reader.readAsDataURL(file);
        logoUploader.files = files; // Set the file to the input for form submission
      } else {
        alert('Please upload an image file.');
      }
    }
  }

  function handleFileSelect(e) {
    handleFiles(this.files);
  }

  // Accent color picker
  const accentColorPicker = document.getElementById('accent-color-picker');
  const accentColorPreview = document.getElementById('accentColorPreview');

  // Initialize the preview with the default color
  updateAccentColorPreview(accentColorPicker.value);

  // Update preview when color changes
  accentColorPicker.addEventListener('input', function() {
    updateAccentColorPreview(this.value);
  });

  function updateAccentColorPreview(color) {
    const accentColorPreview = document.getElementById('accentColorPreview');
    if (accentColorPreview) {
      accentColorPreview.style.backgroundColor = color;
      accentColorPreview.textContent = 'Accent Kleur';
    }
  }

  function updateFonts() {
    document.documentElement.style.setProperty('--bodyFont', document.getElementById('font-picker-body').value);
    document.documentElement.style.setProperty('--headerFont', document.getElementById('font-picker-header').value);
    document.documentElement.style.setProperty('--uiFont', document.getElementById('font-picker-ui').value);
  }

  // Call this function when font selections change
  document.getElementById('font-picker-body').addEventListener('change', updateFonts);
  document.getElementById('font-picker-header').addEventListener('change', updateFonts);
  document.getElementById('font-picker-ui').addEventListener('change', updateFonts);
});

// Add these variables at the top of your file
let categories = {};
let publishers = {};

// Modify the existing fetchMunicipalities function to fetchCategories
function fetchCategories() {
  fetch('/api/categories')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      categories = data.infobox;
      const categorySelect = document.getElementById('category');
      if (categorySelect) {
        categorySelect.innerHTML = '<option value="">Selecteer een categorie...</option>';
        for (const key in categories) {
          const option = document.createElement('option');
          option.value = key;
          option.textContent = key;
          categorySelect.appendChild(option);
        }
      }
    })
    .catch(error => {
      console.error('Error fetching categories:', error);
    });
}

// Add a new function to fetch publishers based on the selected category
function fetchPublishers(category) {
  fetch(`/api/publishers?category=${encodeURIComponent(category)}`)
    .then(response => response.json())
    .then(data => {
      publishers = data.infobox;
      const publisherSelect = document.getElementById('publisher');
      publisherSelect.innerHTML = '<option value="">Selecteer een aanbieder...</option>';
      for (const key in publishers) {
        const option = document.createElement('option');
        option.value = publishers[key].foi_prefix;
        option.textContent = publishers[key].dc_publisher_name;
        publisherSelect.appendChild(option);
      }
    })
    .catch(error => {
      console.error('Error fetching publishers:', error);
    });
}

// Function to load logo
function loadLogo() {
  const logoElement = document.querySelector('.woogle-logo-lg');
  if (!logoElement) return;

  logoElement.removeAttribute('src');

  const fileTypes = ['png', 'jpg', 'jpeg', 'svg', 'gif'];
  const defaultLogo = 'assets/img/woogle.svg';

  function preloadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(src);
      img.onerror = reject;
      img.src = src;
    });
  }

  Promise.any(fileTypes.map(type => 
    preloadImage(`assets/img/logo.${type}?t=${new Date().getTime()}`)
  ))
    .then(src => {
      logoElement.src = src;
    })
    .catch(() => {
      logoElement.src = defaultLogo;
    });
}

// Call loadLogo on DOMContentLoaded
document.addEventListener('DOMContentLoaded', loadLogo);

function updateColorPreview() {
  const accentColor = document.getElementById('accent-color-picker').value;
  const accentColorPreview = document.getElementById('accentColorPreview');
  if (accentColorPreview) {
    accentColorPreview.style.backgroundColor = accentColor;
    accentColorPreview.textContent = `Accent Kleur: ${accentColor}`;
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const accentColorPicker = document.getElementById('accent-color-picker');
  if (accentColorPicker) {
    accentColorPicker.addEventListener('input', updateColorPreview);
    updateColorPreview(); // Initial update
  }
});
