const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { processPrompt } = require('./agent');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/api/config', (req, res) => {
    res.json({
        pageId1: process.env.PAGE_ID_1,
        pageId2: process.env.PAGE_ID_2
    });
});

app.post('/api/chat', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
        const response = await processPrompt(prompt);
        res.json({ response });
    } catch (error) {
        console.error(error);
        res.status(500).json({ response: `Error: ${error.message}` });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
