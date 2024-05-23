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
  IonTitle,
  useIonAlert,
} from "@ionic/react";
import { downloadOutline, eye, eyeOff, reloadCircle } from "ionicons/icons";
import { useEffect, useState } from "react";
import { useHistory } from "react-router";
import BackButton from "../../components/BackButton";
import { useApp } from "../../contexts/AppContext";
import { useLoading } from "../../hooks/useLoading";
import { Basemap, FeatureType } from "../../interfaces";
import { getLayerList, insertFeature, insertLayer } from "../../services/db";
import { getFeatureType, getFeatureTypes, getLayerStyle } from "../../services/geoserver";

export default function LayerManager() {
  const { basemaps, setBasemaps } = useApp();
  const { loading, setLoading } = useLoading();
  const history = useHistory();
  const [onlineLayers, setOnlineLayers] = useState<FeatureType[]>();
  const [localLayers, setLocalLayers] = useState<string[]>();

  const [presentAlert] = useIonAlert();

  useEffect(() => {
    const state = history.location.state as any;
    if (state?.layer && state.boundingBox) {
      downloadLayer(state.layer, state.boundingBox).then(() => {
        history.push("/layers",{});
      });
    } else {
      async function fetchLayers() {
        setLoading({
          loading: true,
          message: "Buscando camadas disponíveis",
          progress: 0
        });
        try {
          const featureTypes = await getFeatureTypes();
          const localLayers = await getLayerList();
          setLocalLayers(localLayers.map( e => e.layer));
          setOnlineLayers(featureTypes.filter(e => !localLayers.map( e => e.layer).includes(e.name)));
        } catch (error) {
          console.error(error);
        } finally {
          setLoading({
            loading: false,
            message: "",
            progress: 0
          });
        }
      }
  
      fetchLayers();
    }
  }, [history.location.state]);
  
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
        const data = await getFeatureType(
          layer,
          startIndex,
          count,
          bbox,
        );
        if (!data.features || data.features.length === 0) {
          break;
        }

        await Promise.all(
          data.features.map(async (feature: any) => {
            await insertFeature(layer, feature);
            setLoading((current) => ({
              ...current,
              progress: startIndex / data.totalFeatures!,
            }));
          }),
        );

        if (data.features.length < count) {
          break;
        }

        startIndex += count;
      }

      localLayers ? localLayers.push(layer) : setLocalLayers([layer]);
      onlineLayers?.splice(onlineLayers.map(e => e.name).indexOf(layer), 1);

      const style = await getLayerStyle(layer)

      await insertLayer(layer, style);

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

  async function handleVisibilityToggler(layer: any) {}

  async function handleChangeBasemap(newBasemap: string) {
    console.log(newBasemap);

    const theBasemap = basemaps.basemaps.find(
      (basemap) => basemap.name === newBasemap,
    ) as Basemap;
    setBasemaps({
      active: theBasemap,
      basemaps: basemaps.basemaps,
    });
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
        <IonLoading isOpen={loading.loading} message={`Carregando`} />
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
                <IonLabel>{layer}</IonLabel>
                <IonButton
                  fill="clear"
                  onClick={() => handleDownloadLayer(layer)}
                >
                  <IonIcon icon={reloadCircle} color="medium" />
                </IonButton>
                <IonButton
                  fill="clear"
                  onClick={() => handleVisibilityToggler(layer)}
                >
                  <IonIcon icon={layer ? eye : eyeOff} color="medium" />
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
            // @ts-expect-error
            compareWith={(o1: Basemap, o2: Basemap) => {
              return o1.name === o2.name;
            }}
            onIonChange={(ev) => handleChangeBasemap(ev.detail.value)}
          >
            {basemaps.basemaps.map((basemap, index) => (
              <IonItem key={index}>
                <IonRadio key={basemap.name} value={basemap.name}>
                  {basemap.name}
                </IonRadio>
              </IonItem>
            ))}
          </IonRadioGroup>
        </IonList>
      </IonContent>
    </>
  );
}
