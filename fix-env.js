const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
let content = fs.readFileSync(envPath, 'utf8');

// Fix the credentials path
content = content.replace('google-credentials.json', 'credentials.json');

// Ensure it's written back with standard encoding
fs.writeFileSync(envPath, content, 'utf8');
console.log(".env updated successfully.");
