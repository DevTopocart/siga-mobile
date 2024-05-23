import { App as CapApp } from "@capacitor/app";
import { Geolocation } from "@capacitor/geolocation";
import { Network } from "@capacitor/network";
import {
  IonButton,
  IonContent,
  IonFabButton,
  IonHeader,
  useIonActionSheet,
  useIonToast,
} from "@ionic/react";
import { Feature, MapBrowserEvent } from "ol";
import { Coordinate } from "ol/coordinate";
import GeoJSON from "ol/format/GeoJSON";
import { Point, Polygon } from "ol/geom";
import { Vector } from "ol/layer";
import "ol/ol.css";
import { fromLonLat } from "ol/proj";
import { useEffect, useRef, useState } from "react";
import { FiLayers } from "react-icons/fi";
import { GiHouse, GiPositionMarker } from "react-icons/gi";
import { useHistory } from "react-router";
import { RFeature, RLayerTile, RLayerVector, RMap, RStyle } from "rlayers";
import { useApp } from "../../contexts/AppContext";
import { Layer } from "../../interfaces";
import { clearData, getLayerList, getLayers } from "../../services/db";
import { getLayerStyle } from "../../services/geoserver";
import { convertSldToOl } from "../../utils/convertSldToOl";
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

  let isDefaultMapView = true;

  if (history.location.state) {
    console.log(
      "mapa iniciado em modo de seleção de área ->",
      history.location.state,
    );
    isDefaultMapView = false;
  }

  async function makeLayers() {
    const layers = await getLayers();
    console.log("🚀 ~ makeLayers ~ layers:", layers)
    setLayers(layers);
  }

  useEffect(() => {
    if (!layers) {
      makeLayers();
    }
  }, [layers]);

  function handleMapClick(e: MapBrowserEvent<UIEvent>) {
    if (!map.current) return;
    const features = map.current.ol.getFeaturesAtPixel(e.pixel, {
      layerFilter: (layer) => layer instanceof Vector,  // Filter only vector layers
      hitTolerance: 5  // Optional: increases the clickable area around the point
    });

    if (features.length > 0) {
      console.log("Features found:", features.map(f => {
        return {
          fid: f.getId(),
          properties: f.getProperties()
        }
      }));
    } else {
      console.log("No features found at this point.");
    }
  }

  return (
    <IonContent>
      <IonHeader></IonHeader>
      {isDefaultMapView && (
        <LeftButtonsContainer>
          <IonFabButton size="small" onClick={() => clearData()}>
            CL
          </IonFabButton>
          <IonFabButton size="small" onClick={async () => console.log(await getLayers(), await getLayerList())}>
            SW
          </IonFabButton>
          <IonFabButton size="small" onClick={async () => console.log(await convertSldToOl( await getLayerStyle(`lote`) ))}>
            LS
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
            <FiLayers size={20} />
          </IonFabButton>
          <IonFabButton
            size="small"
            color={"primary"}
            onClick={() => {
              setView(initialView);
            }}
          >
            <GiHouse size={20} />
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
            <GiPositionMarker size={20} />
          </IonFabButton>
        </RightButtonsContainer>
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
            onClick={() =>
              history.push("/layers", {})
            }
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
            >
              <RStyle.RStyle>
                <RStyle.RStroke color="red" width={1} />
                <RStyle.RFill color="rgba(20,20,20,0)" />
              </RStyle.RStyle>
            </RLayerVector>
          ))}
      </RMap>
    </IonContent>
  );
}
