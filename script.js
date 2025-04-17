const themeToggle = document.querySelector(".theme-toggle");
const promtBtn = document.querySelector(".prompt-btn");
const promtInput = document.querySelector(".prompt-input");
const promtForm = document.querySelector(".prompt-form");
const modelSelect = document.getElementById("model-select");
const countSelect = document.getElementById("count-select");
const ratioSelect = document.getElementById("ratio-select");
const gridGallery = document.querySelector(".gallery-grid");

const API_KEY = "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"; 

const examplePrompts = [
    "A magic forest with glowing plants and fairy homes among giant mushrooms",
    "An old steampunk airship floating through golden clouds at sunset",
    "A future Mars colony with glass domes and gardens against red mountains",
    "A dragon sleeping on gold coins in a crystal cave",
];

(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDarkTheme = savedTheme === "dark" || (!savedTheme && systemPrefersDark);
    document.body.classList.toggle("dark-theme", isDarkTheme);
    themeToggle.querySelector("i").className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
})();

const toggleTheme = () => {
    const isDarkTheme = document.body.classList.toggle("dark-theme");
    localStorage.setItem("theme", isDarkTheme ? "dark" : "light");
    themeToggle.querySelector("i").className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
};

themeToggle.addEventListener("click", toggleTheme);

promtBtn.addEventListener("click", () => {
    const prompt = examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
    promtInput.value = prompt;
    promtInput.focus();
});

const getImageDimensions = (aspectRatio, baseSize = 512) => {
    const [width, height] = aspectRatio.split("/").map(Number);
    const scaleFactor = baseSize / Math.sqrt(width * height);
    let calculatedWidth = Math.round(width * scaleFactor);
    let calculatedHeight = Math.round(height * scaleFactor);
    calculatedWidth = Math.floor(calculatedWidth / 16) * 16;
    calculatedHeight = Math.floor(calculatedHeight / 16) * 16;
    return { width: calculatedWidth, height: calculatedHeight };
};

const generateImages = async (selectedModel, imageCount, aspectRatio, promptText) => {
    const MODEL_URL = `https://api-inference.huggingface.co/models/${selectedModel}`;
    const { width, height } = getImageDimensions(aspectRatio);

    const imagePromises = Array.from({ length: imageCount }, async (_, i) => {
        try {
            const response = await fetch(MODEL_URL, {
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                    "Content-Type": "application/json",
                    "x-use-cache": "false",
                },
                method: "POST",
                body: JSON.stringify({
                    inputs: promptText,
                    parameters: { width, height },
                }),
            });

            if (!response.ok) {
                const errorMsg = await response.text(); 
                throw new Error(`API Error: ${response.status} - ${errorMsg}`);
            }

            const result = await response.blob();
            const imgUrl = URL.createObjectURL(result);

            document.getElementById(`img-card-${i}`).classList.remove("loading");
            document.getElementById(`img-card-${i}`).querySelector(".result-img").src = imgUrl;

        } catch (error) {
            console.error(error);
            document.getElementById(`img-card-${i}`).classList.remove("loading");
            document.getElementById(`img-card-${i}`).querySelector(".status-text").textContent = "Error loading image";
        }
    });

    await Promise.allSettled(imagePromises);
};

const createImageCards = (selectedModel, imageCount, aspectRatio, promptText) => {
    gridGallery.innerHTML = ""; 

    for (let i = 0; i < imageCount; i++) {
        const imgCard = document.createElement("div");
        imgCard.classList.add("img-card", "loading");
        imgCard.id = `img-card-${i}`;
        imgCard.style.aspectRatio = aspectRatio;

        imgCard.innerHTML = `
            <div class="status-container">
                <div class="spinner"></div>
                <i class="fa-solid fa-triangle-exclamation"></i>
                <p class="status-text">Generating...</p>
            </div>
            <img src="" alt="Generated Image" class="result-img">
        `;

        gridGallery.appendChild(imgCard);
    }

    generateImages(selectedModel, imageCount, aspectRatio, promptText);
};

const handleFormSubmit = (e) => {
    e.preventDefault();

    const selectedModel = modelSelect.value;
    const imageCount = parseInt(countSelect.value) || 1;
    const aspectRatio = ratioSelect.value || "1/1";
    const promptText = promtInput.value.trim();

    createImageCards(selectedModel, imageCount, aspectRatio, promptText);
};

promtForm.addEventListener("submit", handleFormSubmit);
