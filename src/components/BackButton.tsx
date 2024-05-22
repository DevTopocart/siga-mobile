import { IonButton } from "@ionic/react";
import { FaCaretLeft } from "react-icons/fa";
import { useHistory } from "react-router";

export default function BackButton(props: {
  customRoute?: string;
}) {
  const history = useHistory();

  return (
    <IonButton onClick={() => props.customRoute ? history.push(props.customRoute) : history.goBack()} color="medium" fill="clear">
      <FaCaretLeft />
      Voltar
    </IonButton>
  );
}
