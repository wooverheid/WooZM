const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const configPath = path.join(__dirname, 'data', 'woogle_config.json');

// Set up Multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'assets', 'img'));
  },
  filename: function (req, file, cb) {
    const publisher = JSON.parse(req.body.config).general.identifier;
    const ext = path.extname(file.originalname);
    cb(null, `${publisher}${ext}`);
  }
});

const upload = multer({ storage: storage });

app.get('/', (req, res) => {
  res.redirect('/config');
});

app.get('/config', (req, res) => {
  // config.html
  res.sendFile(path.join(__dirname, 'config.html'));
});

app.get('/search', (req, res) => {
  // search
  res.sendFile(path.join(__dirname, 'search.html'));
} );

app.get('/search?:publisher_code', (req, res) => {
  // search
  res.sendFile(path.join(__dirname, 'search.html'));
}); 

// Existing route to read configuration
app.get('/api/read_config', async (req, res) => {
  try {
    const config = await fs.readFile(configPath, 'utf8');
    res.json(JSON.parse(config));
  } catch (error) {
    res.status(500).json({ error: 'Failed to read configuration' });
  }
});

// Existing route to save configuration
app.post('/api/save_config', upload.single('logo'), async (req, res) => {
  try {
    const config = JSON.parse(req.body.config);

    const savePath = path.join(__dirname, 'data', config.general.identifier + '.json');

    // If a logo was uploaded, update the config with the new logo path
    if (req.file) {
      config.logo = {
        path: `/assets/img/${req.file.filename}`
      };
    }

    // Save the config JSON
    await fs.writeFile(savePath, JSON.stringify(config, null, 2));

    res.json({ message: 'Configuration saved successfully' });
  } catch (error) {
    console.error('Error saving configuration:', error);
    res.status(500).json({ error: 'Failed to save configuration' });
  }
});

// New route for logo upload
app.post('/api/upload_logo', upload.single('logo'), (req, res) => {
  if (req.file) {
    res.json({ 
      success: true, 
      message: 'Logo uploaded successfully',
      path: `/assets/img/${req.file.filename}`
    });
  } else {
    res.status(400).json({ success: false, message: 'No file uploaded' });
  }
});

// Proxy route for external API requests
app.get('/api/proxy', async (req, res) => {
  try {
    const { pid } = req.query;
    const response = await axios.get(`https://pid.wooverheid.nl/?pid=${pid}&infobox=true`, {
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'Accept-Charset': 'utf-8',
      }
    });
    res.json(response.data);
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      res.status(504).send('Gateway Timeout - The upstream server is not responding');
    } else if (error.response) {
      res.status(error.response.status).send(error.response.statusText);
    } else if (error.request) {
      res.status(503).send('Service Unavailable - No response received from the upstream server');
    } else {
      res.status(500).send('Internal Server Error');
    }
  }
});

// New route to fetch and serve municipality data
app.get('/api/municipalities', async (req, res) => {
  try {
    const response = await axios.get('https://pid.wooverheid.nl/?pid=nl&infobox=true&dim=publisher&category=Gemeente');
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch municipalities' });
  }
});

// New route to fetch categories
app.get('/api/categories', async (req, res) => {
  try {
    const response = await axios.get('https://pid.wooverheid.nl/?pid=nl&infobox=true');
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// New route to fetch publishers based on category
app.get('/api/publishers', async (req, res) => {
  try {
    const category = req.query.category;
    const response = await axios.get(`https://pid.wooverheid.nl/?pid=nl&infobox=true&dim=publisher&category=${encodeURIComponent(category)}`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch publishers' });
  }
});

// New route to proxy metadata translation requests
app.get('/api/metadata_translation', async (req, res) => {
  try {
    const response = await axios.get('https://pid.wooverheid.nl/metadata_translation');
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch metadata translation' });
  }
});

app.use('package.json', express.static(path.join(__dirname, 'package.json')));
app.use('package-lock.json', express.static(path.join(__dirname, 'package-lock.json')));
app.use('server.js', express.static(path.join(__dirname, 'server.js')));

app.listen(port, () => {
  // This is the only console.log left, which is often useful even in production
  console.log(`Server running on port ${port}`);
});
