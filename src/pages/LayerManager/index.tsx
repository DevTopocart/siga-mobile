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
  useIonAlert
} from "@ionic/react";
import { downloadOutline } from "ionicons/icons";
import { useEffect, useState } from "react";
import BackButton from "../../components/BackButton";
import { useApp } from "../../contexts/AppContext";
import { useLoading } from "../../hooks/useLoading";
import { Basemap, FeatureType } from "../../interfaces";
import { insertFeature } from "../../services/db";
import { fetchFeatureType, getFeatureTypes } from "../../services/geoserver";

export default function LayerManager() {
  const {  basemaps, setBasemaps } = useApp();
  const { loading, setLoading } = useLoading();
  const [ onlineLayers, setOnlineLayers ] = useState<FeatureType[]>();
  const [ stopDownload, setStopDownload ] = useState(false);

  const [presentAlert] = useIonAlert()
  
  useEffect(() => {
    if (!onlineLayers) {

      fetchLayers().then( layers => {
        setOnlineLayers(layers)
      })
    }
  },[])
  
  async function fetchLayers() {
    try {
      setLoading({
        loading: true,
        message: "Buscando camadas disponíveis",
        progress: 0
      })
      const featureTypes = await getFeatureTypes()
      return featureTypes
    } catch (error) {
      throw error
    } finally {
      setLoading({
        loading: false,
        message: "",
        progress: 0
      })
    }
  }

  async function handleDownloadLayer(layer: FeatureType) {

    try {
      setLoading({
        loading: true,
        message: "Baixando camada",
        progress: 0
      })
      let startIndex = 0;
      const count = 100; 
  
      while (true) {
        const data = await fetchFeatureType(layer.name, startIndex, count);
        if (!data.features || data.features.length === 0) {
          break;
        }

        await Promise.all(data.features.map(async (feature: any) => {
          await insertFeature(layer.name, feature);
          setLoading((current) => ({
            ...current,
            progress: startIndex / data.totalFeatures!
          }))
        }))
  
        if (data.features.length < count) {
          break;
        }
  
        startIndex += count; 
      }
  
      console.log("Downloaded all data successfully.");
    } catch (error) {
        console.error("Error while downloading layer", error);
        presentAlert(`Ops! Houve um erro ao baixar a camada: ${JSON.stringify(error).slice(0,1000)}...`)
    } finally {
      setLoading({
        loading: false,
        message: "",
        progress: 0
      })
    }
  }

  async function handleVisibilityToggler(layer: any) {

  }

  async function handleChangeBasemap(newBasemap: string) {
    console.log(newBasemap)

    const theBasemap = basemaps.basemaps.find(basemap => basemap.name === newBasemap) as Basemap
    setBasemaps({
      active: theBasemap,
      basemaps: basemaps.basemaps
    })
  }

  return (
    <>
    <IonHeader>
      {loading.loading && <IonProgressBar
        type={loading.progress !== 0 ? "determinate" : "indeterminate"}
        color="success"
        value={loading.progress}
      />}
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
        <BackButton />
        <IonTitle>Gerenciador de Camadas</IonTitle>
      </IonHeader>
      <IonList>
        <IonListHeader>
          <IonLabel>Camadas locais</IonLabel>
        </IonListHeader>
        {/* {localLayers &&
          localLayers.map((layer, index) => (
            <IonItem key={index}>
              <IonLabel>{layer.name}</IonLabel>
              <IonButton
                fill="clear"
                onClick={() => handleVisibilityToggler(layer)}
              >
                <IonIcon icon={layer.online ? eye : eyeOff} color="medium" />
              </IonButton>
            </IonItem>
          ))} */}
      </IonList>
      <IonList>
        <IonListHeader>
          <IonLabel>Camadas para download via Geoserver</IonLabel>
        </IonListHeader>
        {onlineLayers &&
          onlineLayers.map((layer, index) => {

            return <IonItem key={index} >
              <IonLabel>{layer.name}</IonLabel>
              <IonButton
                fill="clear"
                onClick={() => handleDownloadLayer(layer)}
              >
                <IonIcon icon={downloadOutline} />
              </IonButton>
            </IonItem>
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
        onIonChange={ (ev) => handleChangeBasemap(ev.detail.value)}
      >
        {basemaps.basemaps.map((basemap,index) => (
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
