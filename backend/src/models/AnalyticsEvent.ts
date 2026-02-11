import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalyticsEvent extends Document<mongoose.Types.ObjectId> {
    event: string;
    userId: mongoose.Types.ObjectId;
    data: any;
    sessionId?: string;
    source?: string;
    timestamp: Date;
    ip?: string;
    userAgent?: string;
}

const AnalyticsEventSchema: Schema = new Schema({
    event: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    data: { type: Schema.Types.Mixed },
    sessionId: { type: String },
    source: { type: String },
    timestamp: { type: Date, default: Date.now, index: true },
    ip: { type: String },
    userAgent: { type: String }
});

// Auto-expire events after 90 days to save space
AnalyticsEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default mongoose.model<IAnalyticsEvent>('AnalyticsEvent', AnalyticsEventSchema);
