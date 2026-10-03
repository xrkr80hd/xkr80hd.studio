'use client';
import { useRef, useState } from 'react';
import styles from '../app/lets-gleaux/gleaux.module.css';
function time(value) { const s = Math.floor(Number.isFinite(value) ? value : 0); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }
function Icon({ type }) {
  const paths = { play: <path d="m8 5 11 7-11 7Z" />, pause: <><path d="M7 5h3v14H7zM14 5h3v14h-3z" /></>, download: <><path d="M12 3v12m-5-5 5 5 5-5M5 16v5h14v-5" /></>, volume: <><path d="m11 4-6 5H2v6h3l6 5ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /></> };
  return <svg viewBox="0 0 24 24" width="22" height="22" fill={type === 'play' || type === 'pause' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" aria-hidden="true">{paths[type]}</svg>;
}
export default function GleauxExperience({ title, description, hasPlayer, hasDownload, initialCount, unavailable }) {
  const audio = useRef(null), busyRef = useRef(false), downloadId = useRef(null);
  const [playing, setPlaying] = useState(false), [loading, setLoading] = useState(false), [current, setCurrent] = useState(0), [duration, setDuration] = useState(0), [volume, setVolume] = useState(0.8), [busy, setBusy] = useState(false), [count, setCount] = useState(initialCount), [status, setStatus] = useState('');
  async function toggle() {
    if (!audio.current || loading) return;
    if (playing) { audio.current.pause(); return; }
    setLoading(true); setStatus('');
    try {
      if (!audio.current.src || audio.current.error) {
        const response = await fetch('/api/gleaux/stream', { cache: 'no-store' });
        const body = await response.json(); if (!response.ok) throw new Error(body.error);
        audio.current.src = body.url; audio.current.volume = volume;
      }
      await audio.current.play();
    } catch (error) { setStatus(error.message || 'Playback could not start. Tap play to try again.'); }
    finally { setLoading(false); }
  }
  async function download() {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setStatus('Preparing your download…');
    try {
      downloadId.current ||= crypto.randomUUID();
      const response = await fetch('/api/gleaux/download', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ request_id: downloadId.current }) });
      const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Download failed.');
      setCount(body.count);
      const link = document.createElement('a'); link.href = body.url; link.download = 'Lets-Gleaux'; document.body.appendChild(link); link.click(); link.remove();
      downloadId.current = null;
      setStatus('Your download is starting. Thanks for standing with the girls.');
    } catch (error) { setStatus(error.message || 'Download failed. Please try again.'); }
    finally { setBusy(false); busyRef.current = false; }
  }
  return <div className={styles.page}>
    <div className={styles.eyebrow}><span className={styles.dot} /> MUSIC WITH A PURPOSE <span className={styles.issue}>XRKR.80HD / GLEAUX FOR THE GIRLS</span></div>
    <section className={styles.hero} aria-labelledby="gleaux-title">
      <div className={styles.heroCopy}>
        <p className={styles.kicker}>TURN IT UP. STAND TOGETHER.</p>
        <h1 id="gleaux-title">LET’S <span>GLEAUX.</span></h1>
        <p className={styles.intro}>{description}</p>
      </div>
    </section>
    <section className={styles.playerSection} aria-label="Gleaux music player">
      <div className={styles.sectionLabel}><span>01 / THE ANTHEM</span><span>PRESS PLAY. FEEL THE GLEAUX.</span></div>
      <div className={styles.skin}>
        <img src="/assets/gleaux/player-skin.png" alt="xrkr.80hd’s Gleaux player — pink, white and chrome" width="1536" height="512" />
        {playing && <div className={styles.radioDisplay}>
          <p className={styles.radioStatus}>PLAY DISC 01 · TRK 01/01</p>
          <p className={styles.radioNow}><span>XRKR.80HD</span> — <strong>{title}</strong></p>
          <p className={styles.radioClock}>{time(current)} / {time(duration)}</p>
        </div>}
      </div>
      <audio ref={audio} preload="none" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onTimeUpdate={() => setCurrent(audio.current.currentTime)} onLoadedMetadata={() => setDuration(audio.current.duration)} onDurationChange={() => setDuration(audio.current.duration)} onError={() => { setPlaying(false); setStatus('Audio could not load. Please try play again.'); }} />
          <div className={styles.radioProgress}>
            <span>{time(current)}</span>
            <input aria-label="Track position" type="range" min="0" max={Number.isFinite(duration) ? duration : 0} step="0.1" value={Math.min(current, Number.isFinite(duration) ? duration : 0)} disabled={!duration} style={{ '--progress': `${duration > 0 ? Math.min(100, current / duration * 100) : 0}%` }} onChange={event => { audio.current.currentTime = Number(event.target.value); setCurrent(Number(event.target.value)); }} />
            <span>{time(duration)}</span>
          </div>
      <div className={styles.controls}>
        <button className={styles.play} type="button" onClick={toggle} disabled={!hasPlayer || loading} aria-label={playing ? 'Pause Lets Gleaux' : 'Play Lets Gleaux'}><Icon type={playing ? 'pause' : 'play'} /></button>
        <button className={styles.stop} type="button" disabled={!hasPlayer} aria-label="Stop Lets Gleaux" onClick={() => { audio.current.pause(); audio.current.currentTime = 0; setCurrent(0); setPlaying(false); }}>■</button>
        <label className={styles.volume}><Icon type="volume" /><input aria-label="Volume" type="range" min="0" max="1" step="0.01" value={volume} onChange={event => { setVolume(Number(event.target.value)); audio.current.volume = Number(event.target.value); }} /></label>
      </div>
      {!hasPlayer && <p className={styles.coming}>{unavailable ? 'The player is temporarily unavailable. Please check back shortly.' : 'The anthem is on its way. Check back soon to listen.'}</p>}
    </section>
    <section className={styles.downloadArtwork} aria-label="Download Lets Gleaux">
      <div className={styles.downloadScene}>
        <img className={styles.downloadHero} src="/assets/gleaux/download-hero.jpg" alt="Download Let’s Gleaux — the track inspired by the Gleaux for the Girls event, presented by Christus Cabrini and Walker Toyota" width="1536" height="513" />
        <button className={styles.artDownloadButton} type="button" onClick={download} disabled={!hasDownload || busy} aria-label={busy ? 'Preparing download' : 'Download Lets Gleaux for free'} aria-describedby="gleaux-download-info">
          <img src="/assets/gleaux/download-button.png" alt="" width="1536" height="1536" />
        </button>
      </div>
      <p id="gleaux-download-info" className={styles.downloadInfo}>{busy ? 'Preparing your download…' : hasDownload ? 'FREE DOWNLOAD · YOURS TO KEEP' : 'Download coming soon'}{count !== null && <> · {count.toLocaleString()} downloads</>}</p>
    </section>
    <p className={styles.status} role="status" aria-live="polite">{status}</p>
    <a className={styles.automotiveCard} href="https://nextdocs.xrkr80hd.studio/card/trav" target="_blank" rel="noopener noreferrer" aria-label="Visit Trav’s digital business card for all your automotive needs (opens in a new tab)">
      <div className={styles.automotiveImagePanel}><img className={styles.automotiveArt} src="/assets/gleaux/call-trav.jpg" alt="CALL TRAV — Walker Automotive. 318-787-7887. Access to the full Walker inventory." width="1366" height="1536" loading="lazy" /></div>
      <div className={styles.automotiveCopy}>
        <span className={styles.automotiveEyebrow}>YOUR NEXT RIDE STARTS HERE</span>
        <h2>Ready for your next vehicle?<br /><em>CALL TRAV.</em></h2>
        <p>Check out Trav’s digital business card for all your automotive needs.</p>
        <p className={styles.automotivePitch}>Access to the full Walker inventory. If this one’s not it, I’ll find your perfect fit.</p>
        <span className={styles.automotiveCta}>Visit Trav’s digital business card <span aria-hidden="true">↗</span></span>
      </div>
    </a>
    <footer className={styles.footer}><span>FOR THE MAMAS. THE SISTERS. THE DAUGHTERS.</span><span>STAND STRONG. LET’S GLEAUX.</span></footer>
  </div>;
}
