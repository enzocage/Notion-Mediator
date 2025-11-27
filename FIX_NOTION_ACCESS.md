# Fix: Notion "Object Not Found" Error

The "Internal Server Error" (500) you are seeing is because **Notion is blocking the Agent**.
The Agent cannot see your pages until you explicitly share them.

## How to Fix

1.  **Go to Notion** in your browser.
2.  Navigate to the first page: [Test1](https://www.notion.so/we-space/test1-2b844e3051ef80f5ad24f4a9c76fb1b0)
3.  Click the **`...`** (three dots) menu in the top right corner of the page.
4.  Scroll down to **"Connections"** (or "Add connections").
5.  Search for and select your integration name (the one associated with your API Key `ntn_...`).
6.  **Repeat** this for the second page: [Test2](https://www.notion.so/we-space/Test2-2b844e3051ef80b4bcb7efb7b8222f3f)

## After Sharing
1.  **Restart the server** in your terminal:
    - Press `Ctrl+C` to stop it.
    - Run `npm start` again.
2.  Try "Read page 1" again.
