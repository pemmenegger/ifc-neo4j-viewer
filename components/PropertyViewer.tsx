import { useState } from 'react';

interface PropertyViewerProps {
  data: any;
  level?: number;
}

interface PropertyItemProps {
  name: string;
  value: any;
  level?: number;
}

function PropertyItem({ name, value, level = 0 }: PropertyItemProps) {
  const [isOpen, setIsOpen] = useState(true);
  const isObject = value && typeof value === 'object';

  const toggleOpen = () => setIsOpen(!isOpen);

  // If the value is an object and has a "value" property, display it directly
  if (isObject && 'value' in value) {
    return (
      <div style={{ marginLeft: `${level * 16}px` }} className="py-1">
        <span className="font-medium">{name}:</span>
        <span className="ml-1 text-neutral-300">{String(value.value)}</span>
      </div>
    );
  }

  // For nested objects
  if (isObject) {
    return (
      <div style={{ marginLeft: `${level * 16}px` }}>
        <div 
          onClick={toggleOpen} 
          className="flex items-center py-1 cursor-pointer hover:text-neutral-300"
        >
          <span className="mr-1">{isOpen ? '▼' : '▶'}</span>
          <span className="font-medium">{name}</span>
        </div>
        
        {isOpen && (
          <div className="ml-2">
            {Object.entries(value).map(([key, val]) => (
              <PropertyItem 
                key={key} 
                name={key} 
                value={val} 
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // For simple key-value pairs
  return (
    <div style={{ marginLeft: `${level * 16}px` }} className="py-1">
      <span className="font-medium">{name}:</span>
      <span className="ml-1 text-neutral-300">{String(value)}</span>
    </div>
  );
}

export default function PropertyViewer({ data }: PropertyViewerProps) {
  return (
    <div className="text-white text-sm max-h-[40vh] overflow-y-auto custom-scrollbar">
      {Object.entries(data).map(([key, value]) => (
        <PropertyItem key={key} name={key} value={value} />
      ))}
    </div>
  );
} 