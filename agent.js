const { GoogleGenerativeAI } = require("@google/generative-ai");
const { getPageContent, appendToPage, updateBlock } = require('./notionClient');
const { getDocContent, appendToDoc, updateDocBlock } = require('./googleDocsClient');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-09-2025" });

const notionTools = {
    'read_page_1': async () => await getPageContent('1'),
    'read_page_2': async () => await getPageContent('2'),
    'write_page_1': async (text) => await appendToPage('1', text),
    'write_page_2': async (text) => await appendToPage('2', text),
    'update_block': async ({ blockId, text }) => await updateBlock(blockId, text),
};

const googleTools = {
    'read_doc_1': async () => await getDocContent('1'),
    'read_doc_2': async () => await getDocContent('2'),
    'write_doc_1': async (text) => await appendToDoc('1', text),
    'write_doc_2': async (text) => await appendToDoc('2', text),
    'update_doc_block': async ({ paragraphIndex, text }) => await updateDocBlock('1', paragraphIndex, text), // Defaulting to doc 1 for update demo, or we can add docAlias to args
};

async function processPrompt(userPrompt, mode = 'notion') {
    let tools;
    let systemPrompt;

    if (mode === 'google') {
        tools = googleTools;
        systemPrompt = `
        You are a helpful Google Docs Mediator Agent. You have access to two Google Docs.
        
        Tools available:
        - read_doc_1: Read content of Doc 1. Returns text with [PARAGRAPH:index] prefixes.
        - read_doc_2: Read content of Doc 2. Returns text with [PARAGRAPH:index] prefixes.
        - write_doc_1: Append text to the END of Doc 1. Argument: "text".
        - write_doc_2: Append text to the END of Doc 2. Argument: "text".
        - update_doc_block: Update a specific paragraph in Doc 1 (currently limited to Doc 1 for updates). Arguments: { "paragraphIndex": "0", "text": "..." }.
        
        Instructions:
        - To modify existing content, you MUST first READ the doc to get the Paragraph Indices.
        - Then use 'update_doc_block' with the specific Index.
        - To add new content to the end, use 'write_doc_X'.
        - If you need to use a tool, output JSON with "tool" and "args".
        - If you are done or just answering a question, output JSON with "response" and "tool": null.
        - IMPORTANT: If asked to write long content, generate the FULL content immediately in the 'args' of the write tool. Do not split it into multiple steps.
        - You can use MARKDOWN formatting in your text arguments:
          - Bold: **text**
          - Italic: *text*
          - Strikethrough: ~~text~~
          - Underline: <u>text</u>
          - Highlight: ==text==
          - Color: [color:red]text[/color] (colors: red, blue, green, orange, purple, grey, black)
          - Headings: # Heading
          - Lists: - Item
        
        Format:
        {
            "tool": "tool_name" or null,
            "args": "text_argument" or { "paragraphIndex": "...", "text": "..." } or null,
            "response": "final_response_to_user" or null
        }
        `;
    } else {
        tools = notionTools;
        systemPrompt = `
        You are a helpful Notion Mediator Agent. You have access to two Notion pages.
        
        Tools available:
        - read_page_1: Read content of Page 1. Returns text with [BLOCK_ID:...] prefixes.
        - read_page_2: Read content of Page 2. Returns text with [BLOCK_ID:...] prefixes.
        - write_page_1: Append text to the END of Page 1. Argument: "text".
        - write_page_2: Append text to the END of Page 2. Argument: "text".
        - update_block: Update a specific block. Arguments: { "blockId": "...", "text": "..." }.
        
        Instructions:
        - To modify existing content, you MUST first READ the page to get the Block IDs.
        - Then use 'update_block' with the specific Block ID.
        - To add new content to the end, use 'write_page_X'.
        - If you need to use a tool, output JSON with "tool" and "args".
        - If you are done or just answering a question, output JSON with "response" and "tool": null.
        - IMPORTANT: If asked to write long content, generate the FULL content immediately in the 'args' of the write tool. Do not split it into multiple steps.
        - You can use MARKDOWN formatting (headings #, bold **, lists -, etc.) in your text arguments. The system will convert it to Notion blocks.
        
        Format:
        {
            "tool": "tool_name" or null,
            "args": "text_argument" or { "blockId": "...", "text": "..." } or null,
            "response": "final_response_to_user" or null
        }
        `;
    }

    const chat = model.startChat({
        history: [
            { role: "user", parts: [{ text: systemPrompt }] },
            { role: "model", parts: [{ text: "{\"tool\": null, \"args\": null, \"response\": \"Ready.\"}" }] }
        ],
    });

    let currentPrompt = userPrompt;
    let iterations = 0;
    const MAX_ITERATIONS = 30;

    try {
        while (iterations < MAX_ITERATIONS) {
            iterations++;
            const result = await chat.sendMessage(currentPrompt);
            const responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
            console.log(`[Iteration ${iterations}] Gemini Plan:`, responseText);

            let plan;
            try {
                plan = JSON.parse(responseText);
            } catch (e) {
                // If not JSON, assume it's a final response
                return responseText;
            }

            if (plan.tool) {
                if (tools[plan.tool]) {
                    let toolResult;
                    try {
                        console.log(`Executing ${plan.tool} with args:`, plan.args);
                        if (plan.tool.includes('write')) {
                            toolResult = await tools[plan.tool](plan.args);
                        } else if (plan.tool === 'update_block' || plan.tool === 'update_doc_block') {
                            toolResult = await tools[plan.tool](plan.args);
                        } else {
                            toolResult = await tools[plan.tool]();
                        }
                    } catch (err) {
                        toolResult = `Error executing tool: ${err.message}`;
                    }
                    console.log(`Tool Output:`, toolResult);
                    currentPrompt = `Tool '${plan.tool}' output: ${toolResult}. Continue or provide final response.`;
                } else {
                    currentPrompt = `Error: Tool '${plan.tool}' not found.`;
                }
            } else {
                // No tool, just response
                return plan.response || "Task completed.";
            }
        }
        return "Error: Maximum iterations reached.";

    } catch (error) {
        console.error("Agent Error:", error);
        return `Sorry, I encountered an error processing your request: ${error.message}`;
    }
}

module.exports = { processPrompt };
