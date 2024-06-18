import {
  Data,
  GeoserverGeoJSONFeature,
  Layer,
  LayerMetadata,
} from "../interfaces";
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
    const layers = await db.query("SELECT * FROM layers");
    const proj_defs = await db.query("SELECT * FROM proj_defs");

    console.log("data ->", data.values);
    console.log("layers ->", layers.values);
    console.log("proj_defs ->", proj_defs.values);
  } catch (error) {
    console.error(error);
  }
}

export async function clearData() {
  try {
    await db.query("DELETE FROM data");
    await db.query("DELETE FROM layers");
    await db.query("DELETE FROM proj_defs");
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

export async function insertLayer(layer: string, layerStyleSLD: string) {
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
          SELECT * FROM layers;
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
          layer: layer.layer,
          style: await convertSldToOl(layer.style),
          type: "FeatureCollection",
          features: query.values.map((e: any) => e.data),
          is_visible: JSON.parse(layer.is_visible),
        };
      }),
    );

    return layers;
  } catch (error) {
    throw error;
  }
}

export async function getLayerList(): Promise<LayerMetadata[]> {
  try {
    const query = await db.query(`
        SELECT * FROM layers;
    `);

    const result = query.values.map((e: any) => {
      return {
        layer: e.layer,
        style: e.style,
        is_visible: JSON.parse(e.is_visible),
      };
    });

    return result;
  } catch (error) {
    throw error;
  }
}

export async function getLayerFeatures(layer: string): Promise<Data[]> {
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

export async function setLayerVisibility(layer: string, visibility: boolean) {
  try {
    await db.query(`
      UPDATE layers SET is_visible = '${visibility}' WHERE layer = '${layer}';
    `);
  } catch (error) {
    throw error;
  }
}

export async function getDefaults(layer: string): Promise<Data> {
  try {
    const row = await db.query(
      `SELECT * FROM data WHERE layer = '${layer}' LIMIT 1`,
    );

    if (row.values.length === 0) {
      throw new Error("No default data found");
    }

    const jsonData = row.values[0];

    jsonData.data = JSON.parse(jsonData.data);
    console.log("🚀 ~ getDefaults ~ jsonData:", jsonData);

    const cleanedProperties: { [key: string]: any } = {};

    // Iterate over properties keys and set them to null
    for (const key in jsonData.data.properties) {
      if (jsonData.data.properties.hasOwnProperty(key)) {
        cleanedProperties[key] = null;
      }
    }

    const fid = jsonData.layer + "." + String(new Date().getTime());

    return {
      fid: fid,
      layer: jsonData.layer,
      data: {
        type: jsonData.data.type,
        id: fid,
        geometry: {
          type: jsonData.data.geometry.type,
          coordinates: [],
        },
        geometry_name: jsonData.data.geometry_name,
        properties: cleanedProperties,
      },
    };
  } catch (error) {
    throw error;
  }
}

export async function getAsGeojson(table: string) {
  try {
    const query = await db.query(
      `SELECT
      json_object(
          'type', 'FeatureCollection',
          'features', json_group_array(
              json_object(
                  'type', 'Feature',
                  'geometry', json_extract(data, '$.geometry'),
                  'properties', json_extract(data, '$.properties')
              )
          )
      ) AS geojson_collection
  FROM
      data
  WHERE
      layer = '${table}';`,
    );

    if (query.values && query.values.length > 0) {
      const parsedGeojson = JSON.parse(query.values[0].geojson_collection);
      return parsedGeojson;
    } else {
      return null;
    }
  } catch (error) {
    console.error(error);
    throw new Error(`Erro ao consultar dados GeoJSON na tabela ${table}.`);
  }
}
export async function getFeicao(fid: string): Promise<GeoserverGeoJSONFeature> {
  try {
    const query = await db.query(`
      SELECT * FROM data WHERE fid = '${fid}';
    `);

    const data = JSON.parse(query.values[0].data);
    return data;
  } catch (error) {
    throw error;
  }
}

export async function updateFeicao(fid: string, data: GeoserverGeoJSONFeature) {
  try {
    await db.query(`
      UPDATE data SET data = '${JSON.stringify(data)}' WHERE fid = '${fid}';
    `);
  } catch (error) {
    throw error;
  }
}

export async function postActiveBasemap(basemap: string, key: string) {
  try {
    const existingRecord = await getActiveBasemap(key);

    if (existingRecord) {
      await db.query(`UPDATE proj_defs SET data = ? WHERE "key" = ?`, [
        key,
        JSON.stringify(basemap),
      ]);
    } else {
      await db.query(`INSERT INTO proj_defs ("key", data) VALUES (?, ?)`, [
        key,
        JSON.stringify(basemap),
      ]);
    }
  } catch (error) {
    throw error;
  }
}

export async function getActiveBasemap(key: string) {
  try {
    const query = await db.query(`
      SELECT * FROM proj_defs WHERE key = '${key}';
    `);

    if (query.values[0].data) {
      return JSON.parse(query.values[0].data);
    } else {
      return undefined;
    }
  } catch (error) {
    console.log(error);
    return undefined;
  }
}
