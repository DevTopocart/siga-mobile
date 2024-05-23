import { Style } from "ol/style";

export interface GeoserverResource {
  name: string;
  href: string;
}

export type FeatureTypeApp = FeatureType & FeatureTypeAppProps;

export interface FeatureTypeAppProps {
  online: boolean;
}

export interface FeatureType {
  name: string;
  nativeName: string;
  namespace: Namespace;
  title: string;
  keywords: Keywords;
  nativeCRS: NativeCRS;
  srs: string;
  nativeBoundingBox: NativeBoundingBox;
  latLonBoundingBox: LatLonBoundingBox;
  projectionPolicy: string;
  enabled: boolean;
  metadata: Metadata;
  store: Store;
  serviceConfiguration: boolean;
  maxFeatures: number;
  numDecimals: number;
  padWithZeros: boolean;
  forcedDecimal: boolean;
  overridingServiceSRS: boolean;
  skipNumberMatched: boolean;
  circularArcPresent: boolean;
  attributes: Attributes;
}

export interface Attributes {
  attribute: Attribute[];
}

export interface Attribute {
  name: string;
  minOccurs: number;
  maxOccurs: number;
  nillable: boolean;
  binding: string;
}

export interface Store {
  "@class": string;
  name: string;
  href: string;
}

export interface Metadata {
  entry: Entry;
}

export interface Entry {
  "@key": string;
  $: string;
}

export interface LatLonBoundingBox {
  minx: number;
  maxx: number;
  miny: number;
  maxy: number;
  crs: string;
}

export interface NativeBoundingBox {
  minx: number;
  maxx: number;
  miny: number;
  maxy: number;
  crs: NativeCRS;
}

export interface NativeCRS {
  "@class": string;
  $: string;
}

export interface Keywords {
  string: string[];
}

export interface Namespace {
  name: string;
  href: string;
}

export interface Basemaps {
  active: Basemap;
  basemaps: Basemap[];
}

export interface Basemap {
  name: string;
  url: string;
}

export interface GeoserverGeoJSON {
  type: string;
  features: GeoserverGeoJSONFeature[];
  totalFeatures?: number;
  numberMatched?: number;
  numberReturned?: number;
  timeStamp?: string;
  links?: Link[];
  crs?: Crs;
  bbox?: number[];
}

export interface Crs {
  type: string;
  properties: { [key: string]: any };
}

export interface Link {
  title: string;
  type: string;
  rel: string;
  href: string;
}

export interface GeoserverGeoJSONFeature {
  type: string;
  id: string;
  geometry: Geometry;
  geometry_name: string;
  properties: { [key: string]: any };
}

export interface Geometry {
  type: string;
  coordinates: number[][][][];
}

export interface LayerMetadata {
  name: string;
  style: Style | Style[];
}

export type Layer = LayerMetadata & GeoserverGeoJSON