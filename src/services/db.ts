import { GeoserverGeoJSONFeature, Layer } from "../interfaces";
import { db } from "../repositories/db";
import { convertSldToOl } from "../utils/convertSldToOl";

export async function makeDatabase() {
  try {
    await db.createDefaultTables();
  } catch (error) {
    console.error(error);
  }
}

export async function showData() {
  try {
    const data = await db.query("SELECT * FROM data");
    console.log("data ->", data.values);
  } catch (error) {
    console.error(error);
  }
}

export async function clearData() {
  try {
    await db.query("DELETE FROM data");
  } catch (error) {
    console.error(error);
  }
}

export async function insertFeature(
  layerName: string,
  feature: GeoserverGeoJSONFeature,
) {
  try {
    await db.query(
      `
      INSERT INTO data (fid, layer, data) VALUES ($1, $2, $3) ON CONFLICT (layer,fid) DO UPDATE SET data = $3 WHERE data.layer = $2 AND data.fid = $1;
    `,
      [feature.id, layerName, JSON.stringify(feature)],
    );

    console.log("Feature inserted");
  } catch (error) {
    console.error(error);
  }
}

export async function insertLayer(
  layer: string,
  layerStyleSLD: string
) {
  try {
    await db.query(
      `
      INSERT INTO layers (layer, style) VALUES ($1, $2) ON CONFLICT (layer) DO UPDATE SET style = $2 WHERE layers.layer = $1;
    `,
      [layer, layerStyleSLD],
    );

    console.log("Layer inserted");
  } catch (error) {
    console.error(error);
  }

}

export async function getLayers(): Promise<Layer[]> {
  try {
    const query = await db.query(`
          SELECT DISTINCT layer FROM data;
      `);

    const layers = await Promise.all(
      query.values.map(async (layer: any) => {
        const query = await db.query(`
          SELECT * FROM data WHERE layer = '${layer.layer}';
        `);

        query.values.forEach((e: any) => {
          e.data = JSON.parse(e.data);
        });

        return {
          name: layer.layer,
          style: await convertSldToOl( await getLayerStyleFromDb(layer.layer) ),
          type: "FeatureCollection",
          features: query.values.map((e: any) => e.data),
        };
      }),
    );

    return layers;
  } catch (error) {
    throw error;
  }
}

export async function getLayerList(): Promise<{ layer: string, style: string, is_visible: boolean}[]> {
  try {
    const query = await db.query(`
        SELECT * FROM layers;
    `);

    return query.values
  } catch (error) {
    throw error;
  }
}

export async function getLayerFeatures(layer: string) {
  try {
    const query = await db.query(`
      SELECT * FROM data WHERE layer = '${layer}';
    `);

    query.values.forEach((e: any) => {
      e.geom = JSON.parse(e.geom);
      e.data = JSON.parse(e.data);
    });

    return query.values;
  } catch (error) {
    throw error;
  }
}

export async function getLayerStyleFromDb(layer: string) {
  try {
    const query = await db.query(`
      SELECT style FROM layers WHERE layer = '${layer}';
    `);

    return query.values[0].style;
  } catch (error) {
    throw error;
  }
}
