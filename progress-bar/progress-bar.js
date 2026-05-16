/*!
 * createProgressBar(container, options) → controls
 *
 * @param {HTMLElement} container   - Any element; bar fills its full width × height
 * @param {string}  options.endpoint        - URL that returns { progress: 0–100 } or a bare number
 * @param {number}  [options.interval=1000] - Polling interval in ms
 * @param {string}  [options.color='#4f46e5'] - Fill colour (any valid CSS colour)
 *
 * @returns {{ stop, resume, destroy, setProgress }}
 */
(function (global, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    define(factory);
  } else {
    global.createProgressBar = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {

  function createProgressBar(container, options = {}) {
    const {
      endpoint,
      interval = 1000,
      color = '#4f46e5',
    } = options;

    if (!container || !(container instanceof Element)) {
      throw new TypeError('[ProgressBar] container must be a DOM Element');
    }
    if (!endpoint || typeof endpoint !== 'string') {
      throw new TypeError('[ProgressBar] endpoint must be a non-empty string');
    }

    // ── DOM ──────────────────────────────────────────────────────────────────

    const track = document.createElement('div');
    track.className = 'pb-track';

    const fill = document.createElement('div');
    fill.className = 'pb-fill';
    fill.style.setProperty('--pb-color', color);

    const label = document.createElement('span');
    label.className = 'pb-label';
    label.setAttribute('aria-live', 'polite');
    label.setAttribute('role', 'status');

    track.appendChild(fill);
    track.appendChild(label);
    container.appendChild(track);

    // Keep the container positioned so our absolute children work
    const containerStyle = getComputedStyle(container);
    if (containerStyle.position === 'static') {
      container.style.position = 'relative';
    }

    // ── State ─────────────────────────────────────────────────────────────────

    let timerId   = null;
    let progress  = 0;
    let destroyed = false;

    // ── Core ──────────────────────────────────────────────────────────────────

    function setProgress(value) {
      progress = Math.min(100, Math.max(0, Number(value) || 0));
      fill.style.width = `${progress}%`;
      label.textContent = `${Math.round(progress)}%`;
      label.setAttribute('aria-label', `Progress: ${Math.round(progress)} percent`);
      track.classList.toggle('pb-complete', progress >= 100);

      if (progress >= 100) {
        _stop();
      }
    }

    async function _poll() {
      try {
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        // Accept: bare number | { progress } | { value } | { percent }
        const raw =
          typeof data === 'number'
            ? data
            : data.progress ?? data.value ?? data.percent ?? 0;

        track.classList.remove('pb-error');
        setProgress(raw);
      } catch (err) {
        track.classList.add('pb-error');
        console.error('[ProgressBar] poll error:', err);
      }
    }

    function _stop() {
      clearInterval(timerId);
      timerId = null;
    }

    // ── Public API ────────────────────────────────────────────────────────────

    function stop() {
      _stop();
    }

    function resume() {
      if (destroyed || timerId !== null || progress >= 100) return;
      _poll();
      timerId = setInterval(_poll, interval);
    }

    function destroy() {
      if (destroyed) return;
      _stop();
      container.removeChild(track);
      destroyed = true;
    }

    // Kick off immediately
    resume();

    return { stop, resume, destroy, setProgress };
  }

  return createProgressBar;
});
