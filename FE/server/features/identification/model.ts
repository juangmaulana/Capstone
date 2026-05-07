export class Identification {
  constructor(
    public id: number,
    public imageId: number,
    public plantId: number,
    public confidence: number,
    public aiResponse: string,
    public isSuccess: boolean,
    public identifiedAt: Date,
  ) {}
}
