import dynamic from "next/dynamic";
import { useState } from "react";

//Dynamically import the IFC viewer component with no SSR
const IFCViewer = dynamic(() => import("../components/IFCViewer"), {
  ssr: false,
});

// Dynamically import the Neo4j viewer component with no SSR
const Neo4jViewer = dynamic(() => import("../components/Neo4jViewer"), {
  ssr: false,
});

export default function Home() {
  const [guid, setGuid] = useState<string>();

  const handleElementSelect = (globalId: string | null) => {
    if (globalId) {
      console.log('Selected element GlobalId:', globalId);
      setGuid(globalId)
    } else {
      console.log('No element selected');
      setGuid(undefined)
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-1/2 h-full relative">
        <IFCViewer onElementSelect={handleElementSelect} />
      </div>
      <div className="w-1/2 h-full relative">
        <Neo4jViewer guid={guid} />
      </div>
    </div>
  );
}
