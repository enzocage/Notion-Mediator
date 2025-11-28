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

const colorMap = {
    'red': { color: { rgbColor: { red: 1, green: 0, blue: 0 } } },
    'blue': { color: { rgbColor: { red: 0, green: 0, blue: 1 } } },
    'green': { color: { rgbColor: { red: 0, green: 1, blue: 0 } } },
    'orange': { color: { rgbColor: { red: 1, green: 0.5, blue: 0 } } },
    'purple': { color: { rgbColor: { red: 0.5, green: 0, blue: 0.5 } } },
    'grey': { color: { rgbColor: { red: 0.5, green: 0.5, blue: 0.5 } } },
    'black': { color: { rgbColor: { red: 0, green: 0, blue: 0 } } }
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
        // 1. Get current document end index
        const doc = await docs.documents.get({ documentId: docId });
        const content = doc.data.body.content;
        const lastElement = content[content.length - 1];
        let currentIndex = lastElement.endIndex - 1; // Insert before the final newline of the doc

        const requests = [];
        const lines = text.split('\n');

        for (let line of lines) {
            let lineText = line;
            let isHeading = false;
            let headingLevel = 0;
            let isList = false;

            // Check for Heading
            const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
            if (headingMatch) {
                headingLevel = headingMatch[1].length;
                lineText = headingMatch[2];
                isHeading = true;
            }

            // Check for List
            const listMatch = line.match(/^(\*|-)\s+(.*)/);
            if (listMatch) {
                lineText = listMatch[2];
                isList = true;
            }

            // Parse Formatting inline
            const parts = [];
            const regex = /(\*\*|__)(.*?)\1|(\*|_)(.*?)\3|(~~)(.*?)\5|(<u>)(.*?)(<\/u>)|(==)(.*?)\10|(\[color:([a-z]+)\])(.*?)(\[\/color\])/g;

            let lastIndex = 0;
            let match;

            while ((match = regex.exec(lineText)) !== null) {
                // Add text before match
                if (match.index > lastIndex) {
                    parts.push({ text: lineText.substring(lastIndex, match.index) });
                }

                if (match[2]) { // Bold
                    parts.push({ text: match[2], bold: true });
                } else if (match[4]) { // Italic
                    parts.push({ text: match[4], italic: true });
                } else if (match[6]) { // Strikethrough
                    parts.push({ text: match[6], strikethrough: true });
                } else if (match[8]) { // Underline
                    parts.push({ text: match[8], underline: true });
                } else if (match[11]) { // Highlight
                    parts.push({ text: match[11], highlight: true });
                } else if (match[14]) { // Color
                    parts.push({ text: match[14], color: match[13] });
                }

                lastIndex = regex.lastIndex;
            }
            // Add remaining text
            if (lastIndex < lineText.length) {
                parts.push({ text: lineText.substring(lastIndex) });
            }

            // If no matches, just one part
            if (parts.length === 0) parts.push({ text: lineText });


            // Construct Requests for this line
            const lineStartIndex = currentIndex;

            for (const part of parts) {
                if (!part.text) continue;

                requests.push({
                    insertText: {
                        location: { index: currentIndex },
                        text: part.text
                    }
                });

                let textStyle = {};
                let fields = [];

                if (part.bold) { textStyle.bold = true; fields.push('bold'); }
                if (part.italic) { textStyle.italic = true; fields.push('italic'); }
                if (part.strikethrough) { textStyle.strikethrough = true; fields.push('strikethrough'); }
                if (part.underline) { textStyle.underline = true; fields.push('underline'); }
                if (part.highlight) {
                    textStyle.backgroundColor = { color: { rgbColor: { red: 1, green: 1, blue: 0 } } }; // Yellow
                    fields.push('backgroundColor');
                }
                if (part.color && colorMap[part.color]) {
                    textStyle.foregroundColor = colorMap[part.color];
                    fields.push('foregroundColor');
                }

                if (fields.length > 0) {
                    requests.push({
                        updateTextStyle: {
                            range: {
                                startIndex: currentIndex,
                                endIndex: currentIndex + part.text.length
                            },
                            textStyle: textStyle,
                            fields: fields.join(',')
                        }
                    });
                }
                currentIndex += part.text.length;
            }

            // Add newline after line
            requests.push({
                insertText: {
                    location: { index: currentIndex },
                    text: '\n'
                }
            });

            // Apply Paragraph Styles (Heading / List)
            const lineEndIndex = currentIndex + 1;

            if (isHeading) {
                const style = headingLevel === 1 ? 'HEADING_1' :
                    headingLevel === 2 ? 'HEADING_2' :
                        headingLevel === 3 ? 'HEADING_3' : 'NORMAL_TEXT';

                requests.push({
                    updateParagraphStyle: {
                        range: {
                            startIndex: lineStartIndex,
                            endIndex: lineEndIndex
                        },
                        paragraphStyle: {
                            namedStyleType: style
                        },
                        fields: 'namedStyleType'
                    }
                });
            }

            if (isList) {
                requests.push({
                    createParagraphBullets: {
                        range: {
                            startIndex: lineStartIndex,
                            endIndex: lineEndIndex
                        },
                        bulletPreset: 'BULLET_DISC_CIRCLE_SQUARE'
                    }
                });
            }

            currentIndex++; // Move past newline
        }

        if (requests.length > 0) {
            await docs.documents.batchUpdate({
                documentId: docId,
                requestBody: { requests }
            });
        }

        return "Successfully appended formatted text.";
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
