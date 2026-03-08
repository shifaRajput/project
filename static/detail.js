// Back link
document.querySelector(".back-btn").addEventListener("click", () => {
  window.history.back();
});

const container = document.getElementById('container');
const lens = document.getElementById('lens');
const result = document.getElementById('result');
const mainImg = document.getElementById('main-img');
const mainVideo = document.getElementById('main-video'); // Added
const thumbnails = document.querySelectorAll('.thumbnail-column > *'); // Updated to select img and video divs

// FULLSCREEN ELEMENTS
const fullscreenViewer = document.getElementById('fullscreenViewer');
const fullscreenImage = document.getElementById('fullscreenImage');
const closeViewer = document.getElementById('closeViewer');
const prevBtn = document.getElementById('prevImage');
const nextBtn = document.getElementById('nextImage');

let currentIndex = 0;
// Filter only images for the fullscreen gallery array
const images = Array.from(document.querySelectorAll('.thumbnail-column img')).map(img => img.src);

// --- THUMBNAIL CLICK LOGIC ---
thumbnails.forEach((thumb) => {
  thumb.addEventListener('click', () => {
    // Manage active class
    thumbnails.forEach(t => t.classList.remove('active'));
    thumb.classList.add('active');

    // Check if clicked thumbnail is a video
    const videoSrc = thumb.getAttribute('data-src');

    if (videoSrc) {
      // It's a VIDEO
      mainImg.style.display = 'none';
      lens.style.display = 'none';
      result.style.display = 'none'; // Hide zoom result

      mainVideo.style.display = 'block';
      mainVideo.src = videoSrc;
      mainVideo.load();
      mainVideo.play().catch(e => console.log("Playback interaction required"));
    } else {
      // It's an IMAGE
      mainVideo.pause();
      mainVideo.style.display = 'none';
      
      mainImg.style.display = 'block';
      mainImg.src = thumb.src;
      result.style.backgroundImage = `url('${thumb.src}')`;

      // Update currentIndex for fullscreen (find index in the images-only array)
      currentIndex = images.indexOf(thumb.src);
    }
  });
});

// --- DESKTOP ZOOM ---
container.addEventListener('mousemove', moveLens);
container.addEventListener('mouseenter', () => {
  // Only show zoom if image is visible (not video)
  if (window.innerWidth > 768 && mainImg.style.display !== 'none') {
    lens.style.display = 'block';
    result.style.display = 'block';
  }
});
container.addEventListener('mouseleave', () => {
  lens.style.display = 'none';
  result.style.display = 'none';
});

function moveLens(e) {
  if (window.innerWidth <= 768 || mainImg.style.display === 'none') return;

  const rect = container.getBoundingClientRect();
  let x = e.clientX - rect.left;
  let y = e.clientY - rect.top;

  let posX = x - (lens.offsetWidth / 2);
  let posY = y - (lens.offsetHeight / 2);

  if (posX < 0) posX = 0;
  if (posY < 0) posY = 0;
  if (posX > rect.width - lens.offsetWidth) posX = rect.width - lens.offsetWidth;
  if (posY > rect.height - lens.offsetHeight) posY = rect.height - lens.offsetHeight;

  lens.style.left = posX + 'px';
  lens.style.top = posY + 'px';

  const ratioX = result.offsetWidth / lens.offsetWidth;
  const ratioY = result.offsetHeight / lens.offsetHeight;

  result.style.backgroundImage = `url('${mainImg.src}')`;
  result.style.backgroundSize = (mainImg.width * ratioX) + "px " + (mainImg.height * ratioY) + "px";
  result.style.backgroundPosition = `-${posX * ratioX}px -${posY * ratioY}px`;
}

// --- MOBILE FULLSCREEN ---
mainImg.addEventListener('click', () => {
  if (window.innerWidth <= 768) {
    fullscreenViewer.classList.add('active');
    fullscreenImage.src = images[currentIndex];
  }
});

closeViewer.addEventListener('click', () => {
  fullscreenViewer.classList.remove('active');
});

prevBtn.addEventListener('click', () => {
  currentIndex = (currentIndex - 1 + images.length) % images.length;
  fullscreenImage.src = images[currentIndex];
});

nextBtn.addEventListener('click', () => {
  currentIndex = (currentIndex + 1) % images.length;
  fullscreenImage.src = images[currentIndex];
});

// Swipe support
let startX = 0;
fullscreenViewer.addEventListener('touchstart', e => {
  startX = e.touches[0].clientX;
});

fullscreenViewer.addEventListener('touchend', e => {
  let endX = e.changedTouches[0].clientX;
  if (startX - endX > 50) nextBtn.click();
  if (endX - startX > 50) prevBtn.click();
});

// --- TABS & OTHER ---
function openTab(tabId) {
  const tabs = document.querySelectorAll(".tab-content");
  const buttons = document.querySelectorAll(".tab-btn");

  tabs.forEach(tab => tab.classList.remove("active"));
  buttons.forEach(btn => btn.classList.remove("active"));

  document.getElementById(tabId).classList.add("active");
  event.target.classList.add("active");
}

const wishlistBtn = document.getElementById("wishlistBtn");
if (wishlistBtn) {
    wishlistBtn.addEventListener("click", () => {
      wishlistBtn.classList.toggle("active");
      const icon = wishlistBtn.querySelector("i");
      icon.classList.toggle("fa-regular");
      icon.classList.toggle("fa-solid");
    });
}

document.querySelectorAll('.button').forEach(button => {
    let count = 1;

    button.addEventListener('click', e => {
        const target = e.target;

        // 1. Initial Click: Trigger Cart Animation
        if (!button.classList.contains('loading') && !button.classList.contains('added')) {
            button.classList.add('loading');
            
            setTimeout(() => {
                button.classList.remove('loading');
                button.classList.add('added');
            }, 3400); // Matches CSS animation duration
        }

        // 2. Plus Logic
        if (target.classList.contains('plus')) {
            count++;
            button.querySelector('.qty').innerText = count;
        }

        // 3. Minus Logic
        if (target.classList.contains('minus')) {
            count--;
            if (count > 0) {
                button.querySelector('.qty').innerText = count;
            } else {
                // Reset back to "Add to Cart" if it hits 0
                button.classList.remove('added');
                count = 1;
                button.querySelector('.qty').innerText = count;
            }
        }

        e.preventDefault();
    });
});