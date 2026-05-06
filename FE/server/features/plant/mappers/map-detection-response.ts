export function mapDetectionResponse(flask: any) {
  return {
    plants: flask.detections.map((d: any) => ({
      name: d.class,
      confidence: d.confidence,
      box: {
        height: d.bbox.height,
        width: d.bbox.width,
        x1: d.bbox.x1,
        x2: d.bbox.x2,
        y1: d.bbox.y1,
        y2: d.bbox.y2,
      },
      link: `/api/v1/plants?search=${encodeURIComponent(d.class)}`,
    })),
    meta: {
      processing_time_ms: Math.round(flask.processing_time * 1000),
    },
  };
}