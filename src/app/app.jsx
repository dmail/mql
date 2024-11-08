import { useLayoutEffect } from "preact/hooks";
import appStyleSheet from "./app.css" with { type: "css" };
import "./custom_elements_redefine.js";

import { MountainAndSkyBattleBackground } from "./battle_background_spritesheet.jsx";

export const App = () => {
  useLayoutEffect(() => {
    document.adoptedStyleSheets = [
      ...document.adoptedStyleSheets,
      appStyleSheet,
    ];
    return () => {
      document.adoptedStyleSheets = document.adoptedStyleSheets.filter(
        (s) => s !== appStyleSheet,
      );
    };
  }, []);

  return (
    <div
      className="app"
      style={{ position: "relative", height: "200px", width: "300px" }}
    >
      <div
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      >
        <MountainAndSkyBattleBackground />
      </div>
      <div style={{ position: "absolute" }}>
        <div style={{ display: "flex", height: "200px", alignItems: "center" }}>
          Top
        </div>
      </div>
    </div>
  );
};
