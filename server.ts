import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { upscalerService } from './services/upscaler/upscalerService.js';
import { ProcessingJob } from './services/upscaler/types.js';
import { AnoModelId, ANO_MODELS } from './services/ai/types.js';
import { providerManager } from './services/ai/ProviderManager.js';
import { savedService } from './services/saved/savedService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Setup directories
const TEMP_DIR = path.join('/tmp', 'ano4k');
const UPLOADS_DIR = path.join(TEMP_DIR, 'uploads');
const OUTPUTS_DIR = path.join(TEMP_DIR, 'outputs');

if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(OUTPUTS_DIR)) fs.mkdirSync(OUTPUTS_DIR, { recursive: true });

// Configure Multer for secure file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `ano_${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1 GB maximum limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'video/mp4',
      'video/quicktime',
      'video/webm',
      'video/x-matroska',
      'image/jpeg',
      'image/png',
      'image/webp',
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.mp4', '.mov', '.webm', '.mkv', '.jpg', '.jpeg', '.png', '.webp'];

    if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('ANO 4K could not process this file format. Supported formats: MP4, MOV, WebM, MKV, JPG, PNG, WebP.'));
    }
  },
});

app.use(express.json());

// Helper: Extract userId from header or fallback
function getUserId(req: Request): string {
  const headerId = req.headers['x-user-id'] as string;
  if (headerId && typeof headerId === 'string' && headerId.trim().length > 0) {
    return headerId.trim();
  }
  return 'default_anonymous_user';
}

// API: Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    engine: upscalerService.getProviderName(),
    version: '5.5.0',
    maxVideoDurationSeconds: 120, // 2 minutes strict limit
    models: ANO_MODELS,
  });
});

// API: Video AI Provider Health Check
app.get('/api/ai/video/health', async (_req: Request, res: Response) => {
  const health = await providerManager.checkVideoHealth();
  res.json(health);
});

// API: Image AI Provider Health Check
app.get('/api/ai/image/health', async (_req: Request, res: Response) => {
  const health = await providerManager.checkImageHealth();
  res.json(health);
});

// Job Creation Handler
const createJobHandler = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: 'Please select a video or image file to upload.' });
    return;
  }

  const uploadedFile = req.file;
  const ext = path.extname(uploadedFile.originalname).toLowerCase();
  const isVideo = ['.mp4', '.mov', '.webm', '.mkv'].includes(ext) || uploadedFile.mimetype.startsWith('video/');
  const mediaType = isVideo ? 'video' : 'image';
  const requestedModel = (req.body.model as AnoModelId) || (isVideo ? 'ANO 5.5 Flash' : 'ANO 3.1 V2');

  // Verify model compatibility
  if (mediaType === 'video' && requestedModel === 'ANO 3.1 V2') {
    try { fs.unlinkSync(uploadedFile.path); } catch (e) {}
    res.status(400).json({ error: 'This model is designed for image enhancement.' });
    return;
  }
  if (mediaType === 'image' && requestedModel === 'ANO 5.5 Flash') {
    try { fs.unlinkSync(uploadedFile.path); } catch (e) {}
    res.status(400).json({ error: 'This model is designed for video enhancement.' });
    return;
  }

  const modelUsed: AnoModelId = requestedModel;

  try {
    // Media validation & analysis
    const metadata = await upscalerService.analyzeMedia(uploadedFile.path, mediaType);

    // CRITICAL 2-MINUTE STRICT VIDEO DURATION VALIDATION (120 seconds)
    if (mediaType === 'video' && metadata.duration && metadata.duration > 120.0) {
      try {
        fs.unlinkSync(uploadedFile.path);
      } catch (e) {}
      res.status(400).json({
        error: 'Maximum video length is 2 minutes.',
        duration: metadata.duration,
        durationFormatted: metadata.durationFormatted,
      });
      return;
    }

    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const newJob: ProcessingJob = {
      id: jobId,
      createdAt: Date.now(),
      mediaType,
      modelUsed,
      originalFilename: uploadedFile.originalname,
      sourceFilePath: uploadedFile.path,
      fileSize: uploadedFile.size,
      sourceMeta: metadata,
      targetMeta: {
        width: metadata.targetWidth,
        height: metadata.targetHeight,
        resolutionLabel: metadata.targetResolutionLabel,
        aspectRatio: metadata.aspectRatio,
      },
      status: 'queued',
      realStage: 'QUEUED',
      progress: 0,
      stage: 'Job Queued',
      stageDescription: `Job registered with ${modelUsed}. Initializing 4K super-resolution pipeline...`,
    };

    upscalerService.registerJob(newJob);

    // Trigger processing asynchronously in background
    setImmediate(() => {
      upscalerService.executeJob(jobId, OUTPUTS_DIR).catch((err) => {
        console.error(`Background job ${jobId} failed:`, err);
      });
    });

    res.status(201).json({
      jobId: newJob.id,
      status: newJob.status,
      stage: newJob.stage,
      stageDescription: newJob.stageDescription,
      job: newJob,
    });
  } catch (err: any) {
    console.error('Job creation error:', err);
    try {
      if (fs.existsSync(uploadedFile.path)) {
        fs.unlinkSync(uploadedFile.path);
      }
    } catch (e) {}

    res.status(400).json({
      error: err.message || 'ANO 4K could not analyze this file. Please verify the media is not corrupted.',
    });
  }
};

