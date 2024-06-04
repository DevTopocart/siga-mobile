import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonTitle,
} from "@ionic/react";
import { caretForward } from "ionicons/icons";
import { useHistory } from "react-router";
import BackButton from "../../components/BackButton";
import { Features } from "../../interfaces";

export default function List() {
  const history = useHistory();
  // @ts-ignore
  const list: Array<Features> = JSON.parse(history.location.state.features);

  function handleFeature(feature: { [key: string]: any }) {
    history.push("/details", { feature });
  }

  function getNameLabelPrimary(feature: { [key: string]: any }) {
    return feature.fid ? feature.fid.split(".")[0] : "null";
  }

  function getNameLabelSecondary(feature: { [key: string]: any }) {
    const firstKey = Object.keys(feature.properties).find(
      (key) => key !== "bbox" && key !== "geometry",
    );
    return firstKey
      ? `${firstKey}: ${JSON.stringify(feature.properties[firstKey])}`
      : "null";
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

        <IonTitle>Lista de feições</IonTitle>
      </IonHeader>

      <IonList>
        {list &&
          list.map((feature: { [key: string]: any }, index: number) => (
            <IonItem key={index} onClick={() => handleFeature(feature)}>
              <IonLabel>{getNameLabelPrimary(feature)}</IonLabel>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <IonLabel>{getNameLabelSecondary(feature)}</IonLabel>
                <IonButton fill="clear">
                  <IonIcon icon={caretForward} color={"medium"} />
                </IonButton>
              </div>
            </IonItem>
          ))}
      </IonList>
    </IonContent>
  );
}
