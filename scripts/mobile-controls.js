// Reuse the existing controller for touch navigation, including inside its iframe.
// Native pinch zoom/panning must never be interpreted as a slide change.
const deck = document.querySelector('hyperframes-slideshow');
const mobile = matchMedia('(max-width: 1024px)');
let frame;
let detachFrame;

export function createSwipeHandlers(navigate, enabled, scale) {
  let start;
  let blocked = false;
  return {
    start(event) {
      if (!enabled()) return;
      if (event.touches.length !== 1 || scale() > 1.01) {
        blocked = true;
        start = undefined;
        return;
      }
      blocked = false;
      const touch = event.touches[0];
      start = { x: touch.screenX, y: touch.screenY };
    },
    end(event) {
      if (!enabled() || blocked || !start || event.touches.length || scale() > 1.01) return;
      const touch = event.changedTouches[0];
      if (!touch) return;
      const dx = touch.screenX - start.x;
      const dy = touch.screenY - start.y;
      start = undefined;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) navigate(dx < 0 ? 'next' : 'prev');
    },
    cancel() { start = undefined; blocked = true; },
  };
}

const swipe = createSwipeHandlers(
  direction => deck.controller?.[direction](),
  () => mobile.matches,
  () => window.visualViewport?.scale ?? 1,
);
function listen(target) {
  target.addEventListener('touchstart', swipe.start, { passive: true });
  target.addEventListener('touchend', swipe.end, { passive: true });
  target.addEventListener('touchcancel', swipe.cancel, { passive: true });
  return () => {
    target.removeEventListener('touchstart', swipe.start);
    target.removeEventListener('touchend', swipe.end);
    target.removeEventListener('touchcancel', swipe.cancel);
  };
}
function connect() {
  // Replace only the host touch listeners; buttons and keyboard remain native.
  deck.removeEventListener('touchstart', deck.onTouchStart);
  deck.removeEventListener('touchend', deck.onTouchEnd);
  const nextFrame = deck.querySelector('hyperframes-player')?.iframeElement;
  if (!nextFrame || nextFrame === frame) return;
  detachFrame?.();
  frame = nextFrame;
  const attach = () => {
    detachFrame?.();
    if (frame.contentDocument) detachFrame = listen(frame.contentDocument);
  };
  frame.addEventListener('load', attach);
  attach();
}
listen(deck);
deck.addEventListener('hf-controller-ready', connect);
connect();
