// server.js
const express = require('express');
const path = require('path');

const app = express();
const buildPath = path.join(__dirname, 'build');

// Serve React build
app.use(express.static(buildPath));

// Serve static dynamic files directly
app.use('/dynamic', express.static(path.join(__dirname, 'dynamic')));

// For all other routes, return React app
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

const PORT = process.env.REACT_APP_PORT || 9000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));