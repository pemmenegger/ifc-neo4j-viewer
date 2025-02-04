import dynamic from 'next/dynamic';

//Dynamically import the IFC viewer component with no SSR
const IFCViewer = dynamic(() => import('../components/IFCViewer'), {
  ssr: false
});

// Dynamically import the Neo4j viewer component with no SSR
const Neo4jViewer = dynamic(() => import('../components/Neo4jViewer'), {
  ssr: false
});

export default function Home() {
  return (
    <div className="app-container">
      <div className="bim-viewer">
        <IFCViewer />
      </div>
      <div className="graph-container">
        <Neo4jViewer />
      </div>
    </div>
  );
} 