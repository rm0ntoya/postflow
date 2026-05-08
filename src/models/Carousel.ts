import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface ISegment {
  text: string;
  color: string;
}

export interface IElement {
  id: string;
  type: "text" | "image" | "shape" | "profile";
  text?: string;
  segments?: ISegment[];
  photoUrl?: string;
  imageUrl?: string;
  imagePrompt?: string;
  fontSize?: number;
  weight?: number;
  color?: string;
  font?: string;
  align?: string;
  shape?: string;
  radius?: number;
  opacity?: number;
  lineHeight?: number;
  letterSpacing?: number;
  backgroundSize?: "cover" | "contain" | "auto";
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ISlide {
  id: string;
  bgKey: string;
  bgOverride?: string;
  bgImageUrl?: string;
  bgThumbUrl?: string;
  bgSize?: "cover" | "contain";
  bgPositionX?: number;
  bgPositionY?: number;
  bgScale?: number;
  imagePrompt?: string;
  elements: IElement[];
}

export interface ICarousel extends Document {
  userId: Types.ObjectId;
  title: string;
  theme: string;
  accent: string;
  fontPair: string;
  accentColor?: string;
  viral?: boolean;
  imageSlides?: number[];
  slides: ISlide[];
  status: "draft" | "ready" | "published" | "generating" | "error";
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SegmentSchema = new Schema<ISegment>(
  { text: { type: String, required: true }, color: { type: String, required: true } },
  { _id: false }
);

const ElementSchema = new Schema<IElement>(
  {
    id: { type: String, required: true },
    type: { type: String, enum: ["text", "image", "shape", "profile"], required: true },
    text: String,
    segments: [SegmentSchema],
    photoUrl: String,
    imageUrl: String,
    imagePrompt: String,
    fontSize: Number,
    weight: Number,
    color: String,
    font: String,
    align: String,
    shape: String,
    radius: Number,
    opacity: Number,
    lineHeight: Number,
    letterSpacing: Number,
    backgroundSize: { type: String, enum: ["cover", "contain", "auto"], default: "cover" },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    w: { type: Number, required: true },
    h: { type: Number, required: true },
  },
  { _id: false }
);

const SlideSchema = new Schema<ISlide>(
  {
    id: { type: String, required: true },
    bgKey: { type: String, default: "noir" },
    bgOverride: String,
    bgImageUrl: String,
    bgThumbUrl: String,
    bgSize: { type: String, enum: ["cover", "contain"], default: "cover" },
    bgPositionX: { type: Number, default: 50 },
    bgPositionY: { type: Number, default: 50 },
    bgScale: { type: Number, default: 1 },
    imagePrompt: String,
    elements: [ElementSchema],
  },
  { _id: false }
);

const CarouselSchema = new Schema<ICarousel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    theme: { type: String, required: true, trim: true },
    accent: { type: String, default: "noir" },
    fontPair: { type: String, default: "modern" },
    accentColor: { type: String, default: "#FFD700" },
    viral: { type: Boolean, default: true },
    imageSlides: [Number],
    slides: [SlideSchema],
    status: {
      type: String,
      enum: ["draft", "ready", "published", "generating", "error"],
      default: "draft",
    },
    errorMessage: String,
  },
  { timestamps: true }
);

const Carousel: Model<ICarousel> =
  mongoose.models.Carousel ?? mongoose.model<ICarousel>("Carousel", CarouselSchema);

export default Carousel;
