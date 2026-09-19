require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.use('/api', rateLimit({ windowMs: 60 * 1000, limit: 120 }));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));

// Basic route
app.get('/', (req, res) => {
  res.send('MyKolkata backend is running');
});

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const placesRoutes = require('./routes/places');
app.use('/api/places', placesRoutes);

const profileRoutes = require('./routes/profile');
app.use('/api/profile', profileRoutes);

const contributeRoutes = require('./routes/contribute');
app.use('/api/contribute', contributeRoutes);

// New API routes for dynamic data
const newsRoutes = require('./routes/news');
app.use('/api/news', newsRoutes);

const marketplaceRoutes = require('./routes/marketplace');
app.use('/api/marketplace', marketplaceRoutes);

const pandalsRoutes = require('./routes/pandals');
app.use('/api/pandals', pandalsRoutes);

const regionsRoutes = require('./routes/regions');
app.use('/api/regions', regionsRoutes);

const transportRoutes = require('./routes/transport');
app.use('/api/transport', transportRoutes);

const communitiesRoutes = require('./routes/communities');
app.use('/api/communities', communitiesRoutes);

const tinderProfilesRoutes = require('./routes/tinderProfiles');
app.use('/api/tinder-profiles', tinderProfilesRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 