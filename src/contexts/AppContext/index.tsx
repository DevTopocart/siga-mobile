import { SetStateAction, createContext, useContext, useState } from "react";
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
  const [basemaps,setBasemaps] = useState<Basemaps>({
    active: possibleBasemaps[0],
    basemaps: possibleBasemaps
  })

  return (
    <AppContext.Provider
      value={{
        basemaps,
        setBasemaps,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext)