# Notion Mediator Agent

A powerful AI agent that acts as a mediator between you and your Notion pages. It uses **Google Gemini** to understand natural language commands and the **Notion API** to read from and write to specific Notion documents.

## 🚀 Features

*   **Natural Language Interface**: Chat with your Notion pages using everyday language.
*   **Read & Write**: The agent can read content from pages and write new content to them.
*   **Multi-Step Reasoning**: Capable of complex tasks like "Read page 1, summarize it, and write the summary to page 2".
*   **Markdown Support**: Writes formatted text (headings, lists, bold) directly as Notion blocks.
*   **Long Content Handling**: Automatically splits long texts to bypass Notion's block limits.
*   **Fast Responses**: Powered by Google's Gemini Flash model for low latency.

## 🛠️ Tech Stack

*   **Backend**: Node.js, Express
*   **AI**: Google Gemini API (`@google/generative-ai`)
*   **Integration**: Notion API (`@notionhq/client`)
*   **Markdown Parser**: `@tryfabric/martian`
*   **Frontend**: HTML, CSS, Vanilla JavaScript

## 📋 Prerequisites

*   **Node.js** (v18 or higher)
*   **Notion Integration Token** (API Key)
*   **Google Gemini API Key**

## ⚙️ Setup

1.  **Clone the repository** (or navigate to the folder).
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Configure Environment**:
    Create a `.env` file in the root directory with the following keys:
    ```env
    NOTION_API_KEY=ntn_...
    PAGE_ID_1=your_first_page_id
    PAGE_ID_2=your_second_page_id
    GEMINI_API_KEY=AIza...
    PORT=3000
    ```
4.  **Share Notion Pages**:
    *   Go to your Notion pages.
    *   Click `...` (top right) > `Connections` > `Add connections`.
    *   Select your integration. **This is required for the agent to see the pages.**

## 🏃‍♂️ Running the Agent

Start the server:
```bash
npm start
```

Open your browser and go to:
`http://localhost:3000`

## 💡 Usage Examples

*   **Reading**: "What is written on page 1?"
*   **Writing**: "Write a meeting agenda on page 2."
*   **Mediating**: "Read the user profile from page 1 and create a summary on page 2."
*   **Formatting**: "Create a list of tasks on page 1 with a heading."

## 📂 Project Structure

*   `server.js`: Express server entry point.
*   `agent.js`: Core AI logic (Gemini integration, tool selection).
*   `notionClient.js`: Notion API wrapper (Read/Write/Markdown conversion).
*   `public/`: Frontend files (HTML/CSS/JS).

## 🐛 Troubleshooting

*   **500 Internal Server Error**: Usually means the Notion page is not shared with the integration. Check `FIX_NOTION_ACCESS.md`.
*   **npm not found**: Install Node.js. Check `INSTALL_NODE.md`.
