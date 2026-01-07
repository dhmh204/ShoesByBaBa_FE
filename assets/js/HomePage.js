document.addEventListener('DOMContentLoaded', function() {
    
    const wrapper = document.querySelector('.slides-wrapper');
    const dots = document.querySelectorAll('.dot');
    const nextBtn = document.querySelector('.next-btn');
    const prevBtn = document.querySelector('.prev-btn');
    
    const totalSlides = dots.length;
    let currentIndex = 0;
    let autoSlideInterval;

    function showSlide(index) {
        if (index >= totalSlides) {
            currentIndex = 0;
        } else if (index < 0) {
            currentIndex = totalSlides - 1;
        } else {
            currentIndex = index;
        }

        wrapper.style.transform = `translateX(-${currentIndex * 100}%)`;

        dots.forEach(dot => dot.classList.remove('active'));
        dots[currentIndex].classList.add('active');
    }

    function nextSlide() {
        showSlide(currentIndex + 1);
    }

    function prevSlide() {
        showSlide(currentIndex - 1);
    }

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            showSlide(index);
            resetAutoPlay(); 
        });
    });

    nextBtn.addEventListener('click', () => {
        nextSlide();
        resetAutoPlay();
    });

    prevBtn.addEventListener('click', () => {
        prevSlide();
        resetAutoPlay();
    });

    function startAutoPlay() {
        autoSlideInterval = setInterval(nextSlide, 3000); 
    }

    function resetAutoPlay() {
        clearInterval(autoSlideInterval);
        startAutoPlay();
    }

    startAutoPlay();
});

const wishButtons = document.querySelectorAll('.btn-wishlist');

    wishButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            const icon = btn.querySelector('i');
            
            if (icon.classList.contains('fa-regular')) {
                icon.classList.remove('fa-regular');
                icon.classList.add('fa-solid');
                btn.style.color = '#d72128';
            } else {
                icon.classList.remove('fa-solid');
                icon.classList.add('fa-regular');
                btn.style.color = '#333';
            }
        });
    });

