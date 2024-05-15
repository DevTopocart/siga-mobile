import {
  IonButton,
  IonCol,
  IonContent,
  IonGrid,
  IonImg,
  IonRow,
} from "@ionic/react";

import { useState } from "react";
import { useHistory } from "react-router";
import { steps } from "./steps";
import { Card, Slider, styles } from "./styles";

export default function Intro() {
  const history = useHistory();

  const [currentSlide, setCurrentSlide] = useState(0);

  function closeIntroduction() {
    history.push("/map");
  }

  function nextSlide(value: number) {
    if (value < steps.length - 1) {
      setCurrentSlide(value + 1);
    } else {
      closeIntroduction();
    }
  }

  return (
    <IonContent>
      <Slider currentSlide={currentSlide}>
        {steps.map((item) => (
          <Card key={item.id}>
            <IonGrid className="ion-align-items-center" style={styles}>
              <IonRow>
                <IonCol className="ion-text-center">
                  <IonImg src={item.image as string}></IonImg>
                </IonCol>
              </IonRow>
            </IonGrid>
            <IonGrid className="ion-align-items-center" style={styles}>
              <IonRow>
                <IonCol className="ion-text-center">
                  <h1>{item.title}</h1>
                </IonCol>
              </IonRow>
              <IonRow style={{ width: "80%" }}>
                <IonCol className="ion-text-center">
                  <p>{item.description}</p>
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol className="ion-text-center">
                  <IonButton
                    expand="block"
                    color="primary"
                    onClick={() => nextSlide(currentSlide)}
                  >
                    Continuar
                  </IonButton>
                </IonCol>
              </IonRow>
              {item.next && (
                <IonRow>
                  <IonCol className="ion-text-center">
                    <IonButton
                      expand="block"
                      fill="clear"
                      onClick={() => closeIntroduction()}
                    >
                      Pular introdução
                    </IonButton>
                  </IonCol>
                </IonRow>
              )}
            </IonGrid>
          </Card>
        ))}
      </Slider>
    </IonContent>
  );
}
