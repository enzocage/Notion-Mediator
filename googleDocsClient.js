const { google } = require('googleapis');
require('dotenv').config();

// Load credentials from file or environment
// For simplicity, we'll assume a key file path in env, or default to 'google-credentials.json'
const KEY_FILE_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS || 'google-credentials.json';

const scopes = ['https://www.googleapis.com/auth/documents'];

const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE_PATH,
    scopes: scopes,
});

const docs = google.docs({ version: 'v1', auth });

const docIds = {
    '1': process.env.GOOGLE_DOC_ID_1,
    '2': process.env.GOOGLE_DOC_ID_2
};

async function getDocContent(docAlias) {
    const docId = docIds[docAlias];
    if (!docId) throw new Error(`Google Doc alias ${docAlias} not found.`);

    try {
        const res = await docs.documents.get({ documentId: docId });
        const content = res.data.body.content;

        let textContent = '';
        let paragraphCount = 0;

        content.forEach(element => {
            if (element.paragraph) {
                const text = element.paragraph.elements.map(e => e.textRun ? e.textRun.content : '').join('');
                if (text.trim().length > 0) {
                    // We use a simple index-based ID for paragraphs
                    textContent += `[PARAGRAPH:${paragraphCount}] ${text}`;
                    paragraphCount++;
                }
            }
        });

        return textContent || "[Document is empty]";
    } catch (error) {
        console.error("Error reading Google Doc:", error);
        throw error;
    }
}

async function appendToDoc(docAlias, text) {
    const docId = docIds[docAlias];
    if (!docId) throw new Error(`Google Doc alias ${docAlias} not found.`);

    try {
        await docs.documents.batchUpdate({
            documentId: docId,
            requestBody: {
                requests: [{
                    insertText: {
                        endOfSegmentLocation: {}, // Appends to the end of the body
                        text: text + '\n'
                    }
                }]
            }
        });
        return "Successfully appended text.";
    } catch (error) {
        console.error("Error writing to Google Doc:", error);
        throw error;
    }
}

async function updateDocBlock(docAlias, paragraphIndex, newText) {
    const docId = docIds[docAlias];
    if (!docId) throw new Error(`Google Doc alias ${docAlias} not found.`);

    const targetIndex = parseInt(paragraphIndex);
    if (isNaN(targetIndex)) throw new Error("Invalid paragraph index.");

    try {
        // 1. Read document to find the start and end index of the target paragraph
        const res = await docs.documents.get({ documentId: docId });
        const content = res.data.body.content;

        let currentParagraphCount = 0;
        let startIndex = -1;
        let endIndex = -1;

        for (const element of content) {
            if (element.paragraph) {
                const text = element.paragraph.elements.map(e => e.textRun ? e.textRun.content : '').join('');
                if (text.trim().length > 0) {
                    if (currentParagraphCount === targetIndex) {
                        startIndex = element.startIndex;
                        endIndex = element.endIndex;
                        break;
                    }
                    currentParagraphCount++;
                }
            }
        }

        if (startIndex === -1) {
            throw new Error(`Paragraph ${targetIndex} not found.`);
        }

        // 2. Delete existing content and insert new content
        // Note: endIndex in Google Docs includes the newline character. 
        // We usually want to keep the paragraph structure, so we delete up to endIndex - 1.
        // However, replacing the whole range is safer to ensure clean text replacement.

        const requests = [
            {
                deleteContentRange: {
                    range: {
                        startIndex: startIndex,
                        endIndex: endIndex - 1 // Keep the newline at the end of the paragraph
                    }
                }
            },
            {
                insertText: {
                    location: {
                        index: startIndex
                    },
                    text: newText
                }
            }
        ];

        await docs.documents.batchUpdate({
            documentId: docId,
            requestBody: { requests }
        });

        return "Successfully updated paragraph.";

    } catch (error) {
        console.error("Error updating Google Doc block:", error);
        throw error;
    }
}

module.exports = { getDocContent, appendToDoc, updateDocBlock };
