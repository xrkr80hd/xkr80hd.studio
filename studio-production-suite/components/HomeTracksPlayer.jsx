'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

function randomIndex(length, exclude = -1) {
  if (length <= 1) {
    return 0;
  }

  let next = Math.floor(Math.random() * length);
  let guard = 0;
  while (next === exclude && guard < 12) {
    next = Math.floor(Math.random() * length);
    guard += 1;
  }
  return next;
}

function toFiniteTime(value) {
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function formatClock(value) {
  const total = Math.max(0, Math.floor(toFiniteTime(value)));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function HomeTracksPlayer({ tracks }) {
  const items = useMemo(() => tracks || [], [tracks]);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlayOnChange, setAutoPlayOnChange] = useState(false);
  const [loopMode, setLoopMode] = useState('off');
  const [volume, setVolume] = useState(82);
  const [transportState, setTransportState] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);
  const hasRandomizedOnLoadRef = useRef(false);
  const hasTracks = items.length > 0;
  const current = hasTracks ? items[index] || items[0] : null;
  const displayArtist = String(current?.artist_name || '').trim() || (hasTracks ? 'XRKR80HD' : 'SYSTEM');
  const displayTrack = String(current?.title || '').trim() || 'NO TRACKS UPLOADED';
  const trackNumber = String((hasTracks ? index : 0) + 1).padStart(2, '0');
  const totalTracks = String(hasTracks ? items.length : 0).padStart(2, '0');
  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  useEffect(() => {
    if (!items.length) {
      setIndex(0);
      setIsPlaying(false);
      setTransportState(null);
      hasRandomizedOnLoadRef.current = false;
      return;
    }

    if (!hasRandomizedOnLoadRef.current) {
      hasRandomizedOnLoadRef.current = true;
      setIndex(randomIndex(items.length));
      return;
    }

    setIndex((currentIndex) => {
      if (currentIndex >= 0 && currentIndex < items.length) {
        return currentIndex;
      }
      return randomIndex(items.length);
    });
  }, [items.length]);

  useEffect(() => {
    if (!autoPlayOnChange || !current?.audio_url) {
      return;
    }

    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const playResult = audio.play();
    if (playResult && typeof playResult.then === 'function') {
      playResult
        .then(() => {
          setIsPlaying(true);
          setTransportState('play');
        })
        .catch(() => {
          setIsPlaying(false);
        })
        .finally(() => {
          setAutoPlayOnChange(false);
        });
      return;
    }

    setIsPlaying(true);
    setTransportState('play');
    setAutoPlayOnChange(false);
  }, [autoPlayOnChange, current?.audio_url]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.volume = Math.min(1, Math.max(0, volume / 100));
  }, [volume, current?.audio_url]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.loop = loopMode === 'one';
  }, [loopMode, current?.audio_url]);

  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
  }, [current?.audio_url]);

  function setTrackIndex(nextIndex, { autoplay = false } = {}) {
    if (!hasTracks) {
      return;
    }

    setIndex((currentIndex) => {
      const safeCurrent = currentIndex >= 0 && currentIndex < items.length ? currentIndex : 0;
      const resolved = typeof nextIndex === 'function' ? nextIndex(safeCurrent) : nextIndex;
      if (!Number.isFinite(resolved)) {
        return safeCurrent;
      }
      if (resolved < 0) {
        return items.length - 1;
      }
      if (resolved >= items.length) {
        return 0;
      }
      return resolved;
    });

    setAutoPlayOnChange(autoplay);
  }

  async function playCurrent() {
    if (!current?.audio_url || !audioRef.current) {
      return;
    }

    try {
      await audioRef.current.play();
      setIsPlaying(true);
      setTransportState('play');
    } catch {
      setIsPlaying(false);
    }
  }

  function stopCurrent() {
    if (!audioRef.current) {
      return;
    }

    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
    setTransportState('stop');
  }

  function seekCurrent(deltaSeconds) {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const nextTime = Math.max(0, (audio.currentTime || 0) + deltaSeconds);
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      audio.currentTime = Math.min(audio.duration, nextTime);
      return;
    }

    audio.currentTime = nextTime;
  }

  function cycleLoopMode() {
    setLoopMode((currentMode) => {
      if (currentMode === 'off') {
        return 'one';
      }
      if (currentMode === 'one') {
        return 'all';
      }
      return 'off';
    });
  }

  function handleTrackEnded() {
    if (loopMode === 'one' || items.length <= 1) {
      return;
    }

    if (loopMode === 'all') {
      setTrackIndex((currentIndex) => currentIndex + 1, { autoplay: true });
      return;
    }

    setTrackIndex((currentIndex) => randomIndex(items.length, currentIndex), { autoplay: true });
  }

  const loopButtonLabel = loopMode === 'one' ? 'Loop one' : loopMode === 'all' ? 'Loop continuously' : 'Loop off';
  const loopButtonIcon = loopMode === 'one' ? '1' : loopMode === 'all' ? '\u221E' : '\u27F3';
  const loopButtonIconClass = loopMode === 'one' ? 'loop-icon-normal' : 'loop-icon-large';

  return (
    <div className="xrkr-radio-shell">
      <div className="xrkr-radio-skin">
        <img className="xrkr-radio-skin-image" src="/assets/player/xrkr-radio-skin-desktop-cropped.png" alt="XRKR Radio player skin" />
        <div className="xrkr-radio-display">
          <p className="xrkr-radio-status">PLAY DISC 01 TRK {trackNumber}/{totalTracks}</p>
          <p className="xrkr-radio-now">
            <span className="xrkr-radio-artist">{displayArtist}</span>
            <span className="xrkr-radio-sep"> - </span>
            <strong className="xrkr-radio-track" id="home-current-track">{displayTrack}</strong>
          </p>
          <div className="xrkr-radio-progress" aria-label={`Track progress ${formatClock(currentTime)} of ${formatClock(duration)}`}>
            <span className="xrkr-radio-progress-time">{formatClock(currentTime)}</span>
            <div className="xrkr-radio-progress-track" aria-hidden="true">
              <span className="xrkr-radio-progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
            <span className="xrkr-radio-progress-time">{formatClock(duration)}</span>
          </div>
          {current?.audio_url ? (
            <audio
              ref={audioRef}
              key={current.audio_url || current.id}
              id="home-main-player"
              className="xrkr-radio-controls"
              src={current.audio_url}
              onLoadedMetadata={() => setDuration(toFiniteTime(audioRef.current?.duration))}
              onDurationChange={() => setDuration(toFiniteTime(audioRef.current?.duration))}
              onTimeUpdate={() => setCurrentTime(toFiniteTime(audioRef.current?.currentTime))}
              onPlay={() => {
                setIsPlaying(true);
                setTransportState('play');
              }}
              onPause={() => setIsPlaying(false)}
              onEnded={handleTrackEnded}
            />
          ) : (
            <p className="xrkr-radio-controls-placeholder">Publish band tracks or podcast episodes in admin to activate XRKR Radio.</p>
          )}
        </div>
      </div>
      {hasTracks ? (
        <>
          <div className="xrkr-radio-icon-controls" role="group" aria-label="XRKR Radio controls">
            <button type="button" className="icon-control" aria-label="Back 10 seconds" onClick={() => seekCurrent(-10)}>
              {'<<'}
            </button>
            <button type="button" className="icon-control" aria-label="Previous track" onClick={() => setTrackIndex((currentIndex) => currentIndex - 1, { autoplay: true })}>
              {'<'}
            </button>
            <button
              type="button"
              className={`icon-control ${transportState === 'play' ? 'is-playing' : ''}`.trim()}
              aria-label="Play"
              onClick={playCurrent}
            >
              {'\u25B6'}
            </button>
            <button
              type="button"
              className={`icon-control ${transportState === 'stop' ? 'is-stopped' : ''}`.trim()}
              aria-label="Stop"
              onClick={stopCurrent}
            >
              {'\u25A0'}
            </button>
            <button type="button" className="icon-control" aria-label="Next track" onClick={() => setTrackIndex((currentIndex) => currentIndex + 1, { autoplay: true })}>
              {'>'}
            </button>
            <button type="button" className="icon-control" aria-label="Forward 10 seconds" onClick={() => seekCurrent(10)}>
              {'>>'}
            </button>
            <button
              type="button"
              className={`icon-control ${loopMode !== 'off' ? 'is-loop-mode' : ''}`.trim()}
              aria-label={loopButtonLabel}
              title={loopButtonLabel}
              onClick={cycleLoopMode}
            >
              <span className={loopButtonIconClass}>{loopButtonIcon}</span>
            </button>
          </div>
          <div className="digital-volume-wrap">
            <span className="digital-volume-label">VOL {String(volume).padStart(2, '0')}</span>
            <div className="digital-volume-meter" aria-hidden="true">
              <span className="digital-volume-fill" style={{ width: `${volume}%` }} />
            </div>
            <input
              type="range"
              className="digital-volume-input"
              min="0"
              max="100"
              step="1"
              value={volume}
              aria-label="Volume"
              onChange={(event) => {
                const next = Number.parseInt(event.target.value, 10);
                if (Number.isFinite(next)) {
                  setVolume(Math.min(100, Math.max(0, next)));
                }
              }}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
