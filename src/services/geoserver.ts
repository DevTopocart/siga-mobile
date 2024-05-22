import { FeatureType, GeoserverGeoJSON, GeoserverResource } from "../interfaces";
import { geoserver } from "../repositories/geoserver";
import { insertFeature } from "./db";

export async function getFeatureTypes(): Promise<FeatureType[]> {
  try {
    const request = await geoserver(
      "/geoserver/rest/workspaces/Angra/datastores/angra_cadastro/featuretypes.json",
      "GET",
    );

    const layers: GeoserverResource[] = request.data.featureTypes.featureType;

    const featureTypes = await Promise.all(
      layers.map(async (layer: GeoserverResource) => {
        const request = await geoserver(
          `/geoserver/rest/workspaces/Angra/datastores/angra_cadastro/featuretypes/${layer.name}.json`,
          "GET",
        );
        return request.data.featureType;
      }),
    );

    return featureTypes.filter(e => e);
  } catch (error) {
    console.error(
      "Não foi possível buscar os FeatureTypes do Geoserver.",
      error,
    );
    throw error;
  }
}

export async function fetchFeatureType(
  layerName: string,
  startIndex: number,
  count: number,
): Promise<GeoserverGeoJSON> {
  console.log(startIndex, count);
  const url = `/geoserver/Angra/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=Angra:${layerName}&outputFormat=application/json&startIndex=${startIndex}&count=${count}&srsName=EPSG:4326`;
  const response = await geoserver(url, "GET");
  return response.data;
}

export async function downloadAndSaveFeatureType(layer: { name: string }) {
  try {
    let startIndex = 0;
    const count = 500; // Number of records per page

    while (true) {
      const data = await fetchFeatureType(layer.name, startIndex, count);
      if (!data.features || data.features.length === 0) {
        break;
      }

      await Promise.all(data.features.map(async (feature: any) => {
        return await insertFeature(layer.name, feature);
      }))

      if (data.features.length < count) {
        break; // Break if the last page has less than 'count' items
      }

      startIndex += count; // Move to the next page
    }

    console.log("Downloaded all data successfully.");
  } catch (error) {
    console.error("Failed to download:", error);
    throw error;
  }
}
