import {
  IonCheckbox,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonTitle,
} from "@ionic/react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import BackButton from "../../components/BackButton";
import { GeoserverGeoJSONFeature } from "../../interfaces";
import { getFeicao, updateFeicao } from "../../services/db";

export default function Details() {
  const location = useLocation();
  const { feature }: { feature?: any } = location.state || {};

  const [feicao, setFeicao] = useState<GeoserverGeoJSONFeature | null>(null);

  async function fetchData() {
    let data = await getFeicao(feature?.fid);
    data = JSON.parse(data);
    setFeicao(data);
  }

  useEffect(() => {
    fetchData();
  }, []);

  function handleChange(key: string, value: any) {
    if (!feicao) return;
    const updatedProperties: GeoserverGeoJSONFeature = {
      ...feicao.properties,
      type: feicao.type,
      id: feicao.id,
      geometry: feicao.geometry,
      geometry_name: feicao.geometry_name,
      properties: { ...feicao.properties, [key]: value },
    };
    setFeicao(updatedProperties);
    updateFeicao(feicao.id, updatedProperties);
  }

  function renderField(key: string, value: any) {
    let inputType = "text";

    if (value === null) {
      inputType = "text";
    } else {
      switch (typeof value) {
        case "string":
          inputType = "text";
          break;
        case "boolean":
          inputType = "checkbox";
          break;
        case "number":
          inputType = "number";
          break;
        default:
          return null;
      }
    }

    return (
      <IonItem key={key}>
        <IonLabel>{key}</IonLabel>
        {inputType === "text" && (
          <IonInput
            label={key}
            labelPlacement="stacked"
            clearInput={true}
            placeholder={`${key}`}
            value={value || ""}
            onIonChange={(e) => handleChange(key, e.detail.value)}
          />
        )}
        {inputType === "number" && (
          <IonInput
            type="number"
            label={key}
            labelPlacement="stacked"
            clearInput={true}
            placeholder={`${key}`}
            value={value}
            onIonChange={(e) => handleChange(key, parseFloat(e.detail.value!))}
          />
        )}
        {inputType === "checkbox" && (
          <IonCheckbox
            checked={value}
            onIonChange={(e) => handleChange(key, e.detail.checked)}
          />
        )}
      </IonItem>
    );
  }

  function getFirstNonBboxKey(properties: any) {
    for (const key in properties) {
      if (key !== "bbox") {
        return `${key}: ${properties[key]}`;
      }
    }
    return "";
  }

  return (
    <IonContent>
      <IonHeader
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingRight: "10px",
        }}
      >
        <BackButton customRoute="/map" />

        <IonTitle>
          <b
            style={{
              color: "#323232",
            }}
          >
            {feicao?.id.split(".")[0]}
          </b>{" "}
          &nbsp; | &nbsp;
          <span style={{ color: "#626262" }}>
            {feicao && getFirstNonBboxKey(feicao.properties)}
          </span>
        </IonTitle>
      </IonHeader>
      {feicao && (
        <IonList>
          {Object.keys(feicao.properties).map((key) =>
            renderField(key, feicao.properties[key]),
          )}
        </IonList>
      )}
    </IonContent>
  );
}
