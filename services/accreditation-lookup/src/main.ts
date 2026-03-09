import 'dotenv/config';
import express from 'express';

const app = express();
const port = Number(process.env.PORT) || 3001;
const startedAt = Date.now();

app.get('/health', (_, res) => {
  res.json({
    service: 'accreditation-lookup-service',
    uptime: Math.floor((Date.now() - startedAt) / 1000),
  });
});

app.listen(port, () => {
  console.log(`Accreditation Lookup Service on port ${port}`);
});
