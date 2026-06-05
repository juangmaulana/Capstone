"use client";

import dynamic from 'next/dynamic';
const GISMap = dynamic(() => import("@/components/GISMap").then(mod => mod.GISMap), { ssr: false });

export default function MapExplorer() {
  return (
    <div className="h-[calc(100vh-64px)] w-full">
      <GISMap />
    </div>
  );
}
