import { App as CapApp } from "@capacitor/app";
import { Geolocation } from "@capacitor/geolocation";
import { Network } from "@capacitor/network";
import {
  IonContent,
  IonFabButton,
  IonHeader,
  useIonActionSheet,
  useIonToast
} from "@ionic/react";
import { Feature } from "ol";
import { Coordinate } from "ol/coordinate";
import GeoJSON from "ol/format/GeoJSON";
import { Point, Polygon } from "ol/geom";
import "ol/ol.css";
import { fromLonLat } from "ol/proj";
import { useEffect, useRef, useState } from "react";
import { FiLayers } from "react-icons/fi";
import { GiHouse, GiPositionMarker } from "react-icons/gi";
import { useHistory } from "react-router";
import { RFeature, RLayerTile, RLayerVector, RMap, RStyle } from "rlayers";
import { RView } from "rlayers/RMap";
import { useApp } from "../../contexts/AppContext";
import { GeoserverGeoJSON } from "../../interfaces";
import { clearData, getLayers } from "../../services/db";
import { LeftButtonsContainer, RightButtonsContainer } from "./styles";
import "./styles.css";

export default function Map() {
  const history = useHistory();
  useEffect(() => console.log("Render"), []);

  /* App hooks and states */
  const { basemaps } = useApp();

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
  const initialView = {
    "center": [
        -4932263.369981612,
        -2631855.098882083
    ],
    "zoom": 15.86196947686721,
    "resolution": 2.6284828255507837
};
  const [view, setView] = useState<RView>(initialView);
  const [localization, setLocalization] = useState<Coordinate>();
  const [layers,setLayers] = useState<GeoserverGeoJSON[]>()

  async function makeLayers() {
    const layers = await getLayers()
    setLayers(layers)
  }

  useEffect(() => {
    if (!layers) {
      makeLayers()
    }
  }, [layers])
  
  return (
    <IonContent>
      <IonHeader></IonHeader>
      <LeftButtonsContainer>
        <IonFabButton
          size="small"
          onClick={() => clearData()}
        >
          CL
        </IonFabButton>
        <IonFabButton
          size="small"
          onClick={() => makeLayers()}
        >
          SW
        </IonFabButton>
      </LeftButtonsContainer>
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
      <RMap
        ref={map}
        width={"100%"}
        height={"100%"}
        noDefaultControls={true}
        initial={view}
        view={[view, setView]}
      >
        <RLayerTile
          url={basemaps.active.url}
          zIndex={11}
        />

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

        {
          layers && layers.map((layer, index) => (
            <RLayerVector
              key={index}
              zIndex={200 + index}
              features={
                new GeoJSON({ featureProjection: "EPSG:3857", dataProjection: "EPSG:4326"}).readFeatures(
                  layer
                ) as Feature<Polygon>[]
              }
              onClick={(e) => console.log(e)}
            >
              <RStyle.RStyle>
                <RStyle.RStroke color="red" width={1} />
                <RStyle.RFill color="rgba(20,20,20,0)" />
              </RStyle.RStyle>
            </RLayerVector>
          ))
        }
      </RMap>
    </IonContent>
  );
}
