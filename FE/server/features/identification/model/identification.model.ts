import { Image } from './image.model';

export class Identification {
  constructor(
    public id: number,
    public confidence: number,
    public aiResponse: string | null,
    public isSuccess: boolean | null,
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
    public uploader?: {
      id: number,
      name: string,
    },
    public admin?: {
      id: number,
      name: string,
      email?: string | null,
    },
  ) {
    if (confidence < 0 || confidence > 1) {
      throw new Error("Confidence must be between 0 and 1")
    }
  }
}
