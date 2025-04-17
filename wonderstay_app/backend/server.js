
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const Stripe = require('stripe');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const SECRET_KEY = 'your_secret_key';

app.use(cors());
app.use(bodyParser.json());

let users = [], stays = [], vehicles = [], deliveries = [], tripPlans = [];

const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.post('/api/register', (req, res) => {
  const { email, password, role = 'user' } = req.body;
  const user = { id: uuidv4(), email, password, role };
  users.push(user);
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY);
  res.json({ token });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(403).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY);
  res.json({ token });
});

app.post('/api/stays', authenticateToken, (req, res) => {
  const stay = { id: uuidv4(), userId: req.user.id, ...req.body };
  stays.push(stay);
  res.status(201).json(stay);
});

app.post('/api/vehicles', authenticateToken, (req, res) => {
  const vehicle = { id: uuidv4(), userId: req.user.id, ...req.body };
  vehicles.push(vehicle);
  res.status(201).json(vehicle);
});

app.post('/api/deliveries', authenticateToken, (req, res) => {
  const delivery = { id: uuidv4(), userId: req.user.id, ...req.body };
  deliveries.push(delivery);
  res.status(201).json(delivery);
});

app.post('/api/plan-trip', authenticateToken, (req, res) => {
  const plan = {
    id: uuidv4(),
    userId: req.user.id,
    ...req.body,
    itinerary: `Suggested plan for ${req.body.destination}`,
    pricing: { total: 1000, breakdown: { stay: 500, ride: 300, delivery: 200 } }
  };
  tripPlans.push(plan);
  res.status(200).json(plan);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
