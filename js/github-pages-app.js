document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const backgroundContainer = document.getElementById('background-container');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const randomBtn = document.getElementById('random-btn');
    const imageIdSpan = document.getElementById('image-id');

    // State variables
    let images = [];
    let currentIndex = 0;

    // For GitHub Pages, we'll use a JSON file with image data
    async function fetchImageData() {
        try {
            const response = await fetch('data/images.json');
            if (!response.ok) {
                throw new Error('Failed to fetch image data');
            }
            const data = await response.json();
            images = data;
            if (images.length > 0) {
                // Start with a random image
                currentIndex = Math.floor(Math.random() * images.length);
                setBackgroundImage(images[currentIndex]);
            }
        } catch (error) {
            console.error('Error fetching image data:', error);
        }
    }

    // Set background image
    function setBackgroundImage(imageData) {
        // Create a new image to preload
        const img = new Image();
        img.onload = () => {
            // Once loaded, set as background
            backgroundContainer.style.backgroundImage = `url(${imageData.path})`;
            imageIdSpan.textContent = imageData.id;
        };
        img.src = imageData.path;
    }

    // Event handlers
    prevBtn.addEventListener('click', () => {
        if (images.length === 0) return;
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        setBackgroundImage(images[currentIndex]);
    });

    nextBtn.addEventListener('click', () => {
        if (images.length === 0) return;
        currentIndex = (currentIndex + 1) % images.length;
        setBackgroundImage(images[currentIndex]);
    });

    randomBtn.addEventListener('click', () => {
        if (images.length === 0) return;
        currentIndex = Math.floor(Math.random() * images.length);
        setBackgroundImage(images[currentIndex]);
    });

    // Initialize
    fetchImageData();

    // Add keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            prevBtn.click();
        } else if (e.key === 'ArrowRight') {
            nextBtn.click();
        } else if (e.key === 'r' || e.key === 'R') {
            randomBtn.click();
        }
    });
});
