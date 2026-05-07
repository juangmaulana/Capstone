/**
 * Maps Gradio /predict response to our API format.
 * 
 * Gradio returns result.data as an array:
 *   [0] = annotated image (FileData object with path, url, etc.)
 *   [1] = detection results array
 * 
 * Each detection has the format (in Bahasa Indonesia):
 *   { spesies: "Lantana camara", akurasi: 0.9223, bounding_box: [x1, y1, x2, y2] }
 */
export function mapDetectionResponse(gradioData: any) {
  try {
    if (!Array.isArray(gradioData) || gradioData.length < 2) {
      console.warn('Unexpected Gradio response format:', JSON.stringify(gradioData));
      return { plants: [], meta: { processing_time_ms: 0 } };
    }

    // data[1] contains the detection array
    const detections = gradioData[1];

    if (!Array.isArray(detections) || detections.length === 0) {
      return { plants: [], meta: { processing_time_ms: 0 } };
    }

    return {
      plants: detections.map((d: any) => {
        // Handle the Indonesian field names from the Gradio model
        const name = d.spesies || d.class || d.label || d.name || 'Unknown';
        const confidence = d.akurasi || d.confidence || d.score || 0;
        const bbox = d.bounding_box || d.bbox || null;

        return {
          name,
          confidence,
          box: bbox ? (
            Array.isArray(bbox) 
              ? {
                  x1: bbox[0] || 0,
                  y1: bbox[1] || 0,
                  x2: bbox[2] || 0,
                  y2: bbox[3] || 0,
                  width: (bbox[2] || 0) - (bbox[0] || 0),
                  height: (bbox[3] || 0) - (bbox[1] || 0),
                }
              : {
                  x1: bbox.x1 || 0,
                  y1: bbox.y1 || 0,
                  x2: bbox.x2 || 0,
                  y2: bbox.y2 || 0,
                  width: bbox.width || 0,
                  height: bbox.height || 0,
                }
          ) : null,
          link: `/api/v1/plants?search=${encodeURIComponent(name)}`,
        };
      }),
      meta: {
        processing_time_ms: 0,
      },
    };
  } catch (err) {
    console.error('Failed to map detection response:', err);
    return {
      plants: [],
      meta: { processing_time_ms: 0 },
    };
  }
}