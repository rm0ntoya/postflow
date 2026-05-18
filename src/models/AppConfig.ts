import mongoose, { Document, Model, Schema } from "mongoose";

export interface IAppConfig extends Document {
  key: "singleton";
  maintenanceMode: boolean;
  maintenanceBanner: string;
  announcementBanner: string;
  announcementActive: boolean;
  // Mercado Pago
  mpAccessToken: string;
  mpPublicKey: string;
  mpWebhookSecret: string;
  mpEnabled: boolean;
  mpProPriceReais: number;
  mpStudioPriceReais: number;
  trialDays: number;
  // reCAPTCHA
  recaptchaSiteKey: string;
  recaptchaSecretKey: string;
  recaptchaEnabled: boolean;
}

const AppConfigSchema = new Schema<IAppConfig>({
  key: { type: String, default: "singleton", unique: true },
  maintenanceMode: { type: Boolean, default: false },
  maintenanceBanner: { type: String, default: "Estamos em manutenção. Voltamos em breve." },
  announcementBanner: { type: String, default: "" },
  announcementActive: { type: Boolean, default: false },
  mpAccessToken: { type: String, default: "" },
  mpPublicKey: { type: String, default: "" },
  mpWebhookSecret: { type: String, default: "" },
  mpEnabled: { type: Boolean, default: false },
  mpProPriceReais: { type: Number, default: 97 },
  mpStudioPriceReais: { type: Number, default: 149 },
  trialDays: { type: Number, default: 7 },
  recaptchaSiteKey: { type: String, default: "" },
  recaptchaSecretKey: { type: String, default: "" },
  recaptchaEnabled: { type: Boolean, default: false },
});

export async function getAppConfig(): Promise<IAppConfig> {
  const cfg = await AppConfig.findOneAndUpdate(
    { key: "singleton" },
    { $setOnInsert: { key: "singleton" } },
    { upsert: true, new: true }
  );
  return cfg!;
}

const AppConfig: Model<IAppConfig> =
  mongoose.models.AppConfig ?? mongoose.model<IAppConfig>("AppConfig", AppConfigSchema);

export default AppConfig;
