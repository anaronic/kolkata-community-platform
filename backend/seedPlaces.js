const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/.env' });
const Place = require('./models/Place');
const TinderProfile = require('./models/TinderProfile');
const { execFileSync } = require('child_process');

function fetchExternalRating(place, city = 'Kolkata') {
  try {
    // execFileSync with an args array: no shell, so no command injection via place/city
    const output = execFileSync('python', ['backend/fetch_justdial_rating.py', place, city], { timeout: 15000 }).toString().trim();
    const rating = parseFloat(output);
    return isNaN(rating) ? 3.0 : rating;
  } catch {
    return 3.0;
  }
}

const placesData = [
  // Cafes
  {
    name: 'Flurys',
    type: 'Cafe',
    location: 'Park Street',
    description: 'Iconic cafe known for its European-style cakes and pastries.',
    image: '/flury.avif',
    rating: 4.5,
    status: 'Open now',
  },
  {
    name: 'Paris Cafe',
    type: 'Cafe',
    location: 'Park Street',
    description: 'Cozy cafe serving French pastries and coffee.',
    image: '/street.jpg',
    rating: 4.3,
    status: 'Open now',
  },
  {
    name: 'Mocambo',
    type: 'Cafe',
    location: 'Park Street',
    description: 'Vintage restaurant with Continental cuisine.',
    image: '/moc.jpg',
    rating: 4.6,
    status: 'Open now',
  },
  // Kolkata Attractions
  {
    name: 'Victoria Memorial',
    type: 'Monument',
    location: 'Central Kolkata',
    description: 'Majestic marble building and museum.',
    image: 'https://images.unsplash.com/photo-1558431382-27e303142255?w=800',
    rating: 4.8,
    status: 'Open now',
  },
  {
    name: 'Howrah Bridge',
    type: 'Bridge',
    location: 'Howrah',
    description: 'Iconic cantilever bridge over Hooghly River.',
    image: '/hwh.jpg',
    rating: 4.7,
    status: 'Open now',
  },
  {
    name: 'Indian Museum',
    type: 'Museum',
    location: 'Park Street',
    description: 'Oldest and largest museum in India.',
    image: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=800',
    rating: 4.5,
    status: 'Closes at 5 PM',
  },
  // West Bengal Destinations
  {
    name: 'Darjeeling',
    type: 'Hill Station',
    location: 'West Bengal',
    description: 'Queen of Hills with tea gardens and mountain views.',
    image: '/dar.webp',
    rating: 4.8,
    status: 'Open now',
  },
  {
    name: 'Sundarbans',
    type: 'Forest',
    location: 'West Bengal',
    description: "World's largest mangrove forest.",
    image: '/sundarban.jpg',
    rating: 4.7,
    status: 'Open now',
  },
  {
    name: 'Digha',
    type: 'Beach',
    location: 'West Bengal',
    description: 'Popular beach destination.',
    image: '/dig.jpg',
    rating: 4.4,
    status: 'Open now',
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
    await Place.deleteMany({});
    await TinderProfile.deleteMany({});
    for (const place of placesData) {
      await Place.create(place);
      // Also create a TinderProfile with baseStars from scraping
      const baseStars = fetchExternalRating(place.name, 'Kolkata');
      await TinderProfile.create({
        name: place.name,
        age: '',
        bio: place.description,
        image: place.image,
        baseStars,
        averageStars: baseStars,
        feedbacks: []
      });
    }
    console.log('Places and TinderProfiles seeded successfully');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed(); 