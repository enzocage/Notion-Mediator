require('dotenv').config();

if (process.env.GEMINI_API_KEY) {
    console.log("GEMINI_API_KEY is present.");
    console.log("Key length:", process.env.GEMINI_API_KEY.length);
    if (process.env.GEMINI_API_KEY.startsWith("AIza")) {
        console.log("Key format looks correct (starts with AIza).");
    } else {
        console.log("Key format might be incorrect (does not start with AIza).");
    }
} else {
    console.log("GEMINI_API_KEY is MISSING.");
}
