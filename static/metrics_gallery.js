(() => {
  const CACHE_BUST = '20251225-2';

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
  const consistencyScore = document.getElementById('metrics-consistency-score');
  const consistencyExp = document.getElementById('metrics-consistency-exp');

  const details = document.getElementById('metrics-details');

  if (!prevBtn || !nextBtn || !carouselContent || !imgOriginal || !imgCompleted || !caption || !completenessStatus || !consistencyScore || !consistencyExp || !details) return;

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
      completeness: {
        status: 'Complete',
        explanation:
          'The segmented result accurately represents the full structure of the bench visible in the original image, including its seat, backrest, and legs, without any missing parts or truncation.'
      },
      consistency: { score: 7, explanation: '' },
      details: {
        score: 7,
        dimension_scores: {
          structural_continuity: 3,
          semantic_consistency: 4,
          object_realism: 0
        },
        explanation:
          "The bench is structurally continuous with smooth, natural-looking slats and legs, matching the original shape well. The details like the metal plate and stains are semantically consistent with the original. However, the object realism is 0 because the figure of the girl is completely removed, leaving an empty bench — which is plausible, but since the task is to complete the object (the girl), her absence means the completed object is not realistic or faithful to the original scene. The completion focuses only on the bench, not the girl, which is the primary subject."
      }
    },
    {
      id: 'm2',
      name: 'Example 2',
      original: 'static/images/o_m2.png',
      completed: 'static/images/metric2.png',
      caption: '',
      completeness: {
        status: 'Complete',
        explanation:
          'The segmented kitten includes all visible parts from the original image—head, body, legs, and tail—with no missing limbs or truncation, representing the full form of the kitten as it appears in the scene.'
      },
      consistency: { score: 9, explanation: '' },
      details: {
        score: 9,
        dimension_scores: {
          structural_continuity: 4,
          semantic_consistency: 4,
          object_realism: 1
        },
        explanation:
          "The completed kitten shows perfect structural continuity, with a seamless flow from the visible parts to the added tail and hind legs. The fur pattern, color, and posture are semantically consistent with the original kitten. However, the object realism is only 1 because the kitten is isolated against a blank background, lacking context and environmental cues (such as shadow or interaction with the desk), which reduces its perceived plausibility as a real-world scene — though the cat itself looks realistic."
      }
    },
    {
      id: 'm3',
      name: 'Example 3',
      original: 'static/images/o_m3.png',
      completed: 'static/images/metric3.png',
      caption: '',
      completeness: {
        status: 'Incomplete',
        explanation:
          "The segmented guitar is missing a large portion of its body and has a jagged, broken appearance, unlike the intact guitar seen being played in the original image. This indicates the segmentation is incomplete and not a full representation of the object."
      },
      consistency: { score: 4, explanation: '' },
      details: {
        score: 4,
        dimension_scores: {
          structural_continuity: 2,
          semantic_consistency: 3,
          object_realism: 0
        },
        explanation:
          "The guitar has some structural continuity with the neck and headstock extending reasonably from the visible portion, but the body is incomplete and appears broken, with an unnatural, jagged edge where it should be smooth — indicating a failure to close the shape properly. The semantic consistency is decent, as it retains the correct parts (frets, soundhole, headstock) and general appearance of an acoustic guitar. However, the object realism is 0 because the guitar is presented in isolation with no context, and its incomplete, broken form makes it look unrealistic and unfaithful to how a whole acoustic guitar should appear in reality."
      }
    },
    // Placeholders (4-10): replace the image paths after you prepare your figures.
    // Suggested filenames under paper_web/static/images/:
    // - original: o_m{n}.png
    // - completed: metric{n}.png
    {
      id: 'm4',
      name: 'Example 4',
      original: 'static/images/o_m4.png',
      completed: 'static/images/metric4.png',
      caption: '',
      // TODO: set original -> 'static/images/o_m4.png'
      // TODO: set completed -> 'static/images/metric4.png'
      completeness: { 
        status: 'Complete', 
        explanation: 
          "The segmented elephant includes all major body parts—head, trunk, ears, legs, and tail—without any truncation or missing sections, accurately representing the full form of the elephant as it would appear in the real world, even though the original image shows only part of the elephant's body."
      },
      consistency: { score: 8, explanation: '' },
      details: {
        score: 8,
          dimension_scores: {
            structural_continuity: 4,
            semantic_consistency: 4,
            object_realism: 0
          },
          explanation: "The completed elephant shows perfect structural continuity with smooth, seamless contours and a fully closed shape. It is semantically consistent, accurately representing an elephant with correct anatomy and texture. However, the object realism is scored 0 because the completed elephant appears as a cutout with no environmental context or natural lighting, making it look like a digital model rather than a plausible real-world instance."
      }
    },
    {
      id: 'm5',
      name: 'Example 5',
      original: 'static/images/o_m5.png',
      completed: 'static/images/metric5.png',
      caption: '',
      // TODO: set original -> 'static/images/o_m5.png'
      // TODO: set completed -> 'static/images/metric5.png'
      completeness: { 
        status: 'Complete', 
        explanation: 
          "The segmented skateboard includes the full deck, trucks, and all four wheels, matching the visible structure of the skateboard in the original image without any missing or truncated parts." 
      },
      consistency: { score: 8, explanation: '' },
      details: {
        score: 8,
          dimension_scores: {
            structural_continuity: 4,
            semantic_consistency: 4,
            object_realism: 0
          },
          explanation: "The skateboard's shape is structurally continuous and seamlessly closed, with smooth contours matching the visible parts. Semantically, it accurately represents a skateboard with correct features like grip tape, trucks, and wheels. However, the object realism is low because the skateboard is presented in isolation on a white background, lacking any contextual environment or physical grounding, making it appear unrealistically detached from reality."
      }
    },
    {
      id: 'm6',
      name: 'Example 6',
      original: 'static/images/o_m6.png',
      completed: 'static/images/metric6.png',
      caption: '',
      // TODO: set original -> 'static/images/o_m6.png'
      // TODO: set completed -> 'static/images/metric6.png'
      completeness: {
        status: 'Incomplete',
        explanation: "The segmented airplane is missing parts of the fuselage and wings, particularly around the mid-section and near the engines, indicating truncation and incomplete reconstruction compared to the full airplane visible in the original image."
      },
      consistency: { score: 7, explanation: '' },
      details: {
        score: 7,
          dimension_scores: {
            structural_continuity: 3,
            semantic_consistency: 3,
            object_realism: 1
          },
          explanation: "The completed airplane shows a mostly seamless continuation of the fuselage and tail, with smooth contours that align well with the visible parts, earning a high structural score. The semantic details like windows, livery, and engine placement are largely accurate, though minor distortions and warping are visible, especially near the mid-fuselage. The object is realistic overall, but the completion introduces slight artifacts and an unnatural 'cut' near the wing root, preventing a perfect realism score."
      }
    },
    {
      id: 'm7',
      name: 'Example 7',
      original: 'static/images/o_m7.png',
      completed: 'static/images/metric7.png',
      caption: '',
      // TODO: set original -> 'static/images/o_m7.png'
      // TODO: set completed -> 'static/images/metric7.png'
      completeness: { 
        status: 'Incomplete', 
        explanation: 
          "The segmented object shows only a partial, fragmented portion of the door, missing the top, bottom, and left side, and does not represent the full, intact door visible in the original image."
      },
      consistency: { score: 5, explanation: '' },
      details: {
          score: 5,
          dimension_scores: {
            structural_continuity: 2,
            semantic_consistency: 3,
            object_realism: 0
          },
          explanation: "The completed door shows a partial, jagged continuation with visible truncation and irregular edges, failing to form a closed, continuous shape (Structural Continuity: 2). The wood grain and general form are consistent with a door (Semantic Consistency: 3), but the object is not realistically completed—it appears as a fragmented, incomplete structure rather than a plausible real-world door (Object Realism: 0)."
        }
    },
    {
      id: 'm8',
      name: 'Example 8',
      original: 'static/images/o_m8.png',
      completed: 'static/images/metric8.png',
      caption: '',
      // TODO: set original -> 'static/images/o_m8.png'
      // TODO: set completed -> 'static/images/metric8.png'
      completeness: { 
        status: 'Complete', 
        explanation: 
          "The segmented object is a full, cylindrical concrete garbage bin with visible text 'Santa Monica' and a circular opening at the top, matching the garbage bin in the original image. It is not truncated or missing any essential parts, and its form is consistent with the object as it appears in the scene." 
      },
      consistency: { score: 8, explanation: '' },
      details: {
          score: 8,
          dimension_scores: {
            structural_continuity: 4,
            semantic_consistency: 4,
            object_realism: 0
          },
          explanation: "The completed garbage bin shows perfect structural continuity with smooth, closed contours and accurate alignment with the visible portion. It is semantically consistent, correctly representing a cylindrical concrete bin with the 'Santa Monica' text and a small emblem. However, it is not realistic as a standalone object because it is presented in isolation against a white background, lacking environmental context and shadows that would make it appear as a real-world object; thus, object realism is scored 0."
        }
    },
    {
      id: 'm9',
      name: 'Example 9',
      original: 'static/images/o_m9.png',
      completed: 'static/images/metric9.png',
      caption: '',
      // TODO: set original -> 'static/images/o_m9.png'
      // TODO: set completed -> 'static/images/metric9.png'
      completeness: { 
        status: 'Incomplete', 
        explanation: 
          "The segmented object is missing significant portions of the house, including the roof, top part of the structure, and parts of the sides, which are visible in the original image. The segmentation appears truncated and does not represent the full, complete form of the house."
      },
      consistency: { score: 3, explanation: '' },
      details: {
          score: 3,
          dimension_scores: {
            structural_continuity: 2,
            semantic_consistency: 2,
            object_realism: 1
          },
          explanation: "The completed house shows a reasonable attempt at structural continuity, with the visible parts of the brick facade, windows, and clock faces extended, but the edges remain jagged and disconnected, indicating incomplete closure. Semantic elements like the clock and windows are preserved, but the overall form is fragmented and lacks full realism due to the abrupt, non-continuous boundaries."
        }
    },
    {
      id: 'm10',
      name: 'Example 10',
      original: 'static/images/o_m10.png',
      completed: 'static/images/metric10.png',
      caption: '',
      // TODO: set original -> 'static/images/o_m10.png'
      // TODO: set completed -> 'static/images/metric10.png'
      completeness: { status: 'Complete', 
        explanation: 
          "The segmented object shows the entire phone, including the screen, keypad, and casing, matching the full form of the phone visible in the original image without any missing parts or truncation."
      },
      consistency: { score: 8, explanation: '' },
      details: {
          score: 8,
          dimension_scores: {
            structural_continuity: 4,
            semantic_consistency: 4,
            object_realism: 0
          },
          explanation: "The completed phone shows perfect structural continuity and semantic consistency with the original, accurately reconstructing the full shape and details of the Samsung phone. However, the object realism is scored 0 because the completed phone is isolated on a white background with no hand or context, making it appear as a cutout rather than a plausible real-world object in its natural setting."
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

    const cons = clampConsistency(ex.consistency?.score);
    consistencyScore.textContent = String(cons);
    consistencyExp.textContent = ex.consistency?.explanation || '';

    const completenessDetails = {
      object_status: comp,
      explanation: ex.completeness?.explanation || ''
    };
    const consistencyDetails = ex.details ?? {};

    details.textContent = JSON.stringify(
      {
        completeness: completenessDetails,
        consistency: consistencyDetails
      },
      null,
      2
    );
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
