import mongoose from 'mongoose';

const articleSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String },
  content: { type: String },
  url: { type: String, required: true, unique: true },
  image_url: { type: String },
  source: { type: String, required: true },
  source_logo: { type: String },
  category: { type: String },
  published_at: { type: String },
  scraped_at: { type: String, required: true },
  is_active: { type: Number, default: 1 },
});

export const Article = mongoose.models.Article || mongoose.model('Article', articleSchema);

export async function connectNewsDB() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI!);
}
