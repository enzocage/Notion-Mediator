const { google } = require('googleapis');
require('dotenv').config();

async function checkAuth() {
    try {
        console.log("Reading credentials from:", process.env.GOOGLE_APPLICATION_CREDENTIALS);
        const auth = new google.auth.GoogleAuth({
            keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS || 'credentials.json', // Changed default to match reality
            scopes: ['https://www.googleapis.com/auth/documents'],
        });

        const client = await auth.getClient();
        console.log("Service Account Email:", client.email);
    } catch (error) {
        console.error("Error loading credentials:", error.message);
    }
}

checkAuth();
