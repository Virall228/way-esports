import mongoose, { Schema, Document } from 'mongoose';

export interface INews extends Document {
  title: string;
  content: string;
  author: mongoose.Types.ObjectId;
  game: string;
  tags?: string[];
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NewsSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    game: {
      type: String,
      required: true,
    },
    tags: [String],
    imageUrl: String,
  },
  {
    timestamps: true,
  }
);

NewsSchema.index({ game: 1, createdAt: -1 });

export const News = mongoose.model<INews>('News', NewsSchema); 