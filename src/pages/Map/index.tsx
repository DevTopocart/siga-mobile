import { App as CapApp } from "@capacitor/app";
import { Geolocation } from "@capacitor/geolocation";
import { Network } from "@capacitor/network";
import {
  IonButton,
  IonChip,
  IonContent,
  IonFab,
  IonFabButton,
  IonFabList,
  IonHeader,
  IonIcon,
  useIonActionSheet,
  useIonToast,
} from "@ionic/react";
import { home, layersOutline, location, pencil } from "ionicons/icons";
import { Feature, MapBrowserEvent } from "ol";
import { Coordinate } from "ol/coordinate";
import GeoJSON from "ol/format/GeoJSON";
import { Geometry, Point, Polygon } from "ol/geom";
import { Vector } from "ol/layer";
import "ol/ol.css";
import { fromLonLat } from "ol/proj";
import { useEffect, useRef, useState } from "react";
import { CgClose } from "react-icons/cg";
import { useHistory } from "react-router";
import {
  RFeature,
  RInteraction,
  RLayerTile,
  RLayerVector,
  RMap,
  RStyle,
  VectorSourceEvent,
} from "rlayers";
import { useApp } from "../../contexts/AppContext";
import { Layer } from "../../interfaces";
import {
  clearData,
  getDefaults,
  getLayers,
  insertFeature,
  showData,
} from "../../services/db";
import {
  BottomButtonsContainer,
  LeftButtonsContainer,
  RightButtonsContainer,
} from "./styles";
import "./styles.css";

