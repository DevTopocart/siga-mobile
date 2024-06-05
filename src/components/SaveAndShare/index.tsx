import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import {
  IonFabButton,
  IonIcon,
  useIonLoading,
  useIonToast,
} from "@ionic/react";
import { downloadOutline } from "ionicons/icons";
import { getAsGeojson, getLayerList } from "../../services/db";

const ambiente = "producao";
const municipio = "angra_dos_reis";

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

  function getCurrentDateYYYYMMDDHHMMSS() {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hour = date.getHours().toString().padStart(2, "0");
    const minute = date.getMinutes().toString().padStart(2, "0");
    const second = date.getSeconds().toString().padStart(2, "0");
    return `${year}${month}${day}_${hour}${minute}${second}`;
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
      const logs: any = [];

      const filePath = `${getCurrentDateYYYYMMDDHHMMSS()}_${ambiente}_${municipio}`;

      const layer = await getLayerList();

      for await (const l of layer) {
        const geoImobiliario = await getAsGeojson(l.layer);

        createFile(
          filePath,
          l.layer + ".geojson",
          JSON.stringify(geoImobiliario),
        );
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
