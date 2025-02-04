"use client";

import { useEffect, useRef } from "react";
import * as WEBIFC from "web-ifc";
import * as BUI from "@thatopen/ui";
import * as OBC from "@thatopen/components";

const IfcLoaderComponent = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  let world: OBC.World<OBC.SimpleScene, OBC.SimpleCamera, OBC.SimpleRenderer>;
  let fragmentIfcLoader: OBC.IfcLoader;
  let fragments: OBC.FragmentsManager;

  useEffect(() => {
    if (!containerRef.current) return;

    const components = new OBC.Components();
    const worlds = components.get(OBC.Worlds);

    world = worlds.create<OBC.SimpleScene, OBC.SimpleCamera, OBC.SimpleRenderer>();
    world.scene = new OBC.SimpleScene(components);
    world.renderer = new OBC.SimpleRenderer(components, containerRef.current);
    world.camera = new OBC.SimpleCamera(components);

    components.init();
    world.camera.controls.setLookAt(12, 6, 8, 0, 0, -10);
    world.scene.setup();

    const grids = components.get(OBC.Grids);
    grids.create(world);

    world.scene.three.background = null;

    fragments = components.get(OBC.FragmentsManager);
    fragmentIfcLoader = components.get(OBC.IfcLoader);
    fragmentIfcLoader.setup();

    const excludedCats = [
      WEBIFC.IFCTENDONANCHOR,
      WEBIFC.IFCREINFORCINGBAR,
      WEBIFC.IFCREINFORCINGELEMENT,
    ];
    for (const cat of excludedCats) {
      fragmentIfcLoader.settings.excludedCategories.add(cat);
    }
    fragmentIfcLoader.settings.webIfc.COORDINATE_TO_ORIGIN = true;
  }, []);

  const loadIfc = async () => {
    const file = await fetch(
      "https://thatopen.github.io/engine_components/resources/small.ifc"
    );
    const data = await file.arrayBuffer();
    const buffer = new Uint8Array(data);
    const model = await fragmentIfcLoader.load(buffer);
    model.name = "example";
    world.scene.three.add(model);
  };

  const exportFragments = async () => {
    if (!fragments.groups.size) return;
    const group = Array.from(fragments.groups.values())[0];
    const data = fragments.export(group);
    download(new File([new Blob([data])], "small.frag"));
    const properties = group.getLocalProperties();
    if (properties) {
      download(new File([JSON.stringify(properties)], "small.json"));
    }
  };

  const download = (file: File) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const disposeFragments = () => {
    fragments.dispose();
  };

  return (
    <div>
      <div ref={containerRef} style={{ width: "100%", height: "600px" }} />
      <div style={{ marginTop: "10px" }}>
        <button onClick={loadIfc}>Load IFC</button>
        <button onClick={exportFragments}>Export Fragments</button>
        <button onClick={disposeFragments}>Dispose Fragments</button>
      </div>
    </div>
  );
};

export default IfcLoaderComponent;
