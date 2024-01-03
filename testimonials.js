$(".swiper").append(`<div class="swiper-arrow button-prev"></div>`);
$(".swiper").append(`<div class="swiper-arrow button-next"></div>`);
const swiper1 = new Swiper(".swiper1", {
  // Optional parameters
  direction: "horizontal",
  loop: true,
  slidesPerView: 1,
  slidesPerGroup: 1,
  spaceBetween: 24,
  loop: true,
  centeredSlides: false,
  mousewheel: {
    forceToAxis: true
  },
  speed: 300,
  // Responsive breakpoints
  breakpoints: {
    // when window width is >= 480px
    480: {
      slidesPerView: 1
    },
    // when window width is >= 768px
    768: {
      slidesPerView: 2
    },
    // when window width is >= 992px
    992: {
      slidesPerView: 3.5
    }
  },
  // If we need pagination
  pagination: {
    el: ".swiper-pagination",
    clickable: true
  },
  // Navigation arrows
  navigation: {
    nextEl: ".button-next",
    prevEl: ".button-prev"
  },
  // And if we need scrollbar
  scrollbar: {
    el: ".swiper-scrollbar",
    draggable: true
  }
});
