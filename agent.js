const { GoogleGenerativeAI } = require("@google/generative-ai");
const { getPageContent, appendToPage } = require('./notionClient');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-09-2025" });

const tools = {
    'read_page_1': async () => await getPageContent('1'),
    'read_page_2': async () => await getPageContent('2'),
    'write_page_1': async (text) => await appendToPage('1', text),
    'write_page_2': async (text) => await appendToPage('2', text),
};

async function processPrompt(userPrompt) {
    const systemPrompt = `
    You are a helpful Notion Mediator Agent. You have access to two Notion pages.
    
    Tools available:
    - read_page_1: Read content of Page 1.
    - read_page_2: Read content of Page 2.
    - write_page_1: Append text to Page 1. Argument: "text".
    - write_page_2: Append text to Page 2. Argument: "text".
    
    Instructions:
    - You can use multiple tools in sequence to achieve a goal.
    - Example: To move content, first read, then write.
    - If you need to use a tool, output JSON with "tool" and "args".
    - If you are done or just answering a question, output JSON with "response" and "tool": null.
    - IMPORTANT: If asked to write long content, generate the FULL content immediately in the 'args' of the write tool. Do not split it into multiple steps.
    - You can use MARKDOWN formatting (headings #, bold **, lists -, etc.) in your text arguments. The system will convert it to Notion blocks.
    
    Format:
    {
        "tool": "tool_name" or null,
        "args": "text_argument_if_writing" or null,
        "response": "final_response_to_user" or null
    }
    `;

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
