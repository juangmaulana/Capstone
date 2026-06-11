import { Image } from './image.model';

export class Identification {
  constructor(
    public id: number,
    public confidence: number,
    public aiResponse: string,
    public isSuccess: boolean,
    public identifiedAt: Date,
    public notes?: string | null,
    public image?: Image,
    public plant?: {
      id: number,
      name: string,
    },
    public ranger?: {
      id: number,
      name: string,
    },
    public admin?: {
      id: number,
      name: string,
    },
  ) {
    if (confidence < 0 || confidence > 1) {
      throw new Error("Confidence must be between 0 and 1")
    }
  }
}
