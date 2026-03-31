let bgAudio = null;

// SPA Tab Switching Logic
function switchTab(tabId) {
    const sections = {
        home: document.getElementById('home-section'),
        video: document.getElementById('video-section'),
        gallery: document.getElementById('gallery-section')
    };
    
    const navBtns = {
        home: document.getElementById('nav-btn-home'),
        video: document.getElementById('nav-btn-video'),
        gallery: document.getElementById('nav-btn-gallery')
    };

    // 1. Hide all blocks first
    Object.keys(sections).forEach(key => {
        const section = sections[key];
        if (key !== tabId && !section.classList.contains('hidden')) {
            section.classList.replace('opacity-100', 'opacity-0');
            if (key === 'home') section.classList.replace('visible', 'invisible');
            
            setTimeout(() => {
                section.classList.add('hidden');
            }, 300);
        }
    });

    // 2. Cleanup specifics when leaving certain tabs and manage background audio
    if (tabId !== 'video') {
        document.querySelectorAll('#video-section video').forEach(v => { 
            v.pause();
            const overlay = v.nextElementSibling;
            if (overlay) {
                const icon = overlay.querySelector('span');
                if(icon) icon.textContent = 'play_circle';
                overlay.style.opacity = '1';
            }
        });
        
        // Resume background audio if returning to non-video tab
        if (bgAudio && bgAudio.paused) {
            bgAudio.play().catch(e => console.log('Audio autoplay blocked'));
        }
    } else {
        // Pause background audio when in video tab
        if (bgAudio && !bgAudio.paused) {
            bgAudio.pause();
        }
    }

    // 3. Show requested tab
    const activeSection = sections[tabId];
    if (activeSection) {
        activeSection.classList.remove('hidden');
        setTimeout(() => {
            activeSection.classList.replace('opacity-0', 'opacity-100');
            if (tabId === 'home') activeSection.classList.replace('invisible', 'visible');
            
            // Try autoplay for video tab
            if (tabId === 'video') {
                const firstVideo = document.querySelector('#video-section video');
                if (firstVideo && firstVideo.paused) {
                    firstVideo.play().catch(e => console.log('Autoplay block:', e));
                }
            }
        }, 50);
    }
    
    // 4. Update Nav UI Mobile
    Object.keys(navBtns).forEach(key => {
        const btn = navBtns[key];
        if (!btn) return;
        
        if (key === tabId) {
            btn.className = "flex flex-col items-center justify-center bg-[#ffe0ea] text-[#9f3164] rounded-full px-4 py-1 transition-all";
            btn.querySelector('span:first-child').style.fontVariationSettings = "'FILL' 1";
        } else {
            btn.className = "flex flex-col items-center justify-center text-[#4a2134] hover:bg-[#ffecf1] rounded-full p-2 transition-all";
            btn.querySelector('span:first-child').style.fontVariationSettings = "'FILL' 0";
        }
    });
}

// Fetch and Setup Videos
async function loadVideos() {
    try {
        const response = await fetch('link_video.json');
        if (!response.ok) throw new Error('Failed to load video links');
        const videoList = await response.json();
        
        const videoSection = document.getElementById('video-section');
        videoSection.innerHTML = ''; // Clear existing videos if any
        
        videoList.forEach(url => {
            const videoContainer = document.createElement('div');
            videoContainer.className = "h-full w-full snap-center relative flex justify-center items-center shrink-0";
            
            videoContainer.innerHTML = `
                <video src="${url}" class="h-full w-full object-cover" loop preload="auto" playsinline></video>
                <div class="absolute inset-0 flex items-center justify-center transition-opacity cursor-pointer play-pause-trigger">
                    <span class="material-symbols-outlined text-white text-6xl drop-shadow-lg" data-icon="play_circle" style="text-shadow: 0px 4px 12px rgba(0,0,0,0.5);">play_circle</span>
                </div>
            `;
            videoSection.appendChild(videoContainer);
        });

        // Initialize Intersection Observer and Click Events
        initVideoLogic();
    } catch (error) {
        console.error('Error loading videos:', error);
    }
}

