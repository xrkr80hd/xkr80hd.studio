import test from 'node:test';
import assert from 'node:assert/strict';

const cropGeometryModule = import('../lib/square-image-crop.mjs').catch((error) => ({
  loadError: error,
}));

async function loadCropGeometry() {
  const geometry = await cropGeometryModule;
  assert.equal(
    geometry.loadError,
    undefined,
    'expected the shared square crop geometry module to exist'
  );
  return geometry;
}

test('cover scale fills a square viewport for landscape and portrait images', async () => {
  const { getCoverScale } = await loadCropGeometry();

  assert.equal(getCoverScale({ imageWidth: 1200, imageHeight: 800, viewportSize: 400 }), 0.5);
  assert.equal(getCoverScale({ imageWidth: 800, imageHeight: 1200, viewportSize: 400 }), 0.5);
});

test('zoom multiplies the minimum cover scale', async () => {
  const { getCoverScale } = await loadCropGeometry();

  assert.equal(
    getCoverScale({ imageWidth: 1200, imageHeight: 800, viewportSize: 400, zoom: 1.5 }),
    0.75
  );
});

test('drag offsets are clamped so no blank edge enters the square viewport', async () => {
  const { clampCropOffsets } = await loadCropGeometry();

  assert.deepEqual(
    clampCropOffsets({
      offsetX: 180,
      offsetY: -75,
      renderedWidth: 600,
      renderedHeight: 400,
      viewportSize: 400,
    }),
    { offsetX: 100, offsetY: 0 }
  );

  assert.deepEqual(
    clampCropOffsets({
      offsetX: -180,
      offsetY: 130,
      renderedWidth: 600,
      renderedHeight: 600,
      viewportSize: 400,
    }),
    { offsetX: -100, offsetY: 100 }
  );
});

test('crop geometry produces a square source region and square output', async () => {
  const { getSquareCropGeometry } = await loadCropGeometry();

  assert.deepEqual(
    getSquareCropGeometry({
      imageWidth: 1200,
      imageHeight: 800,
      viewportSize: 400,
      zoom: 1,
      offsetX: 100,
      offsetY: 0,
      outputSize: 1000,
    }),
    {
      scale: 0.5,
      offsetX: 100,
      offsetY: 0,
      sourceX: 0,
      sourceY: 0,
      sourceSize: 800,
      outputWidth: 1000,
      outputHeight: 1000,
    }
  );
});
