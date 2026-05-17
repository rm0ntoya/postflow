import mongoose, { Document, Model, Schema } from "mongoose";

export interface IAiContext {
  brandName: string;
  brandDescription: string;
  audience: string;
  tone: string;
  structure: string;
  themesYes: string[];
  themesNo: string[];
  rules: string;
  instagramHandle: string;
  instagramBio: string;
}

export interface IColorPalette {
  id: string;
  name: string;
  colors: string[];
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  encryptedGeminiKey?: string;
  geminiKeyIv?: string;
  geminiKeyAuthTag?: string;
  hasGeminiKey: boolean;
  textModel?: string;
  imageModel?: string;
  aiContext?: IAiContext;
  brandAccentColor?: string;
  colorPalettes?: IColorPalette[];
  faceReferenceImages?: string[];
  profileAvatarUrl?: string;
  isAdmin: boolean;
  isBanned: boolean;
  bannedReason?: string;
  bannedAt?: Date;
  plan: "free" | "pro";
  mpPaymentId?: string;
  planExpiresAt?: Date;
  trialEndsAt?: Date;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    encryptedGeminiKey: { type: String, select: false },
    geminiKeyIv: { type: String, select: false },
    geminiKeyAuthTag: { type: String, select: false },
    hasGeminiKey: { type: Boolean, default: false },
    textModel: { type: String, default: "gemini-2.0-flash" },
    imageModel: { type: String, default: "gemini-3-pro-image-preview" },
    aiContext: { type: Schema.Types.Mixed },
    brandAccentColor: { type: String, default: "#FFD700" },
    colorPalettes: { type: Schema.Types.Mixed, default: [] },
    faceReferenceImages: { type: [String], default: [], select: false },
    profileAvatarUrl: { type: String, default: "" },
    isAdmin: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    bannedReason: { type: String },
    bannedAt: { type: Date },
    plan: { type: String, enum: ["free", "pro"], default: "free" },
    mpPaymentId: { type: String },
    planExpiresAt: { type: Date },
    trialEndsAt: { type: Date },
  },
  { timestamps: true }
);

UserSchema.set("toJSON", {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: unknown, ret: any) => {
    delete ret.password;
    delete ret.encryptedGeminiKey;
    delete ret.geminiKeyIv;
    delete ret.geminiKeyAuthTag;
    return ret;
  },
});

const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);

export default User;