// API: Create processing job (supports both /api/upscale and /api/jobs)
app.post('/api/upscale', upload.single('media'), createJobHandler);
app.post('/api/jobs', upload.single('media'), createJobHandler);

// Job Status Query Handler
const getJobStatusHandler = (req: Request, res: Response): void => {
  const jobId = req.params.id;
  const job = upscalerService.getJobStatus(jobId);

  if (!job) {
    res.status(404).json({ error: 'Job not found or expired.' });
    return;
  }

  res.json({
    jobId: job.id,
    status: job.status,
    progress: job.progress,
    stage: job.stage,
    stageDescription: job.stageDescription,
    error: job.error,
    resultUrl: job.outputFilePath ? `/api/jobs/${job.id}/preview` : undefined,
    downloadUrl: job.outputFilePath ? `/api/jobs/${job.id}/download` : undefined,
    job,
  });
};

// API: Get job status (supports /api/jobs/:id, /api/upscale/:id, and /api/status/:id)
app.get('/api/upscale/:id', getJobStatusHandler);
app.get('/api/status/:id', getJobStatusHandler);
app.get('/api/jobs/:id', getJobStatusHandler);

// Helper: Stream media file with HTTP Range support for video scrubbing
function streamMediaFile(filePath: string, req: Request, res: Response, contentType: string) {
  if (!fs.existsSync(filePath)) {
    res.status(404).send('File not found');
    return;
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize) {
      res.status(416).send('Requested range not satisfiable\n' + start + ' >= ' + fileSize);
      return;
    }

    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType,
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
}

// API: Stream source media for preview
app.get('/api/jobs/:id/source', (req: Request, res: Response): void => {
  const job = upscalerService.getJobStatus(req.params.id);
  if (!job || !fs.existsSync(job.sourceFilePath)) {
    res.status(404).send('Source media not found');
    return;
  }

  const ext = path.extname(job.sourceFilePath).toLowerCase();
  const mimeType = ext === '.mp4' ? 'video/mp4' :
    ext === '.webm' ? 'video/webm' :
    ext === '.mov' ? 'video/quicktime' :
    ext === '.png' ? 'image/png' :
    ext === '.webp' ? 'image/webp' : 'image/jpeg';

  streamMediaFile(job.sourceFilePath, req, res, mimeType);
});

// API: Stream processed 4K result for preview
app.get('/api/jobs/:id/preview', (req: Request, res: Response): void => {
  const job = upscalerService.getJobStatus(req.params.id);
  if (!job || !job.outputFilePath || !fs.existsSync(job.outputFilePath)) {
    res.status(404).send('Processed result not ready yet');
    return;
  }

  const ext = path.extname(job.outputFilePath).toLowerCase();
  const mimeType = ext === '.mp4' ? 'video/mp4' :
    ext === '.webm' ? 'video/webm' :
    ext === '.mov' ? 'video/quicktime' :
    ext === '.png' ? 'image/png' :
    ext === '.webp' ? 'image/webp' : 'image/jpeg';

  streamMediaFile(job.outputFilePath, req, res, mimeType);
});

