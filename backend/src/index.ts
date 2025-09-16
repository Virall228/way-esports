import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import newsRouter from '../routes/news';
import usersRouter from '../routes/users';
import withdrawalsRouter from '../routes/withdrawals';
import tournamentsRouter from '../routes/tournaments';
// other route imports...

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/way-esports', {
    // useNewUrlParser: true, // no longer needed
    // useUnifiedTopology: true // no longer needed
}).then(() => {
    console.log('MongoDB database connection established successfully');
}).catch((err) => {
    console.error('MongoDB connection error:', err);
});

// Routes
// app.use('/api/auth', authRouter);
app.use('/api/tournaments', tournamentsRouter);
// app.use('/api/users', usersRouter);
// app.use('/api/teams', teamsRouter);
app.use('/api', newsRouter);
app.use('/api', usersRouter);
app.use('/api', withdrawalsRouter);


// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
}); 