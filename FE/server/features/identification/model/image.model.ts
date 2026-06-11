export class Image {
  constructor(
    public id: number,
    public name: string,
    public path: string,
    public size: number,
    public latitude: number,
    public longitude: number,
    public elevation: number,
    public bb_x1: number,
    public bb_x2: number,
    public bb_y1: number,
    public bb_y2: number,
    public uploadedAt: Date,
    public uploader?: {
      id: number,
      name: string,
    },
  ) {
    if (size < 0) {
      throw new Error("size must be >= 0")
    }

    if (latitude < -90 || latitude > 90) {
      throw new Error("latitude must be between -90 and 90")
    }

    if (longitude < -180 || longitude > 180) {
      throw new Error("longitude must be between -180 and 180")
    }

    if (elevation < 0 || elevation > 2000) {
      throw new Error("elevation must be between 0 and 2000")
    }
  }
}