// API: Download genuine 4K output file
app.get('/api/jobs/:id/download', (req: Request, res: Response): void => {
  const result = upscalerService.downloadResult(req.params.id);
  if (!result) {
    res.status(404).send('Processed 4K output not available for download.');
    return;
  }

  res.download(result.filePath, result.originalFilename, (err) => {
    if (err) {
      console.error('Download transfer error:', err);
    }
  });
});

// API: Cancel & Cleanup Job
app.delete('/api/jobs/:id', (req: Request, res: Response): void => {
  upscalerService.cleanupJob(req.params.id);
  res.json({ success: true, message: 'Job and temporary files removed.' });
});

// ==========================================
// MY WORKS / SAVED MEDIA ENDPOINTS
// ==========================================

// Save a completed job to user's private collection
app.post('/api/saved', async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  const { jobId } = req.body;

  if (!jobId) {
    res.status(400).json({ error: 'Job ID is required.' });
    return;
  }

  const job = upscalerService.getJobStatus(jobId);
  if (!job) {
    res.status(404).json({ error: 'Job not found or expired.' });
    return;
  }

  if (job.status !== 'completed' || !job.outputFilePath) {
    res.status(400).json({ error: 'Job is not completed yet.' });
    return;
  }

  try {
    const savedWork = await savedService.saveWork(userId, job);
    res.status(201).json({ savedWork });
  } catch (err: any) {
    console.error('Failed to save work:', err);
    res.status(500).json({ error: err.message || 'Failed to save media.' });
  }
});

// Get user's saved works (filtered by all/image/video)
app.get('/api/saved', async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  const filter = req.query.filter as 'all' | 'image' | 'video' | undefined;

  try {
    const works = await savedService.getSavedWorks(userId, filter);
    res.json({ works });
  } catch (err: any) {
    console.error('Failed to get saved works:', err);
    res.status(500).json({ error: 'Failed to retrieve saved works.' });
  }
});

// Stream saved work preview
app.get('/api/saved/:id/preview', async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  const work = await savedService.getSavedWorkById(userId, req.params.id);

  if (!work || !fs.existsSync(work.storedFilePath)) {
    res.status(404).send('Saved media not found');
    return;
  }

  const ext = path.extname(work.storedFilePath).toLowerCase();
  const mimeType = ext === '.mp4' ? 'video/mp4' :
    ext === '.webm' ? 'video/webm' :
    ext === '.mov' ? 'video/quicktime' :
    ext === '.png' ? 'image/png' :
    ext === '.webp' ? 'image/webp' : 'image/jpeg';

  streamMediaFile(work.storedFilePath, req, res, mimeType);
});

// Stream saved source file for before/after comparison
app.get('/api/saved/:id/source', async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  const work = await savedService.getSavedWorkById(userId, req.params.id);

  if (!work || !work.sourceFilePath || !fs.existsSync(work.sourceFilePath)) {
    res.status(404).send('Source media not found');
    return;
  }

  const ext = path.extname(work.sourceFilePath).toLowerCase();
  const mimeType = ext === '.mp4' ? 'video/mp4' :
    ext === '.webm' ? 'video/webm' :
    ext === '.mov' ? 'video/quicktime' :
    ext === '.png' ? 'image/png' :
    ext === '.webp' ? 'image/webp' : 'image/jpeg';

  streamMediaFile(work.sourceFilePath, req, res, mimeType);
});

// Download saved work
app.get('/api/saved/:id/download', async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  const work = await savedService.getSavedWorkById(userId, req.params.id);

  if (!work || !fs.existsSync(work.storedFilePath)) {
    res.status(404).send('Saved media not found for download.');
    return;
  }

  const ext = path.extname(work.storedFilePath);
  const downloadName = `ANO_4K_${path.parse(work.originalFilename).name}${ext}`;

  res.download(work.storedFilePath, downloadName, (err) => {
    if (err) {
      console.error('Download error:', err);
    }
  });
});

// Delete saved work permanently
app.delete('/api/saved/:id', async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  const success = await savedService.deleteSavedWork(userId, req.params.id);

  if (!success) {
    res.status(404).json({ error: 'Saved work not found or permission denied.' });
    return;
  }

  res.json({ success: true, message: 'Saved media and metadata permanently deleted.' });
});

// Mount Vite or static build
async function setupApp() {
  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(__dirname, 'dist'))) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, () => {
    console.log(`ANO 4K server running on http://localhost:${PORT}`);
  });
}

setupApp().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
