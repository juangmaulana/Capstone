export class Identification {
  constructor(
    public id: number,
    public imageId: number | null,
    public plantId: number | null,
    public confidence: number,
    public aiResponse: string,
    public isSuccess: boolean,
    public identifiedAt: Date,
    public plantName?: string | null,
    public scientificName?: string | null,
    public imagePath?: string | null,
    public imageName?: string | null,
    public imageSize?: number | null,
    public imageLatitude?: number | null,
    public imageLongitude?: number | null,
    public imageElevation?: number | null,
    public imageUploadedAt?: Date | null,
    public rangerId?: number | null,
    public rangerName?: string | null,
    public uploadedBy?: number | null,
    public uploaderName?: string | null,
  ) {
    if (confidence < 0 || confidence > 1) {
      throw new Error("Confidence must be between 0 and 1")
    }
  }
}
