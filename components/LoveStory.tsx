'use client';

import { useEffect } from 'react';
import initAlbum from '../lib/album';
import { api } from '../lib/api';

export default function LoveStory() {
  useEffect(() => initAlbum(api), []);

  return (
    <>
      <div id="bg" aria-hidden="true" />
      <div id="gate">
        <section className="v-welcome" aria-label="Welcome">
          <button className="env" id="env" type="button" aria-label="Open the envelope">
            <svg className="bk" viewBox="0 0 420 280" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient id="eb" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#a73b5b" />
                  <stop offset="1" stopColor="#7a1f3d" />
                </linearGradient>
              </defs>
              <rect width="420" height="280" rx="6" fill="url(#eb)" />
            </svg>
            <span className="cd"><i>♥</i><b>For you,</b><em>Our Love Story</em><small>Open with love</small></span>
            <svg className="fr" viewBox="0 0 420 280" preserveAspectRatio="none" aria-hidden="true">
              <g stroke="#d596a6" strokeWidth="1" strokeLinejoin="round">
                <polygon points="0,0 210,150 0,280" fill="#f2c6d0" />
                <polygon points="420,0 210,150 420,280" fill="#ecbac6" />
                <polygon points="0,280 210,128 420,280" fill="#f8dbe2" />
              </g>
            </svg>
            <svg className="fp" viewBox="0 0 420 170" preserveAspectRatio="none" aria-hidden="true">
              <polygon points="0,0 420,0 210,170" fill="#f6d3da" stroke="#d596a6" strokeWidth="1" strokeLinejoin="round" />
            </svg>
            <span className="sl">♥</span>
          </button>
          <h1 className="g-title">A letter for you</h1>
          <p className="g-sub">Tap the envelope to open</p>
        </section>
        <section className="v-login" aria-label="Sign in">
          <form className="lcard" id="login" autoComplete="off" noValidate>
            <h2>Open our album</h2>
            <div className="k">Sign in to continue</div>
            <label>Your name<input name="nm" type="text" maxLength={30} placeholder="What should I call you?" /></label>
            <label>Secret word<input name="pw" type="password" autoComplete="off" placeholder="The word we share" /></label>
            <p className="lhint">Hint: it’s written on the cover.</p>
            <p className="lerr" id="lerr" role="alert" />
            <button className="btn solid" type="submit">Open the album</button>
            <button className="lback" id="lback" type="button">← Back to the envelope</button>
          </form>
        </section>
      </div>
      <p className="sync" id="sync" role="status" aria-live="polite" />
      <main style={{ display: 'contents' }}>
        <section className="stage" id="stage" aria-label="Photo album">
          <div className="frame" id="frame">
            <div className="book" id="book" role="group" aria-roledescription="album" aria-label="Love story photo album" />
          </div>
        </section>
        <footer className="bar">
          <div className="nav">
            <button className="btn solid" id="prev" type="button" aria-label="Previous page">← Prev</button>
            <div className="label" id="label" aria-live="polite">Cover</div>
            <button className="btn solid" id="next" type="button" aria-label="Next page">Next →</button>
          </div>
          <div className="tools">
            <button className="btn" id="edit" type="button" aria-pressed="false">Edit text</button>
            <button className="btn" id="swap" type="button" aria-pressed="false">Swap photos</button>
            <button className="btn" id="fill" type="button">Add photos</button>
            <select className="btn" id="tpl" aria-label="Page layout" />
            <button className="btn" id="add" type="button">+ Add page</button>
            <button className="btn" id="del" type="button">Remove page</button>
            <button className="btn" id="sound" type="button" aria-pressed="false">Sound off</button>
            <button className="btn" id="lock" type="button">Lock album</button>
          </div>
          <p className="hint" id="hint">Drag, swipe or tap a page to turn it. Arrow keys work too.</p>
        </footer>
        <input type="file" id="file" accept="image/*" hidden />
        <input type="file" id="files" accept="image/*" multiple hidden />
      </main>
      <dialog className="crop" id="crop" aria-labelledby="cr-title">
        <h2 id="cr-title">Crop your photo</h2>
        <p className="cr-count" />
        <div className="cr-view" tabIndex={0} role="group" aria-label="Crop area. Drag to move, use plus and minus to zoom.">
          <img className="cr-img" alt="" />
        </div>
        <label className="cr-zr">Zoom<input className="cr-zoom" type="range" min="1" max="4" step="0.01" defaultValue="1" /></label>
        <p className="cr-hint">Drag to move. Scroll, pinch or use the slider to zoom.</p>
        <div className="cr-btns">
          <button className="btn cr-cancel" type="button">Cancel</button>
          <button className="btn cr-skip" type="button" hidden>Skip photo</button>
          <button className="btn solid cr-ok" type="button">Use photo</button>
        </div>
      </dialog>
    </>
  );
}
