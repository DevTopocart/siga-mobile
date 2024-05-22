import { SetStateAction, createContext, useContext, useState } from "react";
import { RView } from "rlayers/RMap";
import { basemaps as possibleBasemaps } from "../../basemaps";
import { Basemaps } from "../../interfaces";

interface IAppContext {
  [key: string]: any;
  basemaps: Basemaps;
  setBasemaps: React.Dispatch<SetStateAction<Basemaps>>;
}

export const AppContext = createContext<IAppContext>({
  basemaps: {
    active: possibleBasemaps[0],
    basemaps: possibleBasemaps,
  },
  setBasemaps: () => {},
});

export function AppProvider({ children }: any) {
  const [basemaps, setBasemaps] = useState<Basemaps>({
    active: possibleBasemaps[0],
    basemaps: possibleBasemaps,
  });

  
  const initialView = {
    center: [-4932263.369981612, -2631855.098882083],
    zoom: 15.86196947686721,
    resolution: 2.6284828255507837,
  };
  const [view, setView] = useState<RView>(initialView);

  return (
    <AppContext.Provider
      value={{
        basemaps,
        setBasemaps,
        view,
        setView,
        initialView
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
