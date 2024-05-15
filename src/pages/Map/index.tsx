import { App as CapApp } from "@capacitor/app";
import { Geolocation } from "@capacitor/geolocation";
import { Network } from "@capacitor/network";
import {
  IonContent,
  IonFabButton,
  IonHeader,
  IonLoading,
  useIonActionSheet,
  useIonToast
} from "@ionic/react";
import { Feature } from "ol";
import { FeatureLike } from "ol/Feature";
import { Coordinate } from "ol/coordinate";
import { Point } from "ol/geom";
import Geometry from "ol/geom/Geometry";
import "ol/ol.css";
import { fromLonLat } from "ol/proj";
import { Fill, Text as OlText, Stroke, Style } from "ol/style";
import { useEffect, useRef, useState } from "react";
import { GiPositionMarker } from "react-icons/gi";
import { useHistory } from "react-router";
import {
  RFeature,
  RLayerTile,
  RLayerVector,
  RMap,
  RStyle
} from "rlayers";
import { RView } from "rlayers/RMap";
import {
  LeftButtonsContainer,
  RightButtonsContainer
} from "./styles";
import "./styles.css";

export default function Map() {
  const history = useHistory();

  const [present] = useIonActionSheet();
  const [presentToast] = useIonToast();

  CapApp.addListener("backButton", (e) => {
    if (history.location.pathname === "/map") {
      history.push("/map");
    }
  });

  useEffect(() => console.log("Render"), []);

  /* Connection hooks n states */
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

  function toast(message: string) {
    presentToast({
      message: message,
      duration: 2000,
      position: "bottom",
    });
  }

  /* Map logic, hooks and states */
  let map = useRef<RMap>(null);

  const mapStyles = {
    lote: (feature: FeatureLike, isOnline: boolean) => {
      const status = feature.get("status_campo");
      let stroke;
      let strokeWidth;

      switch (status) {
        case 1: // Disponivel
          stroke = "#000000";
          strokeWidth = isOnline ? 2 : 2;
          break;
        case 2: // Revisita
          stroke = "#001aff";
          strokeWidth = isOnline ? 2 : 2;
          break;
        case 3: // Concluido
          stroke = "#3cff00";
          strokeWidth = isOnline ? 2 : 2;
          break;
        default:
          stroke = "#ffffff";
          strokeWidth = isOnline ? 2 : 2;
          break;
      }

      var mainStyle = new Style({
        fill: new Fill({
          color: "#ffffff00",
        }),
        stroke: new Stroke({
          color: stroke,
          width: strokeWidth,
        }),
      });

      var baseStyle = new Style({
        stroke: new Stroke({
          color: "#ffffff",
          width: 5,
        }),
      });

      return isOnline ? [mainStyle] : [baseStyle, mainStyle];
    },
    logradouro: (feature: FeatureLike) => {
      const nome = feature.get("nome");
      const id = feature.get("id");

      var text = new OlText({
        text: `${nome} (${id})`,
        fill: new Fill({ color: "#ffffff" }),
        stroke: new Stroke({ color: "#000000", width: 3 }),
        placement: "line",
      });

      var mainStyle = new Style({
        stroke: new Stroke({
          color: "rgb(255,255,255)",
          width: 3,
        }),
        text: text,
      });

      var baseStyle = new Style({
        stroke: new Stroke({
          color: "#000000",
          width: 5,
        }),
      });

      return [baseStyle, mainStyle];
    },
    logradouroOffline: (feature: FeatureLike) => {
      const nome = feature.get("nome");
      const id = feature.get("id");

      var text = new OlText({
        text: `${nome} (${id})`,
        fill: new Fill({ color: "#ffffff" }),
        stroke: new Stroke({ color: "#000000", width: 3 }),
        placement: "line",
      });

      var mainStyle = new Style({
        stroke: new Stroke({
          color: "rgb(255,255,255)",
          width: 3,
        }),
        text: text,
      });

      var baseStyle = new Style({
        stroke: new Stroke({
          color: "#000000",
          width: 5,
        }),
      });

      return [baseStyle, mainStyle];
    },
    loteSelecionado: `#FFE600`,
    edificacaoOnline: `#ffcfcf`,
    edificacaoLote: `#BCBCBC`,
    edificacaoImobiliario: `#C77272`,
    edificacaoSelecionada: `#FA0707`,
  };

  const initialView = {
    "center": [
        -4934237.693764885,
        -2632962.737977016
    ],
    "zoom": 12.425022330927394,
    "resolution": 28.46618897541094
};
  const [view, setView] = useState<RView>(initialView);
  console.log("🚀 ~ Map ~ view:", view)
  const [lotes, setLotes] = useState<Feature<Geometry>[]>([]);
  const [logradourosProximos, setlogradourosProximos] = useState<
    Feature<Geometry>[]
  >([]);
  const [selectedLote, setSelectedLote] = useState<Geometry>();
  const [localization, setLocalization] = useState<Coordinate>();

  function handleClick(id: number, geometry: Geometry) {
    console.log(geometry);
  }

  return (
    <IonContent>
      <IonHeader>
      </IonHeader>
      <IonLoading
        message={
          'test'
        }
        isOpen={
          false
        }
      ></IonLoading>
      <LeftButtonsContainer>
        {/* <IonFabButton
          size="small"
          color={"secondary"}
          onClick={() => history.push("/intro")}
        >
          <GiExitDoor size={20} />
        </IonFabButton> */}

      </LeftButtonsContainer>
      <RightButtonsContainer>
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
          url={`http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}`}
          zIndex={11}
        />

        {/* <ROSM /> */}

        {selectedLote && (
          <RLayerVector zIndex={102}>
            <RFeature geometry={selectedLote}>
              <RStyle.RStyle>
                <RStyle.RStroke color={mapStyles.loteSelecionado} width={3} />
                <RStyle.RFill color={mapStyles.loteSelecionado + "10"} />
              </RStyle.RStyle>
            </RFeature>
          </RLayerVector>
        )}
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
        <RLayerVector>
        </RLayerVector>
      </RMap>
    </IonContent>
  );
}
