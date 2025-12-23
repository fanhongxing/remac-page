(() => {
  const CACHE_BUST = '20251222-15';

  const CONSISTENCY_PROMPT = `You are an evaluator comparing two images:

The original image, which contains the visible part of the object (partially occluded).
The completed image, which shows the object after amodal completion.

Amodal completion is the process of inferring and representing an object’s occluded parts so the object is understood as a **complete, closed whole**.

Your task is to rate how consistent and realistic the completed object itself is.

**Critical Definition of "Incomplete":**
If the completed object still looks cut off, truncated, or has a straight "image border" edge where it should be round or continuous, it is considered **Incomplete**. This is a structural failure.

Evaluation Dimensions:

**1. Structural Continuity (0–4 points)**
*Focus on the closure and logical continuation of the shape.*
* **0: The object boundary is abruptly cut off, forming a straight line or unnatural truncation (looks like the original occluded input). The shape is NOT closed.**
* 1: The object attempts to close the shape but the boundary is severely distorted, jagged, or structurally impossible.
* 2: Generally continuous but with noticeable misalignment or irregularities in the completed region.
* 3: Contours flow seamlessly and align well between completed and visible regions.
* 4: Boundaries are perfectly closed, continuous, and fully consistent with the visible parts.

**2. Semantic Consistency (0–4 points)**
* 0: The completed region introduces incorrect or unrelated elements.
* 1: Roughly matches the object but contains major semantic errors (e.g., wrong parts or unrealistic details).
* 2: Generally consistent but with notable smaller semantic inaccuracies.
* 3: Mostly consistent, with only very minor or negligible semantic differences.
* 4: Perfect match to the original object’s type, structure, and expected real-world form.

**3. Object Realism (0–2 points)**
* 0: The completed object does not resemble a plausible real-world version of the object (e.g., a half-object is not realistic).
* 1: Somewhat realistic but with small inconsistencies.
* 2: Perfectly realistic and faithful to how this object should appear in reality.

Scoring:
Add up the points from all categories.
score = Structural Continuity + Semantic Consistency + Object Realism

Output Format:
{
"score": X,
"dimension_scores": {
"structural_continuity": Y,
"semantic_consistency": Z,
"object_realism": A
},
"explanation": "One or two sentences summarizing why you gave this score."
}`;

  const COMPLETENESS_PROMPT = `You are an expert in visual perception and object recognition.

You will be given **two images**:
- The **first image** is the original image containing the scene.
- The **second image** is the **segmented result** of the main object, obtained from an **Amodal Completion** task.

Your task is to determine whether the segmented object (the second image) represents a **complete and intact** version of the object seen in the original image.

Definitions:

- **"Complete"** means that the object is entirely visible within the image frame, not partially cut off, hidden, or distorted. The segmented result should contain the object in its natural, full form as it appears in the real world.
- **"Incomplete"** means the object is missing parts, truncated at the edges, occluded, or not consistent with the full object that should exist in the original image.

**Important:**
- Focus on comparing the segmented result (second image) with the original image (first image).  
  The segmented object should correspond to the same object visible in the original image and should not miss essential parts.
- If the segmented object appears cut off, has missing limbs or edges, or is inconsistent with the object’s full structure in the original image, it should be classified as **Incomplete**.

Instructions:

1. Carefully compare the segmented object (second image) with the original image (first image).
2. Determine if the segmented object is **Complete** or **Incomplete**.
3. Provide your decision in this strict JSON format:

{
  "object_status": "Complete" | "Incomplete",
  "explanation": "A short sentence explaining why you made this decision, focusing on missing parts, truncation, or mismatch with the original image."
}

Note:
- Only use "Complete" or "Incomplete" as the categories.
- Focus on whether the segmented result accurately represents the complete form of the object seen in the original image.`;
  const prevBtn = document.getElementById('metrics-prev');
  const nextBtn = document.getElementById('metrics-next');
  const carouselContent = document.getElementById('metrics-carousel-content');
  const consistencyPromptEl = document.getElementById('metrics-consistency-prompt');
  const completenessPromptEl = document.getElementById('metrics-completeness-prompt');
  const imgOriginal = document.getElementById('metrics-img-original');
  const imgCompleted = document.getElementById('metrics-img-completed');
  const caption = document.getElementById('metrics-caption');

  const completenessStatus = document.getElementById('metrics-completeness-status');
  const completenessExp = document.getElementById('metrics-completeness-exp');
  const consistencyScore = document.getElementById('metrics-consistency-score');
  const consistencyExp = document.getElementById('metrics-consistency-exp');

  const details = document.getElementById('metrics-details');

  if (!prevBtn || !nextBtn || !carouselContent || !imgOriginal || !imgCompleted || !caption || !completenessStatus || !completenessExp || !consistencyScore || !consistencyExp || !details) return;

  // Replace with your real results.
  // Put images under paper_web/static/images/ and reference like "static/images/xxx.png".
  // completeness: only "Complete" or "Incomplete"
  // consistency: integer in [1, 10]
  const examples = [
    {
      id: 'm1',
      name: 'Example 1',
      original: 'static/images/o_m1.png',
      completed: 'static/images/metric1.png',
      caption: '',
      completeness: { status: 'Complete', explanation: '' },
      consistency: { score: 7, explanation: '' },
      details: {
        score: 7,
        dimension_scores: {
          structural_continuity: 3,
          semantic_consistency: 4,
          object_realism: 0
        },
        explanation:
          'The bench is structurally continuous with smooth, natural-looking slats and legs, matching the original shape well. The details like the metal plate and stains are semantically consistent with the original. However, the object realism is 0 because the figure of the girl is completely removed, leaving an empty bench — which is plausible, but since the task is to complete the object (the girl), her absence means the completed object is not realistic or faithful to the original scene. The completion focuses only on the bench, not the girl, which is the primary subject.'
      }
    },
    {
      id: 'm2',
      name: 'Example 2',
      original: 'static/images/o_m2.png',
      completed: 'static/images/metric2.png',
      caption: '',
      completeness: { status: 'Complete', explanation: '' },
      consistency: { score: 9, explanation: '' },
      details: {
        score: 9,
        dimension_scores: {
          structural_continuity: 4,
          semantic_consistency: 4,
          object_realism: 1
        },
        explanation:
          'The completed kitten shows perfect structural continuity, with a seamless flow from the visible parts to the added tail and hind legs. The fur pattern, color, and posture are semantically consistent with the original kitten. However, the object realism is only 1 because the kitten is isolated against a blank background, lacking context and environmental cues (such as shadow or interaction with the desk), which reduces its perceived plausibility as a real-world scene — though the cat itself looks realistic.'
      }
    },
    {
      id: 'm3',
      name: 'Example 3',
      original: 'static/images/o_m3.png',
      completed: 'static/images/metric3.png',
      caption: '',
      completeness: { status: 'Incomplete', explanation: '' },
      consistency: { score: 4, explanation: '' },
      details: {
        score: 4,
        dimension_scores: {
          structural_continuity: 2,
          semantic_consistency: 3,
          object_realism: 0
        },
        explanation:
          'The guitar has some structural continuity with the neck and headstock extending reasonably from the visible portion, but the body is incomplete and appears broken, with an unnatural, jagged edge where it should be smooth — indicating a failure to close the shape properly. The semantic consistency is decent, as it retains the correct parts (frets, soundhole, headstock) and general appearance of an acoustic guitar. However, the object realism is 0 because the guitar is presented in isolation with no context, and its incomplete, broken form makes it look unrealistic and unfaithful to how a whole acoustic guitar should appear in reality.'
      }
    }
  ];

  let activeIndex = 0;
  let isAnimating = false;

  const normalizeCompleteness = (v) => (String(v || '').toLowerCase() === 'complete' ? 'Complete' : 'Incomplete');
  const clampConsistency = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return 1;
    return Math.max(1, Math.min(10, Math.round(n)));
  };

  const withCacheBust = (url) => {
    if (!url || typeof url !== 'string') return url;
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}v=${encodeURIComponent(CACHE_BUST)}`;
  };

  const resolveOriginal = (ex) => ex.original || ex.input || 'static/images/placeholder.svg';
  const resolveCompleted = (ex) => ex.completed || ex.generated || ex.image || 'static/images/placeholder.svg';

  const applyData = (ex) => {
    imgOriginal.src = withCacheBust(resolveOriginal(ex));
    imgCompleted.src = withCacheBust(resolveCompleted(ex));
    caption.textContent = ex.caption || '';

    const comp = normalizeCompleteness(ex.completeness?.status);
    completenessStatus.textContent = comp;
    completenessStatus.classList.remove('is-success', 'is-danger');
    completenessStatus.classList.add(comp === 'Complete' ? 'is-success' : 'is-danger');
    completenessExp.textContent = ex.completeness?.explanation || '';

    const cons = clampConsistency(ex.consistency?.score);
    consistencyScore.textContent = String(cons);
    consistencyExp.textContent = ex.consistency?.explanation || '';

    details.textContent = JSON.stringify(ex.details ?? {}, null, 2);
  };

  const wrapIndex = (i) => {
    const n = examples.length;
    return ((i % n) + n) % n;
  };

  const render = (index, animate = true, direction = 0) => {
    const ex = examples[index];
    if (!ex) return;

    if (!animate) {
      applyData(ex);
      return;
    }
    if (isAnimating) return;
    isAnimating = true;

    const outClass = direction >= 0 ? 'is-slide-out-left' : 'is-slide-out-right';
    const inOffset = direction >= 0 ? '12%' : '-12%';

    carouselContent.classList.add(outClass);
    window.setTimeout(() => {
      applyData(ex);

      carouselContent.classList.remove(outClass);
      carouselContent.style.transition = 'none';
      carouselContent.style.transform = `translateX(${inOffset})`;
      carouselContent.style.opacity = '0';
      void carouselContent.offsetHeight;
      carouselContent.style.transition = '';
      carouselContent.style.transform = '';
      carouselContent.style.opacity = '';

      window.setTimeout(() => {
        isAnimating = false;
      }, 280);
    }, 200);
  };

  const go = (delta) => {
    activeIndex = wrapIndex(activeIndex + delta);
    render(activeIndex, true, delta);
  };

  prevBtn.addEventListener('click', () => go(-1));
  nextBtn.addEventListener('click', () => go(1));

  if (consistencyPromptEl) consistencyPromptEl.textContent = CONSISTENCY_PROMPT;
  if (completenessPromptEl) completenessPromptEl.textContent = COMPLETENESS_PROMPT;

  carouselContent.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
  });
  carouselContent.tabIndex = 0;

  render(activeIndex, false);
})();
