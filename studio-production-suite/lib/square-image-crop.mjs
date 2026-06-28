function positiveNumber(value, fallback = 1) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function clamp(value, minimum, maximum) {
  const clamped = Math.min(maximum, Math.max(minimum, Number(value) || 0));
  return Object.is(clamped, -0) ? 0 : clamped;
}

export function getCoverScale({ imageWidth, imageHeight, viewportSize, zoom = 1 }) {
  const width = positiveNumber(imageWidth);
  const height = positiveNumber(imageHeight);
  const viewport = positiveNumber(viewportSize);
  const safeZoom = clamp(zoom, 1, 3);

  return Math.max(viewport / width, viewport / height) * safeZoom;
}

export function clampCropOffsets({ offsetX = 0, offsetY = 0, renderedWidth, renderedHeight, viewportSize }) {
  const viewport = positiveNumber(viewportSize);
  const maxOffsetX = Math.max(0, (positiveNumber(renderedWidth) - viewport) / 2);
  const maxOffsetY = Math.max(0, (positiveNumber(renderedHeight) - viewport) / 2);

  return {
    offsetX: clamp(offsetX, -maxOffsetX, maxOffsetX),
    offsetY: clamp(offsetY, -maxOffsetY, maxOffsetY),
  };
}

export function getSquareCropGeometry({
  imageWidth,
  imageHeight,
  viewportSize,
  zoom = 1,
  offsetX = 0,
  offsetY = 0,
  outputSize = 1000,
}) {
  const width = positiveNumber(imageWidth);
  const height = positiveNumber(imageHeight);
  const viewport = positiveNumber(viewportSize);
  const output = positiveNumber(outputSize, 1000);
  const scale = getCoverScale({ imageWidth: width, imageHeight: height, viewportSize: viewport, zoom });
  const renderedWidth = width * scale;
  const renderedHeight = height * scale;
  const clamped = clampCropOffsets({
    offsetX,
    offsetY,
    renderedWidth,
    renderedHeight,
    viewportSize: viewport,
  });
  const drawX = (viewport - renderedWidth) / 2 + clamped.offsetX;
  const drawY = (viewport - renderedHeight) / 2 + clamped.offsetY;

  return {
    scale,
    offsetX: clamped.offsetX,
    offsetY: clamped.offsetY,
    sourceX: Math.max(0, -drawX / scale),
    sourceY: Math.max(0, -drawY / scale),
    sourceSize: viewport / scale,
    outputWidth: output,
    outputHeight: output,
  };
}
