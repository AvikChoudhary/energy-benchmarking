const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = 4000;

const MONGODB_URI = "mongodb+srv://user1:uwC3V2GKB8K3lY5d@testcluster.fkqitgv.mongodb.net/energy-benchmarking?retryWrites=true&w=majority";

app.use(cors());
app.use(express.json());

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const monthlySchema = new mongoose.Schema({
  month: String,
  energy: Number
}, { _id: false });

const buildingSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  location: { type: String, required: true },
  area: { type: Number, required: true },
  numberOfFloors: { type: Number, required: true },
  totalArea: { type: Number, required: true },
  monthly: { type: [monthlySchema], default: [] }
});

const Building = mongoose.model('Building', buildingSchema);

function getLast12MonthsArray() {
  const arr = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    arr.push({ month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, energy: 0 });
  }
  return arr;
}

// Get all buildings
app.get('/api/buildings', async (req, res) => {
  const buildings = await Building.find();
  const monthsArr = getLast12MonthsArray();
  const buildingsWith12Months = buildings.map(b => {
    const mMap = {};
    b.monthly.forEach(m => { mMap[m.month] = m.energy; });
    return {
      id: b._id,
      name: b.name,
      location: b.location,
      area: b.area,
      numberOfFloors: b.numberOfFloors,
      totalArea: b.totalArea,
      monthly: monthsArr.map(m => ({
        month: m.month,
        energy: mMap[m.month] !== undefined ? mMap[m.month] : 0
      }))
    };
  });
  res.json(buildingsWith12Months);
});

// Add a new building
app.post('/api/buildings', async (req, res) => {
  const { name, location, area, numberOfFloors } = req.body;
  if (!name || !location || !area || !numberOfFloors) 
    return res.status(400).json({ error: "Name, location, area, and number of floors required" });

  if (await Building.findOne({ name })) 
    return res.status(400).json({ error: "Building already exists." });

  const totalArea = Number(area) * Number(numberOfFloors);
  const building = new Building({
    name, location, area, numberOfFloors, totalArea,
    monthly: getLast12MonthsArray()
  });
  await building.save();
  res.json({ message: "Building added." });
});

// Update energy data for a building
app.put('/api/buildings', async (req, res) => {
  const { id, month, energy } = req.body;
  if (!id || !month || typeof energy !== "number") 
    return res.status(400).json({ error: "Invalid request" });

  const building = await Building.findById(id);
  if (!building) return res.status(404).json({ error: "Building not found" });

  // Update or add the month
  let found = false;
  for (let i = 0; i < building.monthly.length; ++i) {
    if (building.monthly[i].month === month) {
      building.monthly[i].energy = energy;
      found = true;
      break;
    }
  }
  if (!found) {
    building.monthly.push({ month, energy });
  }
  await building.save();
  res.json({ message: "Updated building monthly data" });
});

// Optionally: update building metadata
app.put('/api/buildings/meta', async (req, res) => {
  const { id, location, area, numberOfFloors } = req.body;
  if (!id) return res.status(400).json({ error: "Building id required" });
  const totalArea = Number(area) * Number(numberOfFloors);
  const building = await Building.findByIdAndUpdate(id, {
    location, area, numberOfFloors, totalArea
  }, { new: true });
  if (!building) return res.status(404).json({ error: "Building not found" });
  res.json({ message: "Updated building metadata" });
});

// Optionally: delete a building
app.delete('/api/buildings/:id', async (req, res) => {
  const { id } = req.params;
  const bld = await Building.findByIdAndDelete(id);
  if (!bld) return res.status(404).json({ error: "Building not found" });
  res.json({ message: "Deleted" });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});