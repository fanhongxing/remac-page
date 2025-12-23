(() => {
  const prevBtn = document.getElementById('results-prev');
  const nextBtn = document.getElementById('results-next');
  const carouselContent = document.getElementById('results-carousel-content');
  const imgOriginal = document.getElementById('results-img-original');
  const imgGenerated = document.getElementById('results-img-generated');
  const caption = document.getElementById('results-pair-caption');

  if (!prevBtn || !nextBtn || !carouselContent || !imgOriginal || !imgGenerated || !caption) return;

  // Replace these with your real figures.
  // Tip: put images under paper_web/static/images/ and reference like "static/images/xxx.png".
  const groups = [
    {
      id: 'ex1',
      name: 'Example 1',
      original: 'static/images/original1.png',
      generated: 'static/images/result1.png',
      caption: ''
    },
    {
      id: 'ex2',
      name: 'Example 2',
      original: 'static/images/original2.png',
      generated: 'static/images/result2.png',
      caption: ''
    }
  ];

  let activeIndex = 0;
  let isAnimating = false;

  const render = (index, animate = true, direction = 0) => {
    const g = groups[index];
    if (!g) return;

    const apply = () => {
      imgOriginal.src = g.original;
      imgGenerated.src = g.generated;
      caption.textContent = g.caption || '';
    };

    if (!animate) {
      apply();
      return;
    }

    if (isAnimating) return;
    isAnimating = true;

    const outClass = direction >= 0 ? 'is-slide-out-left' : 'is-slide-out-right';
    const inOffset = direction >= 0 ? '12%' : '-12%';

    // Slide current content out.
    carouselContent.classList.add(outClass);

    window.setTimeout(() => {
      // Swap content while faded out.
      apply();

      // Prepare: jump to the opposite side (still invisible), then slide in.
      carouselContent.classList.remove(outClass);
      carouselContent.style.transition = 'none';
      carouselContent.style.transform = `translateX(${inOffset})`;
      carouselContent.style.opacity = '0';

      // Force reflow
      void carouselContent.offsetHeight;

      carouselContent.style.transition = '';
      carouselContent.style.transform = '';
      carouselContent.style.opacity = '';

      window.setTimeout(() => {
        isAnimating = false;
      }, 280);
    }, 200);
  };

  const wrapIndex = (i) => {
    const n = groups.length;
    return ((i % n) + n) % n;
  };

  const go = (delta) => {
    activeIndex = wrapIndex(activeIndex + delta);
    render(activeIndex, true, delta);
  };

  prevBtn.addEventListener('click', () => go(-1));
  nextBtn.addEventListener('click', () => go(1));

  // Optional: keyboard navigation when focused on the carousel area.
  carouselContent.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
  });
  carouselContent.tabIndex = 0;

  // Initialize
  render(activeIndex, false);
})();