export default function Map() {
  const history = useHistory();

  /* App hooks and states */
  const { basemaps, view, setView, initialView } = useApp();

  /* Connection hooks and states */
  const [isConnected, setIsConnected] = useState(false);
  useEffect(() => {
    const listener = Network.addListener("networkStatusChange", (status) => {
      setIsConnected(status.connected);
    });

    Network.getStatus().then((status) => setIsConnected(status.connected));

    return () => {
      listener.remove();
    };
  }, []);

  /* UI hooks e states */
  const [present] = useIonActionSheet();
  const [presentToast] = useIonToast();

  CapApp.addListener("backButton", (e) => {
    if (history.location.pathname === "/map") {
      history.push("/map");
    }
  });

  function toast(message: string) {
    presentToast({
      message: message,
      duration: 2000,
      position: "bottom",
    });
  }

  /* Map logic, hooks and states */
  let map = useRef<RMap>(null);
  const [localization, setLocalization] = useState<Coordinate>();
  const [layers, setLayers] = useState<Layer[]>();
  const [layerOnEdit, setLayerOnEdit] = useState<string | null>(null);
  const fabEditorRef = useRef<HTMLIonFabElement>(null);

  let isDefaultMapView = true;

  if (history.location.state) {
    isDefaultMapView = false;
  }

  async function makeLayers() {
    const layers = await getLayers();

    setLayers(layers.filter((layer) => layer.is_visible));
  }

  useEffect(() => {
    if (!layers) {
      makeLayers();
    }
  }, [layers]);

  function handleMapClick(e: MapBrowserEvent<UIEvent>) {
    if (!map.current) return;
    const features = map.current.ol.getFeaturesAtPixel(e.pixel, {
      layerFilter: (layer) => layer instanceof Vector, // Filter only vector layers
      hitTolerance: 5, // Optional: increases the clickable area around the point
    });

    if (features.length > 0) {
      const featuresFound= features.map((f) => {
        return {
          fid: f.getId(),
          properties: f.getProperties(),
        };
      })
      console.log("Features found:", featuresFound);
      history.push("/list",{features: JSON.stringify(featuresFound)});
    }
  }

  function handleAddFeature(e: VectorSourceEvent<Geometry>) {
    let feature = e.feature;

    if (!feature) return;

    const geometry = feature.getGeometry();
    getDefaults(layerOnEdit!).then(async (defaults) => {
      let geom = [];
      geom.push(
        new Feature(geometry!.clone().transform("EPSG:3857", "EPSG:4326")),
      );
      let writer = new GeoJSON();
      let geojson = JSON.parse(writer.writeFeatures(geom));
      console.log(geojson);

      let newFeature = {
        fid: defaults.fid,
        layer: defaults.layer,
        data: {
          type: defaults.data.type,
          id: defaults.fid,
          geometry: geojson.features[0].geometry,
          geometry_name: defaults.data.geometry_name,
          properties: defaults.data.properties,
        },
      };

      await insertFeature(defaults.layer, newFeature.data);

      history.push("/details", {
        feature: newFeature,
      });
    });

    return;
  }

  function handleToggleEdit(layer: string) {
    setLayerOnEdit(layer);
    fabEditorRef.current?.close();
    presentToast("Clique no mapa para adicionar um novo elemento", 2000);
  }

  return (
    <IonContent>
      <IonHeader></IonHeader>
      {isDefaultMapView && (
        <LeftButtonsContainer>
          <IonFabButton size="small" onClick={() => clearData()}>
            CL
          </IonFabButton>
          <IonFabButton size="small" onClick={async () => await showData()}>
            SW
          </IonFabButton>
        </LeftButtonsContainer>
      )}
      {isDefaultMapView && (
        <RightButtonsContainer>
          <IonFabButton
            size="small"
            color={"primary"}
            onClick={() => {
              history.push("/layers");
            }}
          >
            <IonIcon icon={layersOutline}></IonIcon>
          </IonFabButton>
          <IonFabButton
            size="small"
            color={"primary"}
            onClick={() => {
              setView(initialView);
            }}
          >
            <IonIcon icon={home}></IonIcon>
          </IonFabButton>
          <IonFabButton
            size="small"
            color={"primary"}
            onClick={async () => {
              Geolocation.getCurrentPosition().then((position: any) => {
                const newCenter = fromLonLat([
                  position.coords.longitude,
                  position.coords.latitude,
                ]);
                setLocalization(newCenter);
              });
            }}
          >
            <IonIcon icon={location}></IonIcon>
          </IonFabButton>
        </RightButtonsContainer>
      )}
      {isDefaultMapView && layers && layers?.length !== 0 && (
        <BottomButtonsContainer>
          {layerOnEdit && (
            <IonChip
              style={{
                backgroundColor: "var(--ion-color-light-shade)",
              }}
            >
              Editando {layerOnEdit}
            </IonChip>
          )}
          {layerOnEdit && (
            <IonFabButton size="small" onClick={() => setLayerOnEdit(null)}>
              <CgClose size={20} onClick={() => setLayerOnEdit(null)} />
            </IonFabButton>
          )}
          {!layerOnEdit && (
            <IonFab
              slot="fixed"
              vertical="bottom"
              horizontal="end"
              ref={fabEditorRef}
            >
              <IonFabButton size="small" color={"primary"}>
                <IonIcon icon={pencil}></IonIcon>
              </IonFabButton>
              <IonFabList side="top">
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    width: "100%",
                    transform: "translateX(-50%)",
                  }}
                >
                  {layers &&
                    layers.map((layer, index) => {
                      return (
                        <IonButton
                          fill="solid"
                          onClick={() => handleToggleEdit(layer.layer)}
                        >
                          {layer.layer}
                        </IonButton>
                      );
                    })}
                </div>
              </IonFabList>
            </IonFab>
          )}
        </BottomButtonsContainer>
      )}
      {!isDefaultMapView && (
        <BottomButtonsContainer>
          <IonButton
            style={{
              width: "90%",
            }}
            onClick={() =>
              history.push("/layers", {
                ...(history.location.state as any),
                boundingBox: map.current?.ol
                  .getView()
                  .calculateExtent(map.current?.ol.getSize()),
              })
            }
          >
            OK
          </IonButton>
          <IonButton
            style={{
              width: "90%",
            }}
            onClick={() => history.push("/layers", {})}
            color={"danger"}
          >
            Cancelar
          </IonButton>
        </BottomButtonsContainer>
      )}
      <RMap
        ref={map}
        width={"100%"}
        height={"100%"}
        noDefaultControls={true}
        initial={view}
        view={[view, setView]}
        onClick={(e) => handleMapClick(e)}
      >
        <RLayerTile url={basemaps.active.url} zIndex={11} />

        {localization && (
          <RLayerVector zIndex={998}>
            <RFeature geometry={new Point(localization)}>
              <RStyle.RStyle>
                <RStyle.RCircle radius={11}>
                  <RStyle.RFill color="rgba(0,0,0,0.2)" />
                </RStyle.RCircle>
              </RStyle.RStyle>

              <RStyle.RStyle>
                <RStyle.RCircle radius={8}>
                  <RStyle.RFill color="#1872FF" />
                  <RStyle.RStroke color="#FFFFFF" width={2} />
                </RStyle.RCircle>
              </RStyle.RStyle>
            </RFeature>
          </RLayerVector>
        )}

        {isDefaultMapView &&
          layers &&
          layers.map((layer, index) => (
            <RLayerVector
              key={index}
              zIndex={200 + index}
              features={
                new GeoJSON({
                  featureProjection: "EPSG:3857",
                  dataProjection: "EPSG:4326",
                }).readFeatures(layer) as Feature<Polygon>[]
              }
              style={layer.style}
              onAddFeature={handleAddFeature}
            >
              <RStyle.RStyle>
                <RStyle.RStroke color="red" width={1} />
                <RStyle.RFill color="rgba(20,20,20,0)" />
              </RStyle.RStyle>

              <RInteraction.RDraw
                // @ts-expect-error
                type={layer.features[0].geometry.type as string}
                condition={() => layerOnEdit === layer.layer}
              />
            </RLayerVector>
          ))}
      </RMap>
    </IonContent>
  );
}
