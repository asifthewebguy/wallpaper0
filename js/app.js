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

    // Fetch all image IDs
    async function fetchImageIds() {
        try {
            const response = await fetch('api/images');
            if (!response.ok) {
                throw new Error('Failed to fetch image IDs');
            }
            images = await response.json();
            if (images.length > 0) {
                // Start with a random image
                currentIndex = Math.floor(Math.random() * images.length);
                setBackgroundImage(images[currentIndex]);
            }
        } catch (error) {
            console.error('Error fetching image IDs:', error);
        }
    }

    // Set background image
    function setBackgroundImage(imageId) {
        // Create a new image to preload
        const img = new Image();
        img.onload = () => {
            // Once loaded, set as background
            backgroundContainer.style.backgroundImage = `url(api/images/${imageId})`;
            imageIdSpan.textContent = imageId;
        };
        img.src = `api/images/${imageId}`;
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

    randomBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('api/random');
            if (!response.ok) {
                throw new Error('Failed to fetch random image');
            }
            const randomImage = await response.json();
            // Find the index of this image in our array
            const index = images.indexOf(randomImage.id);
            if (index !== -1) {
                currentIndex = index;
            }
            setBackgroundImage(randomImage.id);
        } catch (error) {
            console.error('Error fetching random image:', error);
        }
    });

    // Initialize
    fetchImageIds();

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
