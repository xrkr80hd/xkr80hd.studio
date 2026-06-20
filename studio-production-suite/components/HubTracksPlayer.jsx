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

export default function HubTracksPlayer({ tracks }) {
  const items = useMemo(() => tracks || [], [tracks]);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlayOnChange, setAutoPlayOnChange] = useState(false);
  const [loopMode, setLoopMode] = useState('off');
  const [volume, setVolume] = useState(82);
  const [transportState, setTransportState] = useState(null);
  const audioRef = useRef(null);
  const hasRandomizedOnLoadRef = useRef(false);
  const hasTracks = items.length > 0;
  const activeTrack = hasTracks ? items[index] || items[0] : null;
  const trackNumber = String((hasTracks ? index : 0) + 1).padStart(2, '0');
  const totalTracks = String(hasTracks ? items.length : 0).padStart(2, '0');

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
    if (!autoPlayOnChange || !activeTrack?.audio_url) {
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
  }, [autoPlayOnChange, activeTrack?.audio_url]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.volume = Math.min(1, Math.max(0, volume / 100));
  }, [volume, activeTrack?.audio_url]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.loop = loopMode === 'one';
  }, [loopMode, activeTrack?.audio_url]);

  if (!hasTracks) {
    return <p className="meta">No tracks yet.</p>;
  }

  function setTrackIndex(nextIndex, { autoplay = false } = {}) {
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
    if (!activeTrack?.audio_url || !audioRef.current) {
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
    <>
      <div className="hub-player-layout">
        <div className="hub-now-playing-shell">
          <div className={`hub-now-playing-cover ${isPlaying ? 'is-playing' : ''}`.trim()}>
            {activeTrack?.cover_image_url ? (
              <img src={activeTrack.cover_image_url} alt={`${activeTrack?.title || 'Track'} cover art`} />
            ) : (
              <div className="hub-now-playing-fallback" aria-hidden="true">
                <strong>XRKR</strong>
                <span>NO COVER ART</span>
              </div>
            )}
            <span className="hub-now-playing-badge">{isPlaying ? 'Now Playing' : 'Track Ready'}</span>
          </div>
        </div>
        <div className="hub-player-controls-pane">
          <p className="hub-now-playing">
            <strong id="hub-current-track">{activeTrack?.title || 'No track loaded'}</strong>{' '}
            <span className="meta">{activeTrack?.artist_name}</span>
            <span className="meta">{`  TRK ${trackNumber}/${totalTracks}`}</span>
          </p>
          <audio
            ref={audioRef}
            key={activeTrack?.audio_url || activeTrack?.id}
            id="hub-main-player"
            className="hub-main-player"
            src={activeTrack?.audio_url || ''}
            onPlay={() => {
              setIsPlaying(true);
              setTransportState('play');
            }}
            onPause={() => setIsPlaying(false)}
            onEnded={handleTrackEnded}
          />
          <div className="hub-icon-controls" role="group" aria-label="Hub track controls">
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
        </div>
      </div>
    </>
  );
}
