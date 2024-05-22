import { GeoserverGeoJSON, GeoserverGeoJSONFeature } from "../interfaces";
import { db } from "../repositories/db";

export async function makeDatabase() {
    try {
      await db.createDefaultTables();
    } catch (error) {
      console.error(error);
    }
  }
  
export async function showData() {
    try {
      const data = await db.query('SELECT * FROM data');
      console.log('data ->', data.values) 
    } catch (error) {
      console.error(error);
    }
}

export async function clearData() {
  try {
    await db.query('DELETE FROM data');
  } catch (error) {
    console.error(error);
  }
}

export async function insertFeature(layerName: string, feature: GeoserverGeoJSONFeature) {
  try {
    await db.query(`
      INSERT INTO data (fid, layer, data) VALUES ($1, $2, $3) ON CONFLICT (layer,fid) DO UPDATE SET data = $3 WHERE data.layer = $2 AND data.fid = $1;
    `,[feature.id, layerName, JSON.stringify(feature)]);
    console.log('Feature inserted')
  } catch (error) {
    console.error(error);
  }
}


export async function getLayers(): Promise<GeoserverGeoJSON[]> {
  try {
    
    const query = await db.query(`
          SELECT DISTINCT layer FROM data;
      `);

    const layers = await Promise.all(
      query.values.map(async (layer: any) => {
        const query = await db.query(`
          SELECT * FROM data WHERE layer = '${layer.layer}';
        `)

        query.values.forEach((e: any) => { 
          e.data = JSON.parse(e.data) 
        })

        return {
          type: 'FeatureCollection',
          features: query.values.map((e: any) => e.data),
        }
      })  
    )
  
    return layers;
  } catch (error) {
    
    throw error;
  }
}

export async function getLayerFeatures(layer: string) {
  try {
    
    const query = await db.query(`
      SELECT * FROM data WHERE layer = '${layer}';
    `)

    query.values.forEach((e: any) => {
      e.geom = JSON.parse(e.geom)
      e.data = JSON.parse(e.data)
    })

    return query.values
  } catch (error) {
    throw error 
  }
}