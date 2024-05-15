import LayerManager from "./assets/button-layers.png";
import FileManager from "./assets/file-manager.png";
import Location from "./assets/location.png";
import Map from "./assets/map.png";
import Siga from "./assets/siga.png";

export const steps = [
  {
    id: "1",
    title: "Bem vindo",
    description:
      "Bem vindo ao SIGA Mobile. Esta introdução te auxiliará nos primeiros passos para coletar e produzir dados geográficos.",
    image: Siga,
    next: true,
    "data-history": "intro-1",
  },
  {
    id: "2",
    title: "Para começar",
    description:
      "Adicione arquivos .geojson em seu dispositivo para que sejam visualizados e editados pelo SIGA Mobile",
    image: FileManager,
    next: true,
    "data-history": "intro-2",
  },
  {
    id: "3",
    title: "Gerenciando informações",
    description:
      "Visualize e gerencie as camadas sendo exibidas clicando no ícone do Gerenciador de Camadas",
    image: LayerManager,
    next: true,
    "data-history": "intro-3",
  },
  {
    id: "4",
    title: "Coletando informações",
    description:
      "Selecione um elemento no mapa para abrir seus detalhes e começar o levantamento",
    image: Map,
    next: true,
    "data-history": "intro-4",
  },
  {
    id: "5",
    title: "Tudo certo",
    description:
      "Pronto! Agora você já pode começar a trabalhar no SIGA Mobile",
    image: Location,
    next: false,
    "data-history": "intro-5",
  },
];
