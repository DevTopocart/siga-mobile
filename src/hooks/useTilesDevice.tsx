import { Photo } from "@capacitor/camera";
import { CapacitorHttp, HttpResponse } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import TileLayer from "ol/layer/Tile";
import { XYZ } from "ol/source";
import { RefObject, useEffect, useState } from "react";
import { RMap } from "rlayers";
import { useLoading } from "./useLoading";

interface BaseMap {
  url: string;
  extensao: string;
  name: string;
}

interface Position {
  x: number;
  y: number;
  z: number;
  "-y"?: number;
}

interface FetchTileOptions {
  url: string;
  x: number;
  y: number;
  z: number;
  extensao: string;
  name: string;
}

type LoadingState = {
  loading: boolean;
  message: string;
  progress: number;
};

interface UseTilesDevice {
  fetchTilesFromLote: (
    baseMaps: BaseMap[],
    positions: Position[],
  ) => Promise<void>;
  loadTilesFromDevice: (
    map: RefObject<RMap>,
    filePath: string,
  ) => Promise<void>;
  files: string[];
  loading: { loading: boolean; message: string; progress: number };
  setLoading: React.Dispatch<React.SetStateAction<LoadingState>>;
}

export function useTilesDevice(): UseTilesDevice {
  const { setLoading, loading } = useLoading();

  const diretorioTiles = "SIGA/diretorio_tiles";

  async function base64FromPath(path: string): Promise<string> {
    const response = await fetch(path);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject("O método não retornou uma string");
        }
      };
      reader.readAsDataURL(blob);
    });
  }

  async function savePicture(
    photo: Photo,
    fileName: string,
  ): Promise<{ filepath: string; webviewPath?: string }> {
    const base64Data = await base64FromPath(photo.webPath!);
    await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Documents,
      recursive: true,
    });

    return {
      filepath: fileName,
      webviewPath: photo.webPath,
    };
  }

  async function base64FromBlob(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject("O método não retornou uma string");
        }
      };
      reader.readAsDataURL(blob);
    });
  }

  async function fetchTilesFromLote(
    baseMaps: BaseMap[],
    positions: Position[],
  ): Promise<void> {
    if (!baseMaps) return;

    const endPoint = baseMaps[0].url;
    const extensao = baseMaps[0].extensao;
    const name = baseMaps[0].name;

    setLoading({
      loading: true,
      message: `Iniciando o download de tiles...`,
      progress: 0,
    });

    for (const [index, position] of positions.entries()) {
      console.log(
        `Baixando tile ${position.z}/${position.x}/${position.y}.${extensao}`,
      );

      setLoading({
        loading: true,
        message: `Baixando ${index + 1} de ${positions.length}`,
        progress: (index + 1) / positions.length,
      });

      try {
        await fetchTileCapacitor(
          endPoint
            .replace("{z}", position.z.toString())
            .replace("{x}", position.x.toString())
            .replace("{y}", position.y.toString())
            .replace("{-y}", position["-y"]?.toString() || ""),
          position.x,
          position.y,
          position.z,
          extensao,
          name,
        );
      } catch (error) {
        try {
          await fetchTile({
            url: endPoint
              .replace("{z}", position.z.toString())
              .replace("{x}", position.x.toString())
              .replace("{y}", position.y.toString())
              .replace("{-y}", position["-y"]?.toString() || ""),
            x: position.x,
            y: position.y,
            z: position.z,
            extensao,
            name,
          });
        } catch (error) {
          console.log(
            `Não foi possível baixar a tile ${position.z}/${position.x}/${position.y}.${extensao}`,
          );
        }
      }
    }

    await listFiles();

    setLoading({
      loading: false,
      message: `Tiles baixadas com sucesso`,
      progress: 100,
    });
  }

  async function fetchTileCapacitor(
    url: string,
    x: number,
    y: number,
    z: number,
    extensao: string,
    name: string,
  ): Promise<Photo | void> {
    try {
      console.log("fetchTileCapacitor", url);
      const imageResponse: HttpResponse = await CapacitorHttp.get({
        url,
        responseType: "blob",
        connectTimeout: 1000,
        readTimeout: 1000,
      });

      if (imageResponse.status !== 200) {
        return;
      }

      console.log(imageResponse);

      const imageBlob = await base64ToBlob(imageResponse.data, "image/png");

      const base64Data = await base64FromBlob(imageBlob);
      const image: Photo = {
        webPath: base64Data,
        format: "png",
        saved: true,
      };

      await savePicture(
        image,
        `${diretorioTiles}/${name}/${z}/${x}/${y}.${extensao}`,
      );

      return image;
    } catch (error) {
      throw error;
    }
  }

  async function fetchTile({
    url,
    x,
    y,
    z,
    extensao,
    name,
  }: FetchTileOptions): Promise<Photo | void> {
    try {
      console.log("fetchTile", url);
      const imageResponse = await (await fetch(url)).blob();

      const base64Data = await base64FromBlob(imageResponse);
      const image: Photo = {
        webPath: base64Data,
        format: "png",
        saved: true,
      };

      await savePicture(
        image,
        `${diretorioTiles}/${name}/${z}/${x}/${y}.${extensao}`,
      );

      return image;
    } catch (error) {
      throw error;
    }
  }

  async function base64ToBlob(
    base64Data: string,
    contentType: string = "",
  ): Promise<Blob> {
    try {
      const byteCharacters = atob(base64Data);
      const byteArrays = [];

      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);

        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }

      return new Blob(byteArrays, { type: contentType });
    } catch (error) {
      console.error("Erro ao converter base64 para Blob:", error);
      throw error;
    }
  }

  async function loadPicture(filepath: string): Promise<string | null> {
    try {
      const file = await Filesystem.readFile({
        path: filepath,
        directory: Directory.Documents,
      });

      return `data:image/png;base64,${file.data}`;
    } catch (error) {
      return null;
    }
  }

  async function loadTilesFromDevice(
    map: RefObject<RMap>,
    filePath: string,
  ): Promise<void> {
    const m = map.current?.ol;

    if (!m) {
      console.error("Não foi possível carregar a camada de basemaps offline");
      return;
    }
    const source = new XYZ({
      url: `diretorio_tiles/${filePath}/{z}/{x}/{y}.png`,
      maxZoom: 20,
      crossOrigin: "anonymous",
      tileLoadFunction: async (imageTile: any, src: string) => {
        imageTile.getImage().src = await loadPicture(src);
      },
    });

    const layerOptions = {
      source,
      zIndex: 12,
      visible: true,
    };

    const layer = new TileLayer(layerOptions);

    m.addLayer(layer);
  }

  const [files, setFiles] = useState<string[]>([]);

  async function listFiles() {
    try {
      const result = await Filesystem.readdir({
        path: diretorioTiles,
        directory: Directory.Documents,
      });
      setFiles(result.files.map((file) => file.name));
    } catch (e) {
      setFiles([]);
    }
  }

  useEffect(() => {
    listFiles();
  }, []);

  return {
    fetchTilesFromLote,
    loadTilesFromDevice,
    files,
    loading,
    setLoading,
  };
}
