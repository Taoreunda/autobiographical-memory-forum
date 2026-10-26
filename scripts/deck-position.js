// Presentation navigation only; keep this outside the seekable composition.
const deck = document.querySelector('hyperframes-slideshow');
let controller;
let unsubscribe;
let restoring = false;

function boundedNumber(raw, maximum) {
  const value = /^\d+$/.test(raw ?? '') ? Number(raw) : 1;
  return Math.max(1, Math.min(value, maximum));
}

function readPosition() {
  const params = new URLSearchParams(location.hash.slice(1));
  const requestedSequence = params.get('sequence') || 'main';
  const sequenceId = controller.slidesOf(requestedSequence).length
    ? requestedSequence
    : 'main';
  const slides = controller.slidesOf(sequenceId);
  const slideIndex = boundedNumber(params.get('slide'), slides.length) - 1;
  const fragments = slides[slideIndex].fragments;
  const fragmentIndex = fragments.length
    ? boundedNumber(params.get('step'), fragments.length) - 1
    : -1;
  return { sequenceId, slideIndex, fragmentIndex };
}

function writePosition(replace = false) {
  const { sequenceId, slideIndex, fragmentIndex } = controller.position;
  const url = new URL(location.href);
  const params = new URLSearchParams();
  if (sequenceId !== 'main') params.set('sequence', sequenceId);
  params.set('slide', slideIndex + 1);
  params.set('step', Math.max(1, fragmentIndex + 1));
  url.hash = params.toString();
  if (url.href !== location.href) {
    history[replace ? 'replaceState' : 'pushState'](history.state, '', url);
  }
}

function restorePosition() {
  if (!controller) return;
  const target = readPosition();
  const current = controller.position;
  if (Object.keys(target).some((key) => target[key] !== current[key])) {
    restoring = true;
    // Restore directly to the saved hold, without replaying earlier fragments.
    // Diagram slides animate; the conclusion replays its one-shot transformation.
    controller.restoreFromUrl = ![
      'cover',
      'integration',
      'conclusion',
    ].includes(
      controller.slidesOf(target.sequenceId)[target.slideIndex].sceneId,
    );
    try {
      controller.syncTo(
        target.sequenceId,
        target.slideIndex,
        target.fragmentIndex,
      );
    } finally {
      controller.restoreFromUrl = false;
      restoring = false;
    }
  }
  writePosition(true);
}

function connect() {
  if (!deck.controller || deck.controller === controller) return;
  unsubscribe?.();
  controller = deck.controller;
  restorePosition();
  unsubscribe = controller.onChange(() => {
    if (!restoring) writePosition();
  });
}

deck.addEventListener('hf-controller-ready', connect);
window.addEventListener('popstate', restorePosition);
window.addEventListener('hashchange', restorePosition);
connect();
