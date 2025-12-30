import mongoose, { Document, Schema } from 'mongoose';

export interface INews extends Document {
  title: string;
  content: string;
  summary: string;
  author: mongoose.Types.ObjectId;
  category: 'tournament' | 'team' | 'game' | 'announcement' | 'other';
  tags: string[];
  coverImage?: string;
  game?: 'Critical Ops' | 'CS2' | 'PUBG Mobile';
  relatedTournament?: mongoose.Types.ObjectId;
  relatedTeam?: mongoose.Types.ObjectId;
  views: number;
  likes: number;
  comments: {
    user: mongoose.Types.ObjectId;
    content: string;
    createdAt: Date;
  }[];
  status: 'draft' | 'published' | 'archived';
  publishDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const newsSchema = new Schema<INews>({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    required: true,
    maxlength: 200
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: ['tournament', 'team', 'game', 'announcement', 'other'],
    required: true
  },
  tags: [{
    type: String
  }],
  coverImage: {
    type: String
  },
  game: {
    type: String,
    enum: ['Critical Ops', 'CS2', 'PUBG Mobile']
  },
  relatedTournament: {
    type: Schema.Types.ObjectId,
    ref: 'Tournament'
  },
  relatedTeam: {
    type: Schema.Types.ObjectId,
    ref: 'Team'
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  comments: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  publishDate: {
    type: Date
  }
}, {
  timestamps: true
});

newsSchema.index({ status: 1, publishDate: -1 });
newsSchema.index({ category: 1 });
newsSchema.index({ game: 1 });
newsSchema.index({ tags: 1 });

newsSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

export default mongoose.model<INews>('News', newsSchema);
