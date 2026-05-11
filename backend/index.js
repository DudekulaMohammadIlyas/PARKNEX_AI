const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
let isScanning = false;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('ParkNex-AI Backend is running successfully!');
});

// API Routes
app.get('/api/occupancy', async (req, res) => {
  try {
    const zones = await prisma.zone.findMany();
    
    let totalSlots = 0;
    let occupiedSlots = 0;
    
    zones.forEach(zone => {
      totalSlots += zone.total;
      occupiedSlots += zone.occupied;
    });

    res.json({
      totalSlots,
      occupiedSlots,
      zones
    });
  } catch (error) {
    console.error('Error fetching occupancy:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/events', async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { timestamp: 'desc' },
      take: 50,
      include: { zone: true }
    });
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to simulate an AI event (entry/exit)
app.post('/api/simulate-event', async (req, res) => {
  const { type, plateNumber, zoneId, snapshotUrl } = req.body;
  
  try {
    // Basic validation
    if (!type || !plateNumber || !zoneId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const zone = await prisma.zone.findUnique({ where: { id: zoneId } });
    if (!zone) {
      return res.status(404).json({ error: 'Zone not found' });
    }

    // Determine status (mock logic: if plate ends in 0 it's unauthorized)
    const isUnauthorized = plateNumber.endsWith('0');
    const status = isUnauthorized ? 'UNAUTHORIZED' : 'AUTHORIZED';

    const newEvent = await prisma.event.create({
      data: {
        type,
        plateNumber,
        zoneId,
        status,
        snapshotUrl
      }
    });

    // Update occupancy
    if (type === 'ENTRY') {
      await prisma.zone.update({
        where: { id: zoneId },
        data: { occupied: { increment: 1 } }
      });
    } else if (type === 'EXIT' && zone.occupied > 0) {
      await prisma.zone.update({
        where: { id: zoneId },
        data: { occupied: { decrement: 1 } }
      });
    }

    // Try to notify all students (or specific user if we mapped plates)
    // For demo purposes, we will notify all students that have a push token
    // If it's UNAUTHORIZED, we notify SECURITY
    if (status === 'UNAUTHORIZED') {
      const securityUsers = await prisma.user.findMany({ where: { role: 'SECURITY', pushToken: { not: null } } });
      for (const u of securityUsers) {
        sendPushNotification(u.pushToken, '🚨 Unauthorized Vehicle!', `Plate ${plateNumber} detected in ${zone.name}`);
      }
    } else {
      // Find the user who owns this plate (in a real app). Here we just notify all students for the demo.
      const studentUsers = await prisma.user.findMany({ where: { role: 'STUDENT', pushToken: { not: null } } });
      for (const u of studentUsers) {
        sendPushNotification(u.pushToken, `Vehicle ${type === 'ENTRY' ? 'Parked' : 'Exited'}`, `Your vehicle ${plateNumber} has ${type === 'ENTRY' ? 'entered' : 'left'} ${zone.name}`);
      }
    }

    res.json({ success: true, event: newEvent });
  } catch (error) {
    console.error('Error processing event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/zones', async (req, res) => {
  try {
    const { name, total } = req.body;
    const newZone = await prisma.zone.create({
      data: { name, total: parseInt(total), occupied: 0 }
    });
    res.json(newZone);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create zone' });
  }
});

app.put('/api/zones/:id', async (req, res) => {
  try {
    const { total, name } = req.body;
    const updateData = {};
    if (total !== undefined) updateData.total = parseInt(total);
    if (name !== undefined) updateData.name = name;

    const updatedZone = await prisma.zone.update({
      where: { id: req.params.id },
      data: updateData
    });
    res.json(updatedZone);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update zone' });
  }
});

// Push Notifications
app.post('/api/register-push-token', async (req, res) => {
  const { email, pushToken, role } = req.body;
  if (!email || !pushToken) return res.status(400).json({ error: 'Missing email or push token' });

  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: { pushToken, role: role || 'STUDENT' },
      create: { email, pushToken, role: role || 'STUDENT' }
    });
    res.json({ success: true, user });
  } catch (error) {
    console.error('Error registering push token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mock Payments
app.post('/api/checkout', async (req, res) => {
  const { email, planId } = req.body;
  if (!email || !planId) return res.status(400).json({ error: 'Missing email or planId' });

  // In a real app, this would create a Stripe Checkout Session
  // For now, we simulate a successful payment after 1.5 seconds
  setTimeout(() => {
    res.json({ success: true, message: 'Payment successful', planId });
  }, 1500);
});

// Trigger AI Process Manually
app.post('/api/trigger-ai', (req, res) => {
  if (isScanning) {
    return res.status(400).json({ success: false, message: 'An AI scan is already in progress.' });
  }

  const aiPath = path.resolve(__dirname, '../ai-service/main.py');
  isScanning = true;
  
  console.log(`Starting AI scan at ${new Date().toLocaleTimeString()}`);
  
  // Spawn Python script in background
  const pyProc = spawn('python', [aiPath], { cwd: path.resolve(__dirname, '../ai-service') });
  
  pyProc.stdout.on('data', (data) => console.log(`AI: ${data}`));
  pyProc.stderr.on('data', (data) => console.error(`AI Error: ${data}`));
  
  pyProc.on('close', (code) => {
    isScanning = false;
    console.log(`AI process exited with code ${code}`);
  });
  
  res.json({ success: true, message: 'AI scan triggered successfully.' });
});

// Reset System for Demo
app.post('/api/reset', async (req, res) => {
  try {
    // Clear all events and reset occupancy
    await prisma.event.deleteMany();
    await prisma.zone.updateMany({
      data: { occupied: 0 }
    });
    
    // Optionally re-seed default values
    const zones = [
      { name: 'North Block', total: 200, occupied: 80 },
      { name: 'South Block', total: 150, occupied: 50 },
      { name: 'Visitor Parking', total: 50, occupied: 10 },
      { name: 'Faculty Parking', total: 100, occupied: 10 },
    ];

    for (const z of zones) {
      await prisma.zone.updateMany({
        where: { name: z.name },
        data: { occupied: z.occupied }
      });
    }

    res.json({ success: true, message: 'System reset to demo state.' });
  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({ error: 'Failed to reset system' });
  }
});

async function sendPushNotification(expoPushToken, title, body) {
  if (!expoPushToken) return;
  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data: { someData: 'goes here' },
  };

  try {
    await axios.post('https://exp.host/--/api/v2/push/send', message, {
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    console.error('Failed to send push notification', err);
  }
}

// Seed data function (for initial setup)
app.post('/api/seed', async (req, res) => {
  try {
    const count = await prisma.zone.count();
    if (count === 0) {
      await prisma.zone.createMany({
        data: [
          { name: 'North Block', total: 200, occupied: 80 },
          { name: 'South Block', total: 150, occupied: 50 },
          { name: 'Visitor Parking', total: 50, occupied: 10 },
          { name: 'Faculty Parking', total: 100, occupied: 10 },
        ]
      });
      res.json({ success: true, message: 'Zones seeded' });
    } else {
      res.json({ success: true, message: 'Zones already exist' });
    }
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ error: 'Failed to seed data' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
