export class Identification {
  constructor(
    public id: number,
    public imageId: number,
    public plantId: number,
    public confidence: number,
    public aiResponse: string,
    public isSuccess: boolean,
    public identifiedAt: Date,
  ) {
    if (confidence < 0 || confidence > 1) {
      throw new Error("Confidence must be between 0 and 1")
    }
  }
}