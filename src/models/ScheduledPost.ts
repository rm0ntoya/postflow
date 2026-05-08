import mongoose, { Document, Model, Schema } from "mongoose";

export interface IIdea {
  id: string;
  title: string;
  description: string;
  tone: string;
  hook?: string;
  status: "pending" | "done";
  carouselId?: string;
}

export interface IScheduledPost extends Document {
  userId: string;
  date: Date;
  niche: string;
  objective: string;
  ideas: IIdea[];
  createdAt: Date;
}

const IdeaSchema = new Schema<IIdea>({
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  tone: { type: String, default: "direct" },
  hook: { type: String },
  status: { type: String, enum: ["pending", "done"], default: "pending" },
  carouselId: { type: String },
}, { _id: false });

const ScheduledPostSchema = new Schema<IScheduledPost>(
  {
    userId: { type: String, required: true, index: true },
    date: { type: Date, required: true },
    niche: { type: String, required: true },
    objective: { type: String, required: true },
    ideas: { type: [IdeaSchema], default: [] },
  },
  { timestamps: true }
);

ScheduledPostSchema.index({ userId: 1, date: 1 });

const ScheduledPost: Model<IScheduledPost> =
  mongoose.models.ScheduledPost ?? mongoose.model<IScheduledPost>("ScheduledPost", ScheduledPostSchema);

export default ScheduledPost;
