interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

interface Tile {
  x: number;
  y: number;
  z: number;
  "-y": number;
}

function mercatorToTileXY(
  mx: number,
  my: number,
  zoom: number,
): { x: number; y: number } {
  const tileX = Math.floor(
    ((mx + 20037508.34) / (20037508.34 * 2)) * Math.pow(2, zoom),
  );
  const tileY = Math.floor(
    (1 - (my + 20037508.34) / (20037508.34 * 2)) * Math.pow(2, zoom),
  );
  return { x: tileX, y: tileY };
}

export function getTMSTiles(bbox: BoundingBox): Tile[] {
  const tiles: Tile[] = [];

  for (let z = 1; z <= 20; z++) {
    const minTile = mercatorToTileXY(bbox.minX, bbox.maxY, z);
    const maxTile = mercatorToTileXY(bbox.maxX, bbox.minY, z);
    for (let x = minTile.x; x <= maxTile.x; x++) {
      for (let y = minTile.y; y <= maxTile.y; y++) {
        const invertedY = Math.pow(2, z) - 1 - y;
        tiles.push({ x, y, z, "-y": invertedY });
      }
    }
  }

  return tiles;
}
