const { Client } = require('@notionhq/client');
const { markdownToBlocks } = require('@tryfabric/martian');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const pageIds = {
    '1': process.env.PAGE_ID_1,
    '2': process.env.PAGE_ID_2
};

async function getPageContent(pageAlias) {
    const pageId = pageIds[pageAlias];
    if (!pageId) throw new Error(`Page alias ${pageAlias} not found.`);

    try {
        const response = await notion.blocks.children.list({
            block_id: pageId,
            page_size: 50,
        });

        // Simple extraction of text content
        const textContent = response.results.map(block => {
            if (block.type === 'paragraph' && block.paragraph.rich_text.length > 0) {
                return block.paragraph.rich_text.map(t => t.plain_text).join('');
            }
            return ''; // Ignore other block types for simplicity in this demo
        }).filter(text => text.length > 0).join('\n');

        return textContent || "[Page is empty or contains non-paragraph blocks]";
    } catch (error) {
        console.error("Error reading Notion page:", error);
        if (error.code === 'object_not_found') {
            throw new Error(`Access denied to page ${pageAlias}. Please share this page with your Notion Integration.`);
        }
        throw error;
    }
}

async function appendToPage(pageAlias, text) {
    const pageId = pageIds[pageAlias];
    if (!pageId) throw new Error(`Page alias ${pageAlias} not found.`);

    // Convert Markdown to Notion Blocks
    const children = markdownToBlocks(text);

    try {
        await notion.blocks.children.append({
            block_id: pageId,
            children: children,
        });
        return "Successfully appended text.";
    } catch (error) {
        console.error("Error writing to Notion page:", error);
        if (error.code === 'object_not_found') {
            throw new Error(`Access denied to page ${pageAlias}. Please share this page with your Notion Integration.`);
        }
        throw error;
    }
}

module.exports = { getPageContent, appendToPage };
