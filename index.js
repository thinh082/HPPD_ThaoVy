// SPA Tab Switching Logic
function switchTab(tabId) {
    const homeSection = document.getElementById('home-section');
    const videoSection = document.getElementById('video-section');
    const navHome = document.getElementById('nav-btn-home');
    const navVideo = document.getElementById('nav-btn-video');

    if (tabId === 'video') {
        // UI changes
        videoSection.classList.remove('hidden'); // allow intersection observer to catch the click context
        homeSection.classList.replace('opacity-100', 'opacity-0');
        homeSection.classList.replace('visible', 'invisible');
        setTimeout(() => {
            homeSection.classList.add('hidden');
            setTimeout(() => {
                videoSection.classList.replace('opacity-0', 'opacity-100');
                // Try to play the most visible video immediately to secure browser autoplay allowance
                const firstVideo = document.querySelector('#video-section video');
                if (firstVideo && firstVideo.paused) {
                    firstVideo.play().catch(e => console.log('Autoplay block:', e));
                }
            }, 50);
        }, 300);

        // Update bottom nav styling
        if (navHome && navVideo) {
            navHome.className = "flex flex-col items-center justify-center text-[#4a2134] hover:bg-[#ffecf1] rounded-full p-2 transition-all";
            navHome.querySelector('span:first-child').style.fontVariationSettings = "'FILL' 0";
            
            navVideo.className = "flex flex-col items-center justify-center bg-[#ffe0ea] text-[#9f3164] rounded-full px-4 py-1 transition-all";
            navVideo.querySelector('span:first-child').style.fontVariationSettings = "'FILL' 1";
        }
    } else {
        // UI changes
        videoSection.classList.replace('opacity-100', 'opacity-0');
        setTimeout(() => {
            videoSection.classList.add('hidden');
            homeSection.classList.remove('hidden');
            setTimeout(() => {
                homeSection.classList.replace('opacity-0', 'opacity-100');
                homeSection.classList.replace('invisible', 'visible');
            }, 50);
        }, 300);
        
        // Update bottom nav styling
        if (navHome && navVideo) {
            navVideo.className = "flex flex-col items-center justify-center text-[#4a2134] hover:bg-[#ffecf1] rounded-full p-2 transition-all";
            navVideo.querySelector('span:first-child').style.fontVariationSettings = "'FILL' 0";

            navHome.className = "flex flex-col items-center justify-center bg-[#ffe0ea] text-[#9f3164] rounded-full px-4 py-1 transition-all";
            navHome.querySelector('span:first-child').style.fontVariationSettings = "'FILL' 1";
        }
        
        // Pause all videos
        document.querySelectorAll('#video-section video').forEach(v => { 
            v.pause();
            const icon = v.nextElementSibling.querySelector('span');
            icon.textContent = 'play_circle';
            v.nextElementSibling.style.opacity = '1';
        });
    }
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
            videoContainer.className = "h-full w-full snap-center relative flex justify-center items-center";
            
            videoContainer.innerHTML = `
                <video src="${url}" class="h-full w-full object-cover" loop preload="auto" playsinline></video>
                <div class="absolute inset-0 flex items-center justify-center transition-opacity cursor-pointer play-pause-trigger">
                    <span class="material-symbols-outlined text-white text-6xl drop-shadow-lg" data-icon="play_circle" style="text-shadow: 0px 4px 12px rgba(0,0,0,0.5);">play_circle</span>
                </div>
            `;
            videoSection.appendChild(videoContainer);
        });

        // Initialize Intersection Observer and Click Events for newly created videos
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
                // Play only if video section is visible
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

// On Page Load, call fetch logic
document.addEventListener('DOMContentLoaded', loadVideos);