function initVideoLogic() {
    const videos = document.querySelectorAll('#video-section video');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            const overlay = video.nextElementSibling;
            const icon = overlay.querySelector('span');

            if (entry.isIntersecting) {
                if (!document.getElementById('video-section').classList.contains('hidden')) {
                    video.play().then(() => {
                        icon.textContent = 'pause_circle';
                        overlay.style.opacity = '0'; // Hide play button when playing
                    }).catch(e => {
                        console.log('Autoplay prevented:', e);
                        icon.textContent = 'play_circle';
                        overlay.style.opacity = '1';
                    });
                }
            } else {
                video.pause();
                icon.textContent = 'play_circle';
                overlay.style.opacity = '1';
            }
        });
    }, {
        root: document.getElementById('video-section'),
        threshold: 0.6
    });

    videos.forEach(video => {
        observer.observe(video);
        const overlay = video.nextElementSibling;
        const icon = overlay.querySelector('span');

        const togglePlay = () => {
            if (video.paused) {
                video.play();
                icon.textContent = 'pause_circle';
                overlay.style.opacity = '0';
            } else {
                video.pause();
                icon.textContent = 'play_circle';
                overlay.style.opacity = '1';
            }
        };

        video.addEventListener('click', togglePlay);
        overlay.addEventListener('click', togglePlay);
    });
}

// Fetch and Setup Gallery
async function loadGallery() {
    try {
        const response = await fetch('link_img.json');
        if (!response.ok) throw new Error('Failed to load image links');
        const imgList = await response.json();
        
        const galleryScroll = document.getElementById('gallery-scroll');
        const totalSpan = document.getElementById('gallery-total');
        
        // Cập nhật tổng số ảnh
        totalSpan.textContent = imgList.length;
        galleryScroll.innerHTML = '';
        
        imgList.forEach(url => {
            const imgContainer = document.createElement('div');
            imgContainer.className = "w-full shrink-0 snap-center h-full flex justify-center items-center py-4 px-2";
            
            imgContainer.innerHTML = `
                <img src="${url}" loading="lazy" class="max-h-full max-w-full object-contain rounded-xl drop-shadow-[0_10px_20px_rgba(255,255,255,0.05)]">
            `;
            galleryScroll.appendChild(imgContainer);
        });

        // Initialize Scroll Logic for Counter
        initGalleryCounter();
        
    } catch (error) {
        console.error('Error loading gallery:', error);
    }
}

function initGalleryCounter() {
    const galleryScroll = document.getElementById('gallery-scroll');
    const currentSpan = document.getElementById('gallery-current');

    galleryScroll.addEventListener('scroll', () => {
        // Find which image is centered based on scroll distance
        const scrollPosition = galleryScroll.scrollLeft;
        const windowWidth = galleryScroll.clientWidth;
        
        const currentIndex = Math.round(scrollPosition / windowWidth) + 1;
        currentSpan.textContent = currentIndex;
    });
}

// Fetch and Setup Background Audio
async function loadAudio() {
    try {
        const response = await fetch('link_audio.json');
        if (!response.ok) throw new Error('Failed to load audio link');
        const audioList = await response.json();
        
        if (audioList.length > 0) {
            bgAudio = new Audio(audioList[0]);
            bgAudio.loop = true;
            
            // Try to play on first interaction 
            const unlockAudio = () => {
                const videoSection = document.getElementById('video-section');
                // Only autoplay if we are not currently in the video tab
                if (bgAudio.paused && (!videoSection || videoSection.classList.contains('hidden'))) {
                    bgAudio.play().catch(e => console.log('Autoplay blocked'));
                }
                document.body.removeEventListener('click', unlockAudio);
                document.body.removeEventListener('touchstart', unlockAudio);
            };
            document.body.addEventListener('click', unlockAudio);
            document.body.addEventListener('touchstart', unlockAudio);
        }
    } catch (error) {
        console.error('Error loading audio:', error);
    }
}

// Initialize everything on boot
document.addEventListener('DOMContentLoaded', () => {
    loadAudio();
    loadVideos();
    loadGallery();
});
