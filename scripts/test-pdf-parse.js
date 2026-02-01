console.log("Testing pdf-parse...");
const pdf = require('pdf-parse');
console.log("Imported pdf-parse:", pdf);

// Create a dummy PDF buffer (minimal valid PDF structure if possible, or key off a real file if we had one)
// Since we don't have a guaranteed PDF file, let's try a minimal buffer or catch the specific error if it's "Invalid PDF structure" vs "Module not found".

// Valid minimal PDF header
const dummyBuffer = Buffer.from("%PDF-1.7\n%EOF");

pdf(dummyBuffer).then(function (data) {
    console.log("Success! Parsed pages:", data.numpages);
    console.log("Text content:", data.text);
}).catch(function (error) {
    if (error.message.includes("Invalid PDF structure")) {
        console.log("Library loaded successfully (errored on dummy data as expected).");
    } else {
        console.error("Library Failed:", error);
    }
});
