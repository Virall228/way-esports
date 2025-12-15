import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
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

// Swagger/OpenAPI docs (serves /api-docs)
const openapiCandidates = [
  path.join(__dirname, 'docs', 'openapi.json'),
  path.join(process.cwd(), 'dist', 'docs', 'openapi.json'),
  path.join(process.cwd(), 'src', 'docs', 'openapi.json')
];
let openapiSpec: any = { openapi: '3.0.3', info: { title: 'WAY-Esports API', version: '1.0.0' } };
for (const candidate of openapiCandidates) {
  if (fs.existsSync(candidate)) {
    try {
      openapiSpec = JSON.parse(fs.readFileSync(candidate, 'utf-8'));
      break;
    } catch (err) {
      console.error('Failed to read OpenAPI spec:', err);
    }
  }
}
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

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

const PORT = typeof process.env.PORT === 'string' ? parseInt(process.env.PORT, 10) : 5000;
const PORT_NUMBER = Number.isFinite(PORT) ? PORT : 5000;
app.listen(PORT_NUMBER, () => {
    console.log(`Server is running on port: ${PORT_NUMBER}`);
});