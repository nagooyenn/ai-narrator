let speech = new SpeechSynthesisUtterance();
let isSpeaking = false;
let fullText = "";
let currentWordIndex = 0;
let words = [];
let pdfPages = [];  // Array to hold PDF page content

speech.onend = () => { isSpeaking = false; };

function playNarration() {
    if (!isSpeaking) {
        stopNarration();
        const text = document.getElementById("story").value.trim();
        if (text !== "") {
            speech.text = text;
            speech.lang = 'en-US';
            words = text.split(" ");
            currentWordIndex = 0;
            speech.onboundary = highlightWords;
            window.speechSynthesis.speak(speech);
            isSpeaking = true;
        }
    }
}

function stopNarration() {
    window.speechSynthesis.cancel();
    isSpeaking = false;
    clearHighlight();
}

function pauseNarration() {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
    }
}

function resumeNarration() {
    if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
    }
}

function handleFile() {
    const file = document.getElementById("fileInput").files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function() {
            const typedArray = new Uint8Array(reader.result);
            pdfjsLib.getDocument(typedArray).promise.then(pdf => {
                let text = "";
                pdfPages = []; // Clear previous page content
                const promises = [];
                for (let i = 1; i <= pdf.numPages; i++) {
                    promises.push(
                        pdf.getPage(i).then(page => page.getTextContent())
                        .then(content => {
                            let pageText = content.items.map(item => item.str).join(" ");
                            pdfPages.push(pageText); // Store page content separately
                        })
                    );
                }
                Promise.all(promises).then(() => {
                    fullText = pdfPages.join("\n\n");  // Combine pages with a clear separator
                    updatePreview();
                });
            });
        };
        reader.readAsArrayBuffer(file);
    }
}

function updatePreview() {
    const previewDiv = document.getElementById("preview");
    previewDiv.innerHTML = ''; // Clear previous content

    // Render each page separately
    pdfPages.forEach((pageText, index) => {
        let pageDiv = document.createElement('div');
        pageDiv.classList.add('pdf-page');
        pageDiv.innerHTML = `<strong>Page ${index + 1}</strong><p>${pageText}</p>`;
        pageDiv.onclick = () => readFromPreview(index);
        previewDiv.appendChild(pageDiv);
    });

    document.getElementById("story").value = fullText;

    // Set up clickable words
    setupClickableWords();
}

function showPageCount() {
    const file = document.getElementById("fileInput").files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function() {
            const typedArray = new Uint8Array(reader.result);
            pdfjsLib.getDocument(typedArray).promise.then(pdf => {
                document.getElementById("pageCount").innerText = "Total Pages: " + pdf.numPages;
            });
        };
        reader.readAsArrayBuffer(file);
    }
}

function highlightWords(event) {
    let previewDiv = document.getElementById("preview");
    let text = previewDiv.innerText;
    let wordsArray = text.split(" ");

    if (currentWordIndex < wordsArray.length) {
        wordsArray[currentWordIndex] = `<span class="highlight">${wordsArray[currentWordIndex]}</span>`;
        previewDiv.innerHTML = wordsArray.join(" ");
        currentWordIndex++;
    }
}

function clearHighlight() {
    let previewDiv = document.getElementById("preview");
    previewDiv.innerText = fullText;
    currentWordIndex = 0;
}

function readFromPreview(pageIndex) {
    if (isSpeaking) {
        stopNarration();
    }
    const pageText = pdfPages[pageIndex];
    speech.text = pageText;
    words = pageText.split(" ");
    currentWordIndex = 0;
    speech.onboundary = highlightWords;
    window.speechSynthesis.speak(speech);
    isSpeaking = true;
}

// Function to handle clicking on specific words in the preview
function setupClickableWords() {
    const previewDiv = document.getElementById("preview");
    let wordsArray = previewDiv.innerText.split(" ");
    previewDiv.innerHTML = wordsArray.map(word => {
        return `<span class="clickable-word">${word}</span>`;
    }).join(" ");

    const clickableWords = document.querySelectorAll(".clickable-word");
    clickableWords.forEach((wordElement, index) => {
        wordElement.addEventListener('click', () => {
            stopNarration();  // Stop current narration
            currentWordIndex = index;  // Set current index to clicked word
            speech.text = wordsArray.slice(index).join(" ");  // Read from the clicked word onwards
            window.speechSynthesis.speak(speech);
        });

        // Add hover effect to show that it's clickable
        wordElement.addEventListener('mouseenter', () => {
            wordElement.style.textDecoration = 'underline';
        });
        wordElement.addEventListener('mouseleave', () => {
            wordElement.style.textDecoration = 'none';
        });
    });
}
