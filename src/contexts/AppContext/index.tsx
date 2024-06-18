import {
  SetStateAction,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { RView } from "rlayers/RMap";
import { basemaps as possibleBasemaps } from "../../basemaps";
import { Basemaps } from "../../interfaces";
import { getActiveBasemap, makeDatabase } from "../../services/db";

interface IAppContext {
  basemaps: Basemaps;
  setBasemaps: React.Dispatch<SetStateAction<Basemaps>>;
  view: RView;
  setView: React.Dispatch<SetStateAction<RView>>;
  initialView: RView;
}

const initialView = {
  center: [-4932263.369981612, -2631855.098882083],
  zoom: 15.86196947686721,
  resolution: 2.6284828255507837,
};

export const AppContext = createContext<IAppContext>({
  basemaps: {
    active: possibleBasemaps[0],
    basemaps: possibleBasemaps,
  },
  setBasemaps: () => {},
  view: initialView,
  setView: () => {},
  initialView,
});

export function AppProvider({ children }: any) {
  const [basemaps, setBasemaps] = useState<Basemaps>({
    active: possibleBasemaps[0],
    basemaps: possibleBasemaps,
  });

  const [view, setView] = useState<RView>(initialView);

  async function initDatabase() {
    await makeDatabase();
  }

  useEffect(() => {
    async function findActiveBasemap() {
      await initDatabase();

      const activeBasemap = await getActiveBasemap("activeBasemap");

      if (activeBasemap) {
        setBasemaps({
          active: {
            name: activeBasemap,
            url: basemaps.basemaps.find(
              (basemap) => basemap.name === activeBasemap,
            )?.url!,
          },
          basemaps: basemaps.basemaps,
        });
      }
    }

    findActiveBasemap();
  }, []);

  return (
    <AppContext.Provider
      value={{
        basemaps,
        setBasemaps,
        view,
        setView,
        initialView,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
