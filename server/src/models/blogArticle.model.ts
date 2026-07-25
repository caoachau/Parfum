import mongoose from 'mongoose';

const blogSectionSchema = new mongoose.Schema(
  {
    heading: { type: String, trim: true },
    body: { type: String, required: true, trim: true },
    image: { type: String, trim: true },
    imageCaption: { type: String, trim: true },
  },
  { _id: false },
);

const blogArticleSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true },
    category: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    image: { type: String, required: true, trim: true },
    heroImage: { type: String, trim: true },
    date: { type: String, trim: true },
    readTime: { type: String, trim: true },
    author: { type: String, trim: true },
    sections: { type: [blogSectionSchema], default: [] },
    relatedSlugs: { type: [String], default: [] },
    status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
    publishedAt: Date,
    journalNotifiedAt: Date,
  },
  { timestamps: true },
);

export const BlogArticle = mongoose.model('BlogArticle', blogArticleSchema);
export default BlogArticle;
