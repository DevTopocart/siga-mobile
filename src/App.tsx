import React from "react";
import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { Redirect, Route } from "react-router-dom";

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/react/css/display.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/padding.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";

/* Theme variables */
import { AppProvider } from "./contexts/AppContext";
import Details from "./pages/Details";
import Intro from "./pages/Intro";
import LayerManager from "./pages/LayerManager";
import List from "./pages/List";
import Map from "./pages/Map";
import "./theme/globals.css";
import "./theme/variables.css";

/* Import Pages */

setupIonicReact();

export default function App() {
  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <AppProvider>
            <Route exact path="/intro">
              <Intro />
            </Route>
            <Route exact path="/map">
              <Map />
            </Route>
            <Route exact path="/layers">
              <LayerManager />
            </Route>
            <Route exact path="/details">
              <Details />
            </Route>
            <Route exact path="/list">
              <List />
            </Route>
            <Route exact path="/">
              <Redirect to="/intro" />
            </Route>
          </AppProvider>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
}
