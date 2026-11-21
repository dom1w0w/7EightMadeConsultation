/* 7EightMade Studio intro cinematic — play once per session (78-studio-intro-seen).
   Same behavior as the consultation homepage intro: video first, CSS cinematic
   as fallback, Skip button, iris wipe out. */
(function () {
  var intro = document.getElementById('intro');
  var skipBtn = document.getElementById('introSkip');
  if (!intro) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var seen = false;
  try { seen = sessionStorage.getItem('78-studio-intro-seen') === '1'; } catch (e) {}

  var finished = false;
  function finishIntro() {
    if (finished) return;
    finished = true;
    document.body.classList.remove('intro-active');
    intro.classList.remove('is-playing', 'is-wiping');
    intro.classList.add('is-done');
    intro.setAttribute('aria-hidden', 'true');
    intro.setAttribute('hidden', '');
    intro.setAttribute('inert', '');
    try { sessionStorage.setItem('78-studio-intro-seen', '1'); } catch (e) {}
  }

  function startWipe() {
    if (finished || intro.classList.contains('is-wiping')) return;
    intro.classList.add('is-wiping');
    var onEnd = function (e) {
      if (e.target !== intro) return;
      intro.removeEventListener('animationend', onEnd);
      finishIntro();
    };
    intro.addEventListener('animationend', onEnd);
    setTimeout(finishIntro, 800);
  }

  function playIntro() {
    intro.removeAttribute('hidden');
    intro.removeAttribute('aria-hidden');
    document.body.classList.add('intro-active');
    void intro.offsetWidth;
    intro.classList.add('is-playing');

    var vid = document.getElementById('introVideo');
    var wipeTimer = null;
    var hardTimer = setTimeout(finishIntro, 9000);
    var videoMode = false;
    var fellBack = false;

    function armCssIntro() {
      /* Video unavailable — run the CSS cinematic fallback */
      if (fellBack) return;
      fellBack = true;
      intro.classList.remove('has-video');
      clearTimeout(hardTimer);
      wipeTimer = setTimeout(startWipe, 1400);
      hardTimer = setTimeout(finishIntro, 2200);
    }

    if (vid && vid.dataset.src) {
      var loadWatchdog = setTimeout(armCssIntro, 2800);
      vid.addEventListener('canplay', function () {
        clearTimeout(loadWatchdog);
        if (fellBack) return;
        videoMode = true;
        intro.classList.add('has-video');
        clearTimeout(hardTimer);
        hardTimer = setTimeout(finishIntro, 8000);
        var p = vid.play();
        if (p && p.catch) p.catch(armCssIntro);
      }, { once: true });
      vid.addEventListener('ended', function () {
        clearTimeout(hardTimer);
        hardTimer = setTimeout(finishIntro, 1600);
        startWipe();
      });
      vid.addEventListener('error', armCssIntro);
      vid.src = vid.dataset.src;
      vid.load();
    } else {
      armCssIntro();
    }

    function skip() {
      clearTimeout(wipeTimer);
      clearTimeout(hardTimer);
      if (vid && videoMode) { try { vid.pause(); } catch (e) {} }
      hardTimer = setTimeout(finishIntro, 1600);
      startWipe();
    }
    skipBtn.addEventListener('click', skip, { once: true });
  }

  if (reduce || seen) {
    finishIntro();
  } else {
    playIntro();
  }
})();
