import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import {
  IonFabButton,
  IonIcon,
  useIonLoading,
  useIonToast,
} from "@ionic/react";
import { downloadOutline } from "ionicons/icons";
import { getAsGeojson, getLayerList } from "../../services/db";
import { getCurrentDateYYYYMMDDHHMMSS } from "../../utils/getCurrentDateYYYYMMDDHHMMSS";

export default function SaveAndShare() {
  const [presentToast] = useIonToast();
  const [presentLoading, dismissLoading] = useIonLoading();

  function toast(message: string) {
    presentToast({
      message: message,
      duration: 2000,
      position: "bottom",
    });
  }

  async function createFile(
    filePath: string,
    nomeArquivo: string,
    conteudo: string,
  ) {
    await Filesystem.writeFile({
      path: `${filePath}/${nomeArquivo}`,
      data: conteudo,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
      recursive: true,
    });
  }

  async function salvarArquivosNoDispositivo() {
    presentLoading({ message: "Copiando arquivos para o dispositivo" });

    try {
      const filePath = `${getCurrentDateYYYYMMDDHHMMSS()}_SIGA`;

      const layer = await getLayerList();

      for await (const l of layer) {
        const geojson = await getAsGeojson(l.layer);

        createFile(filePath, l.layer + ".geojson", JSON.stringify(geojson));
      }

      alert(
        `Arquivos brutos copiados com sucesso para Armazenamento Interno/${Directory.Documents}/${filePath} \n\nUtilize um cabo USB para copiar os arquivos para o computador`,
      );
    } catch (error) {
      toast("Erro ao copiar os arquivos: " + error);
    } finally {
      dismissLoading();
    }
  }

  return (
    <IonFabButton
      size="small"
      color={"primary"}
      onClick={salvarArquivosNoDispositivo}
    >
      <IonIcon icon={downloadOutline}></IonIcon>
    </IonFabButton>
  );
}
