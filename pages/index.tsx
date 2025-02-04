import dynamic from "next/dynamic";

//Dynamically import the IFC viewer component with no SSR
const IFCViewer = dynamic(() => import("../components/IFCViewer"), {
  ssr: false,
});

// Dynamically import the Neo4j viewer component with no SSR
const Neo4jViewer = dynamic(() => import("../components/Neo4jViewer"), {
  ssr: false,
});

export default function Home() {
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-1/2 h-full relative">
        <IFCViewer />
      </div>
      <div className="w-1/2 h-full relative">
        <Neo4jViewer />
      </div>
    </div>
  );
}
