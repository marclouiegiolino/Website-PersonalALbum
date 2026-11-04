/* eslint-disable */
/* Crop dialog: drag to move, wheel / pinch / slider / +- keys to zoom, inside a frame with the photo slot's aspect ratio.
   crop(file, aspect, {label, skip}) resolves {file, src, pos} (cropped JPEG), {skipped:true}, {error:true}, or null (cancelled). */
export function createCropper(dlg) {
  var $ = function (s) { return dlg.querySelector(s); };
  var view = $('.cr-view'), img = $('.cr-img'), zoom = $('.cr-zoom'), count = $('.cr-count');
  var okB = $('.cr-ok'), cancelB = $('.cr-cancel'), skipB = $('.cr-skip');
  var off = [], st = null, done = null, ptrs = new Map(), pinch = 0;
  function on(t, e, f, o) { t.addEventListener(e, f, o); off.push(function () { t.removeEventListener(e, f, o); }); }

  function size() {
    var aw = Math.min(innerWidth - 64, 440), ah = Math.max(140, Math.min(innerHeight - 280, 420));
    var w = aw, h = aw / st.aspect;
    if (h > ah) { h = ah; w = ah * st.aspect; }
    st.vw = Math.round(w); st.vh = Math.round(h);
    view.style.width = st.vw + 'px'; view.style.height = st.vh + 'px';
  }
  function paint() {
    var s = st.min * st.z;
    st.tx = Math.min(0, Math.max(st.vw - st.nw * s, st.tx));
    st.ty = Math.min(0, Math.max(st.vh - st.nh * s, st.ty));
    img.style.width = st.nw * s + 'px'; img.style.height = st.nh * s + 'px';
    img.style.transform = 'translate(' + st.tx + 'px,' + st.ty + 'px)';
  }
  function zoomAt(z, cx, cy) {
    z = Math.max(1, Math.min(4, z));
    var s0 = st.min * st.z, s1 = st.min * z;
    st.tx = cx - (cx - st.tx) * s1 / s0; st.ty = cy - (cy - st.ty) * s1 / s0;
    st.z = z; zoom.value = z; paint();
  }
  function load(file) {
    return new Promise(function (ok) {
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () { if (im.naturalWidth && im.naturalHeight) ok({ url: url, im: im }); else { URL.revokeObjectURL(url); ok(null); } };
      im.onerror = function () { URL.revokeObjectURL(url); ok(null); };
      im.src = url;
    });
  }
  function render() {
    var s = st.min * st.z, sw = st.vw / s, sh = st.vh / s;
    var sx = Math.max(0, Math.min(st.nw - sw, -st.tx / s)), sy = Math.max(0, Math.min(st.nh - sh, -st.ty / s));
    var ow = Math.max(1, Math.round(Math.min(sw, 1600))), oh = Math.max(1, Math.round(ow / st.aspect));
    var c = document.createElement('canvas'); c.width = ow; c.height = oh;
    var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, ow, oh); g.imageSmoothingQuality = 'high';
    g.drawImage(st.im, sx, sy, sw, sh, 0, 0, ow, oh);
    return new Promise(function (ok) { c.toBlob(function (b) { ok(b); }, 'image/jpeg', 0.9); });
  }

  function crop(file, aspect, o) {
    o = o || {};
    return load(file).then(function (r) {
      if (!r) return { error: true };
      return new Promise(function (resolve) {
        st = { im: r.im, nw: r.im.naturalWidth, nh: r.im.naturalHeight, aspect: aspect || 1, z: 1, name: file.name };
        count.textContent = o.label || '';
        skipB.hidden = !o.skip;
        size();
        st.min = Math.max(st.vw / st.nw, st.vh / st.nh);
        st.tx = (st.vw - st.nw * st.min) / 2;
        st.ty = (st.vh - st.nh * st.min) * (st.nh > st.nw * 1.1 ? 0.3 : 0.5); /* portraits start toward the top so faces stay in frame */
        zoom.value = 1; img.src = r.url; paint();
        done = function (res) {
          done = null; ptrs.clear(); pinch = 0;
          if (dlg.open) dlg.close();
          img.removeAttribute('src'); URL.revokeObjectURL(r.url); st = null;
          resolve(res);
        };
        if (!dlg.open) dlg.showModal();
        view.focus();
      });
    });
  }

  on(view, 'pointerdown', function (e) {
    try { view.setPointerCapture(e.pointerId); } catch (_) {}
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); pinch = 0;
  });
  on(view, 'pointermove', function (e) {
    var p = ptrs.get(e.pointerId); if (!p || !st) return;
    if (ptrs.size === 1) { st.tx += e.clientX - p.x; st.ty += e.clientY - p.y; p.x = e.clientX; p.y = e.clientY; paint(); }
    else if (ptrs.size === 2) {
      p.x = e.clientX; p.y = e.clientY;
      var a = Array.from(ptrs.values()), d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
      if (pinch) { var r = view.getBoundingClientRect(); zoomAt(st.z * d / pinch, (a[0].x + a[1].x) / 2 - r.left, (a[0].y + a[1].y) / 2 - r.top); }
      pinch = d;
    }
  });
  function up(e) { ptrs.delete(e.pointerId); pinch = 0; }
  on(view, 'pointerup', up); on(view, 'pointercancel', up);
  on(view, 'wheel', function (e) {
    if (!st) return; e.preventDefault();
    var r = view.getBoundingClientRect();
    zoomAt(st.z * Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
  }, { passive: false });
  on(zoom, 'input', function () { if (st) zoomAt(parseFloat(zoom.value), st.vw / 2, st.vh / 2); });
  on(view, 'keydown', function (e) {
    if (!st) return;
    var k = e.key, h = true;
    if (k === 'ArrowLeft') st.tx += 12; else if (k === 'ArrowRight') st.tx -= 12;
    else if (k === 'ArrowUp') st.ty += 12; else if (k === 'ArrowDown') st.ty -= 12;
    else if (k === '+' || k === '=') zoomAt(st.z * 1.1, st.vw / 2, st.vh / 2);
    else if (k === '-') zoomAt(st.z / 1.1, st.vw / 2, st.vh / 2);
    else h = false;
    if (h) { e.preventDefault(); paint(); }
  });
  /* keep arrow keys from turning album pages behind the dialog */
  on(dlg, 'keydown', function (e) { e.stopPropagation(); });
  on(dlg, 'cancel', function (e) { e.preventDefault(); if (done) done(null); });
  on(cancelB, 'click', function () { if (done) done(null); });
  on(skipB, 'click', function () { if (done) done({ skipped: true }); });
  on(okB, 'click', function () {
    if (!st || !done) return;
    var name = (st.name || 'photo').replace(/\.[^.]+$/, '') + '.jpg';
    okB.disabled = true;
    render().then(function (b) {
      okB.disabled = false;
      if (!done) return;
      if (!b) return done(null);
      done({ file: new File([b], name, { type: 'image/jpeg' }), src: URL.createObjectURL(b), pos: '50% 50%' });
    });
  });
  on(window, 'resize', function () {
    if (!st) return;
    var w0 = st.vw; size();
    var k = st.vw / w0; st.min = Math.max(st.vw / st.nw, st.vh / st.nh); st.tx *= k; st.ty *= k; paint();
  });

  return { crop: crop, dispose: function () { if (done) done(null); off.forEach(function (f) { f(); }); off = []; } };
}
