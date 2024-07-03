import { Network } from "@capacitor/network";
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonLoading,
  IonProgressBar,
  IonRadio,
  IonRadioGroup,
  IonText,
  IonTitle,
  useIonAlert,
} from "@ionic/react";
import {
  addOutline,
  download,
  downloadOutline,
  eye,
  eyeOff,
  layersOutline,
} from "ionicons/icons";
import { useEffect, useState } from "react";
import { useHistory } from "react-router";
import BackButton from "../../components/BackButton";
import { useApp } from "../../contexts/AppContext";
import { useTilesDevice } from "../../hooks/useTilesDevice";
import { Basemap, FeatureType, LayerMetadata } from "../../interfaces";
import {
  getLayerList,
  insertFeature,
  insertLayer,
  postActiveBasemap,
  setLayerVisibility,
} from "../../services/db";
import {
  getFeatureType,
  getFeatureTypes,
  getLayerStyle,
} from "../../services/geoserver";
import { getTMSTiles } from "../../utils/mercatorToTileXY";

export default function LayerManager() {
  const { basemaps, setBasemaps } = useApp();

  const history = useHistory();
  const [onlineLayers, setOnlineLayers] = useState<FeatureType[]>();
  const [localLayers, setLocalLayers] = useState<LayerMetadata[]>();

  const [presentAlert] = useIonAlert();

  const tilesDevice = useTilesDevice();

  const { setLoading, loading } = tilesDevice;

  async function fetchOrtofotos(state: {
    url: string;
    boundingBox: [number, number, number, number];
    name: string;
  }) {
    await downloadOrtofotos(state);
  }

  useEffect(() => {
    const state = history.location.state as any;

    if (state?.url) {
      fetchOrtofotos(state);

      return;
    } else if (state?.layer && state.boundingBox && !state.url) {
      downloadLayer(state.layer, state.boundingBox).then(() => {
        history.push("/layers", {});
      });
    } else {
      async function fetchLayers() {
        setLoading({
          loading: true,
          message: "Buscando camadas disponíveis",
          progress: 0,
        });
        try {
          const featureTypes = await getFeatureTypes();
          const localLayers = await getLayerList();
          setLocalLayers(localLayers);
          setOnlineLayers(
            featureTypes.filter(
              (e) => !localLayers.map((e) => e.layer).includes(e.name),
            ),
          );
        } catch (error) {
          console.error(error);
        } finally {
          setLoading({
            loading: false,
            message: "",
            progress: 0,
          });
        }
      }

      fetchLayers();
    }
  }, [history.location.state]);

  async function downloadOrtofotos(state: {
    url: string;
    boundingBox: [number, number, number, number];
    name: string;
  }) {
    await tilesDevice.fetchTilesFromLote(
      [
        {
          url: state.url,
          extensao: "png",
          name: state.name,
        },
      ],
      getTMSTiles({
        minX: state.boundingBox[0],
        minY: state.boundingBox[1],
        maxX: state.boundingBox[2],
        maxY: state.boundingBox[3],
      }),
    );
  }

  async function downloadLayer(
    layer: string,
    bbox: [number, number, number, number],
  ) {
    try {
      setLoading({
        loading: true,
        message: "Baixando camada",
        progress: 0,
      });
      let startIndex = 0;
      const count = 100;

      while (true) {
        const data = await getFeatureType(layer, startIndex, count, bbox);
        if (!data.features || data.features.length === 0) {
          presentAlert("Nenhuma feição foi encontrada nesta área");
          return;
        }

        await Promise.all(
          data.features.map(async (feature: any) => {
            await insertFeature(layer, feature);
            setLoading({
              ...loading,
              progress: startIndex / data.totalFeatures!,
            });
          }),
        );

        if (data.features.length < count) {
          break;
        }

        startIndex += count;
      }

      const style = await getLayerStyle(layer);

      await insertLayer(layer, style);
      remakeLayerList();
    } catch (error) {
      console.error("Error while downloading layer", error);
      presentAlert(
        `Ops! Houve um erro ao baixar a camada: ${JSON.stringify(error).slice(
          0,
          1000,
        )}...`,
      );
    } finally {
      setLoading({
        loading: false,
        message: "",
        progress: 0,
      });
    }
  }

  async function handleDownloadLayer(layer: string) {
    history.push(`/map`, {
      layer: layer,
    });
  }

  async function handleDownloadOrtofoto(item: { name: string; url: string }) {
    history.push(`/map`, {
      url: item.url,
      name: item.name,
    });
  }

  async function handleVisibilityToggler(layer: any) {
    try {
      let theLayer = localLayers?.find((e) => e.layer === layer.layer);
      setLayerVisibility(theLayer?.layer!, !theLayer?.is_visible);
      remakeLayerList();
    } catch (error) {
      presentAlert(
        `Ops! Houve um erro ao alterar a visibilidade da camada: ${JSON.stringify(
          error,
        ).slice(0, 1000)}...`,
      );
    }
  }

  async function remakeLayerList() {
    const layers = await getLayerList();
    setLocalLayers(layers);

    layers.forEach((layer) => {
      if (!onlineLayers?.map((e) => e.name).includes(layer.layer)) return;
      onlineLayers?.splice(
        onlineLayers.map((e) => e.name).indexOf(layer.layer),
        1,
      );
    });
  }

  async function handleChangeBasemap(newBasemap: string) {
    const theBasemap = basemaps.basemaps.find(
      (basemap) => basemap.name === newBasemap,
    ) as Basemap;

    await postActiveBasemap(newBasemap, "activeBasemap");

    setBasemaps({
      active: theBasemap,
      basemaps: basemaps.basemaps,
    });
  }

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

  function ortofotoOffline(item: string) {
    return tilesDevice.files.find((file: string) => file === item);
  }

  return (
    <>
      <IonHeader>
        {loading.loading && (
          <IonProgressBar
            type={loading.progress !== 0 ? "determinate" : "indeterminate"}
            color="success"
            value={loading.progress}
          />
        )}
      </IonHeader>
      <IonContent>
        <IonLoading isOpen={loading.loading} message={loading.message} />
        <IonHeader
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingRight: "10px",
          }}
        >
          <BackButton customRoute="/map" />
          <IonTitle>Gerenciador de Camadas</IonTitle>
        </IonHeader>
        <IonList>
          <IonListHeader>
            <IonLabel>Camadas locais</IonLabel>
          </IonListHeader>
          {localLayers &&
            localLayers.map((layer, index) => (
              <IonItem key={index}>
                <IonLabel>{layer.layer}</IonLabel>
                <IonButton
                  fill="clear"
                  onClick={() => handleDownloadLayer(layer.layer)}
                >
                  <IonIcon icon={addOutline} color="medium" />
                  <IonIcon icon={layersOutline} color="medium" />
                </IonButton>
                <IonButton
                  fill="clear"
                  onClick={() => handleVisibilityToggler(layer)}
                >
                  <IonIcon
                    icon={layer.is_visible ? eye : eyeOff}
                    color={layer.is_visible ? "success" : "medium"}
                  />
                </IonButton>
              </IonItem>
            ))}
        </IonList>
        <IonList>
          <IonListHeader>
            <IonLabel>Camadas para download via Geoserver</IonLabel>
          </IonListHeader>
          {onlineLayers &&
            onlineLayers.map((layer, index) => {
              return (
                <IonItem key={index}>
                  <IonLabel>{layer.name}</IonLabel>
                  <IonButton
                    fill="clear"
                    onClick={() => handleDownloadLayer(layer.name)}
                  >
                    <IonIcon icon={downloadOutline} />
                  </IonButton>
                </IonItem>
              );
            })}
        </IonList>
        <IonList>
          <IonListHeader>
            <IonLabel>Mapas base</IonLabel>
          </IonListHeader>
          <IonRadioGroup
            value={basemaps.active.name}
            // compareWith={(o1: Basemap, o2: Basemap) => {
            //   return o1.name === o2.name;
            // }}
            onIonChange={(ev) => handleChangeBasemap(ev.detail.value)}
          >
            {basemaps.basemaps.map((basemap, index) => (
              <IonItem key={index}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  <IonText>
                    {basemap.name}

                    <span
                      style={{
                        fontSize: "10px",
                      }}
                    >
                      {ortofotoOffline(basemap.name) && " (disponível offline)"}
                    </span>
                  </IonText>

                  {isConnected && (
                    <IonButton
                      fill="clear"
                      onClick={() => handleDownloadOrtofoto(basemap)}
                    >
                      <IonIcon icon={download} color="medium" />
                    </IonButton>
                  )}
                </div>
                <IonRadio
                  disabled={!ortofotoOffline(basemap.name) && !isConnected}
                  key={basemap.name}
                  value={basemap.name}
                  style={{ width: "10%" }}
                ></IonRadio>
              </IonItem>
            ))}
          </IonRadioGroup>
        </IonList>
      </IonContent>
    </>
  );
}
