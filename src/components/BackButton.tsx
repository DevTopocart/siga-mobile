import { IonButton } from "@ionic/react";
import { FaCaretLeft } from "react-icons/fa";
import { useHistory } from "react-router";

export default function BackButton() {
  const history = useHistory();

  return (
    <IonButton onClick={() => history.goBack()} color="medium" fill="clear">
      <FaCaretLeft />
      Voltar
    </IonButton>
  );
}
