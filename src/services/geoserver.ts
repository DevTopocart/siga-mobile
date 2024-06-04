import { environments } from "../environments";
import {
  FeatureType,
  GeoserverGeoJSON,
  GeoserverResource,
} from "../interfaces";
import { geoserver } from "../repositories/geoserver";

export async function getFeatureTypes(): Promise<FeatureType[]> {
  try {
    const request = await geoserver(
      `/geoserver/rest/workspaces/${environments.workspace}/datastores/angra_cadastro/featuretypes.json`,
      "GET",
    );

    const layers: GeoserverResource[] = request.data.featureTypes.featureType;

    const featureTypes = await Promise.all(
      layers.map(async (layer: GeoserverResource) => {
        const request = await geoserver(
          `/geoserver/rest/workspaces/${environments.workspace}/datastores/angra_cadastro/featuretypes/${layer.name}.json`,
          "GET",
        );
        return request.data.featureType;
      }),
    );

    return featureTypes.filter((e) => e);
  } catch (error) {
    console.error(
      "Não foi possível buscar os FeatureTypes do Geoserver.",
      error,
    );
    throw error;
  }
}

export async function getFeatureType(
  layerName: string,
  startIndex: number,
  count: number,
  bbox: [number, number, number, number], // Bounding box as [minX, minY, maxX, maxY]
): Promise<GeoserverGeoJSON> {
  const bboxParam = bbox ? `&bbox=${bbox.join(",")},EPSG:3857` : "";
  const url = `/geoserver/${environments.workspace}/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=${environments.workspace}:${layerName}&outputFormat=application/json&startIndex=${startIndex}&count=${count}${bboxParam}&srsName=EPSG:4326`;
  const response = await geoserver(url, "GET");
  return response.data;
}

export async function getLayerStyle(layerName: string): Promise<string> {
  const url = `/geoserver/${environments.workspace}/ows?request=GetStyles&layers=${environments.workspace}:${layerName}&service=wms&version=1.1.1`;
  const response = await geoserver(url, "GET");
  return response.data;
}
