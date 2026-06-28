'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  clampCropOffsets,
  getCoverScale,
  getSquareCropGeometry,
} from '../lib/square-image-crop.mjs';

const VIEWPORT_SIZE = 360;
const OUTPUT_SIZE = 1000;

export default function BlogAvatarCropper({ file, onCancel, onCrop, busy = false }) {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const dragRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offsets, setOffsets] = useState({ offsetX: 0, offsetY: 0 });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!file) return undefined;

    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      imageRef.current = image;
      setZoom(1);
      setOffsets({ offsetX: 0, offsetY: 0 });
      setReady(true);
    };
    image.src = objectUrl;

    return () => {
      URL.revokeObjectURL(objectUrl);
      imageRef.current = null;
      setReady(false);
    };
  }, [file]);

  useEffect(() => {
    if (!file) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !busy && !processing) onCancel();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [busy, file, onCancel, processing]);

  useEffect(() => {
    const image = imageRef.current;
    const canvas = canvasRef.current;
    if (!ready || !image || !canvas) return;

    const geometry = getSquareCropGeometry({
      imageWidth: image.naturalWidth,
      imageHeight: image.naturalHeight,
      viewportSize: VIEWPORT_SIZE,
      zoom,
      ...offsets,
      outputSize: VIEWPORT_SIZE,
    });
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, VIEWPORT_SIZE, VIEWPORT_SIZE);
    context.drawImage(
      image,
      geometry.sourceX,
      geometry.sourceY,
      geometry.sourceSize,
      geometry.sourceSize,
      0,
      0,
      VIEWPORT_SIZE,
      VIEWPORT_SIZE
    );
  }, [offsets, ready, zoom]);

  if (!mounted || !file) return null;

  const clampOffsetsFor = (nextOffsets, nextZoom = zoom) => {
    const image = imageRef.current;
    if (!image) return nextOffsets;
    const scale = getCoverScale({
      imageWidth: image.naturalWidth,
      imageHeight: image.naturalHeight,
      viewportSize: VIEWPORT_SIZE,
      zoom: nextZoom,
    });
    return clampCropOffsets({
      ...nextOffsets,
      renderedWidth: image.naturalWidth * scale,
      renderedHeight: image.naturalHeight * scale,
      viewportSize: VIEWPORT_SIZE,
    });
  };

  const finishDrag = (event) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    dragRef.current = null;
  };

  const cropAndUpload = async () => {
    const image = imageRef.current;
    if (!image || !ready || busy || processing) return;

    setProcessing(true);
    try {
      const geometry = getSquareCropGeometry({
        imageWidth: image.naturalWidth,
        imageHeight: image.naturalHeight,
        viewportSize: VIEWPORT_SIZE,
        zoom,
        ...offsets,
        outputSize: OUTPUT_SIZE,
      });
      const output = document.createElement('canvas');
      output.width = geometry.outputWidth;
      output.height = geometry.outputHeight;
      output.getContext('2d').drawImage(
        image,
        geometry.sourceX,
        geometry.sourceY,
        geometry.sourceSize,
        geometry.sourceSize,
        0,
        0,
        geometry.outputWidth,
        geometry.outputHeight
      );
      const blob = await new Promise((resolve, reject) => {
        output.toBlob((nextBlob) => {
          if (nextBlob) resolve(nextBlob);
          else reject(new Error('The cropped image could not be created.'));
        }, 'image/jpeg', 0.92);
      });
      const baseName = String(file.name || 'profile').replace(/\.[^.]+$/, '') || 'profile';
      const croppedFile = new File([blob], `${baseName}-cropped.jpg`, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });
      await onCrop(croppedFile);
    } finally {
      setProcessing(false);
    }
  };

  return createPortal(
    <div className="blog-avatar-crop-overlay" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !busy && !processing) onCancel();
    }}>
      <section
        className="blog-avatar-crop-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="blog-avatar-crop-title"
      >
        <div className="blog-avatar-crop-heading">
          <div>
            <p className="tag-badge">Profile Picture</p>
            <h3 id="blog-avatar-crop-title">Crop your avatar</h3>
          </div>
          <button className="blog-avatar-crop-close" type="button" onClick={onCancel} disabled={busy || processing} aria-label="Close avatar cropper" autoFocus>
            ×
          </button>
        </div>

        <p className="meta blog-avatar-crop-help" id="blog-avatar-crop-help">Drag or use the arrow keys to position the image. Use zoom to frame the square.</p>

        <canvas
          ref={canvasRef}
          className={`blog-avatar-crop-canvas ${ready ? 'is-ready' : ''}`.trim()}
          width={VIEWPORT_SIZE}
          height={VIEWPORT_SIZE}
          aria-label="Square avatar crop preview"
          aria-describedby="blog-avatar-crop-help"
          tabIndex="0"
          onPointerDown={(event) => {
            if (!ready) return;
            event.currentTarget.setPointerCapture?.(event.pointerId);
            dragRef.current = {
              pointerId: event.pointerId,
              clientX: event.clientX,
              clientY: event.clientY,
              ...offsets,
            };
          }}
          onPointerMove={(event) => {
            const drag = dragRef.current;
            if (!drag || drag.pointerId !== event.pointerId) return;
            const rect = event.currentTarget.getBoundingClientRect();
            const scaleToCanvas = VIEWPORT_SIZE / rect.width;
            setOffsets(clampOffsetsFor({
              offsetX: drag.offsetX + ((event.clientX - drag.clientX) * scaleToCanvas),
              offsetY: drag.offsetY + ((event.clientY - drag.clientY) * scaleToCanvas),
            }));
          }}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
          onKeyDown={(event) => {
            const movement = {
              ArrowLeft: { offsetX: -8, offsetY: 0 },
              ArrowRight: { offsetX: 8, offsetY: 0 },
              ArrowUp: { offsetX: 0, offsetY: -8 },
              ArrowDown: { offsetX: 0, offsetY: 8 },
            }[event.key];
            if (!movement) return;
            event.preventDefault();
            setOffsets((current) => clampOffsetsFor({
              offsetX: current.offsetX + movement.offsetX,
              offsetY: current.offsetY + movement.offsetY,
            }));
          }}
        />

        <label className="blog-avatar-crop-zoom" htmlFor="blog-avatar-zoom">
          <span>Zoom</span>
          <input
            id="blog-avatar-zoom"
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={zoom}
            disabled={!ready || busy || processing}
            onChange={(event) => {
              const nextZoom = Number(event.target.value);
              setZoom(nextZoom);
              setOffsets((current) => clampOffsetsFor(current, nextZoom));
            }}
          />
          <output htmlFor="blog-avatar-zoom">{zoom.toFixed(2)}×</output>
        </label>

        <div className="actions blog-avatar-crop-actions">
          <button className="button" type="button" onClick={onCancel} disabled={busy || processing}>Cancel</button>
          <button className="button primary" type="button" onClick={cropAndUpload} disabled={!ready || busy || processing}>
            {busy || processing ? 'Cropping...' : 'Crop & Upload'}
          </button>
        </div>
      </section>
    </div>,
    document.body
  );
}
