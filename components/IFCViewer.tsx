"use client";

import { useEffect, useRef, useState } from "react";
import * as WEBIFC from "web-ifc";
import * as OBC from "@thatopen/components";
import * as OBF from "@thatopen/components-front";
import * as FRAGS from "@thatopen/fragments";
import PropertyViewer from './PropertyViewer';

export default function IFCViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const [properties, setProperties] = useState<any>(null);

  let world: OBC.SimpleWorld<OBC.SimpleScene, OBC.SimpleCamera, OBC.SimpleRenderer>;
  let fragmentIfcLoader: OBC.IfcLoader;
  let fragments: OBC.FragmentsManager;
  let highlighter: OBF.Highlighter;

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

    highlighter = components.get(OBF.Highlighter);
    highlighter.setup({ world });

    highlighter.events.select.onHighlight.add(async (fragmentIdMap) => {
      const propertiesData = await computeTableData(components, fragmentIdMap);
      setProperties(propertiesData);
    });

    highlighter.events.select.onClear.add(() => setProperties(null));

    return () => {
      components?.dispose();
    };
  }, []);

  const loadSampleIfc = async () => {
    if (loadingRef.current) loadingRef.current.style.display = "block";
    try {
      const file = await fetch("https://thatopen.github.io/engine_components/resources/small.ifc");
      const data = await file.arrayBuffer();
      const buffer = new Uint8Array(data);
      const model = await fragmentIfcLoader.load(buffer);
      world.scene.three.add(model);
    } catch (error) {
      console.error("Error loading sample IFC:", error);
    } finally {
      if (loadingRef.current) loadingRef.current.style.display = "none";
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (loadingRef.current) loadingRef.current.style.display = "block";

    try {
      const buffer = await file.arrayBuffer();
      const model = await fragmentIfcLoader.load(new Uint8Array(buffer));
      world.scene.three.add(model);
    } catch (error) {
      console.error("Error loading uploaded IFC:", error);
    } finally {
      if (loadingRef.current) loadingRef.current.style.display = "none";
    }
  };

  const clearScene = () => {
    fragments.dispose();
    setProperties(null);
  };

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute top-5 left-5 z-10 flex items-center gap-2.5 bg-black/70 p-2.5 rounded">
        <button
          onClick={loadSampleIfc}
          className="px-2.5 py-1.5 rounded bg-neutral-700 text-white hover:bg-neutral-600 transition-colors"
        >
          Load Sample IFC
        </button>
        <input
          type="file"
          accept=".ifc"
          onChange={handleFileUpload}
          className="mx-2.5 text-white"
        />
        <button
          onClick={clearScene}
          className="px-2.5 py-1.5 rounded bg-neutral-700 text-white hover:bg-neutral-600 transition-colors"
        >
          Clear Scene
        </button>
      </div>
      <div
        ref={loadingRef}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/70 text-white px-5 py-2.5 rounded z-10"
        style={{ display: "none" }}
      >
        Loading model...
      </div>
      {properties && (
        <div className="absolute top-5 right-5 z-10 bg-black/90 p-4 rounded shadow-md max-w-md overflow-auto max-h-[80vh]">
          <h3 className="text-lg font-semibold mb-2 text-white">Element Properties</h3>
          <PropertyViewer data={properties} />
        </div>
      )}
    </div>
  );
}

async function computeTableData(components: OBC.Components, fragmentIdMap: FRAGS.FragmentIdMap) {
  const indexer = components.get(OBC.IfcRelationsIndexer);
  const fragments = components.get(OBC.FragmentsManager);
  const modelIdMap = fragments.getModelIdMap(fragmentIdMap);

  const propertiesData: { [key: string]: any } = {};

  for (const modelID in modelIdMap) {
    const model = fragments.groups.get(modelID);
    if (!model) continue;
    const expressIDs = modelIdMap[modelID];
    for (const expressID of expressIDs) {
      const elementAttrs = await model.getProperties(expressID);
      if (!elementAttrs) continue;
      propertiesData[elementAttrs.Name?.value || `Element ${expressID}`] = elementAttrs;
    }
  }

  return propertiesData;
}
