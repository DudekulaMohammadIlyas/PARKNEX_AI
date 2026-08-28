const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Phase 7 database seed...');

  const defaultPassword = await bcrypt.hash('password123', 10);

  // 1. Seed Campus
  console.log('🏫 Seeding Campuses...');
  const mainCampus = await prisma.campus.upsert({
    where: { code: 'MAIN_CAMPUS' },
    update: { name: 'Main Campus', address: '100 University Drive, Tech City' },
    create: { code: 'MAIN_CAMPUS', name: 'Main Campus', address: '100 University Drive, Tech City' }
  });

  // 2. Seed Departments
  console.log('📚 Seeding Departments...');
  const csDept = await prisma.department.upsert({
    where: { name: 'Computer Science & Engineering' },
    update: { code: 'CSE', campusId: mainCampus.id },
    create: { name: 'Computer Science & Engineering', code: 'CSE', campusId: mainCampus.id }
  });

  // 3. Seed Users
  console.log('👤 Seeding Users...');
  const usersData = [
    { 
      email: 'admin@college.edu', 
      role: 'ADMIN', 
      name: 'System Admin', 
      phone: '+91 98765 00001', 
      password: defaultPassword, 
      departmentId: csDept.id,
      designation: 'Chief Systems Administrator'
    },
    { 
      email: 'security@college.edu', 
      role: 'SECURITY', 
      name: 'Officer Davis', 
      phone: '+91 98765 00002', 
      password: defaultPassword, 
      departmentId: csDept.id,
      designation: 'Head Security Officer'
    },
    { 
      email: 'student@college.edu', 
      role: 'STUDENT', 
      name: 'Alex Carter', 
      phone: '+91 98765 43210', 
      password: defaultPassword, 
      studentId: 'STU-2026-089',
      academicYear: '2024-2028 (3rd Year)',
      departmentId: csDept.id,
      designation: 'B.Tech CS Student',
      emergencyPhone: '+91 98765 99999'
    }
  ];

  for (const u of usersData) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, phone: u.phone, password: u.password, studentId: u.studentId, departmentId: u.departmentId },
      create: u
    });
  }

  // 4. Seed Anomaly Alerts
  console.log('🚨 Seeding Anomaly Alerts...');
  const anomalyCount = await prisma.anomalyAlert.count();
  if (anomalyCount === 0) {
    await prisma.anomalyAlert.createMany({
      data: [
        { title: 'Unexpected Occupancy Spike in Zone B', category: 'OCCUPANCY_SPIKE', riskScore: 0.88, details: 'Zone B reached 98% occupancy 45 mins before scheduled lectures.', status: 'OPEN' },
        { title: 'Unregistered Vehicle Repetitive Entry Attempt', category: 'SUSPICIOUS_VEHICLE', riskScore: 0.94, details: 'Plate UP-16-XX-8888 attempted 3 gate entries without valid QR pass.', status: 'INVESTIGATING' }
      ]
    });
  }

  // 5. Seed AI Model Metadata
  console.log('🤖 Seeding AI Model Registry...');
  const models = [
    { name: 'YOLOv8-Campus Vehicle Detector', version: 'v2.4', accuracyPercent: 97.8, confidenceMin: 0.85, status: 'DEPLOYED' },
    { name: 'EasyOCR License Plate Reader', version: 'v1.6', accuracyPercent: 96.2, confidenceMin: 0.80, status: 'DEPLOYED' },
    { name: 'LSTM Predictive Occupancy Forecaster', version: 'v3.1', accuracyPercent: 94.8, confidenceMin: 0.90, status: 'DEPLOYED' }
  ];

  for (const m of models) {
    await prisma.aIModelMetadata.upsert({
      where: { name: m.name },
      update: { version: m.version, accuracyPercent: m.accuracyPercent, status: m.status },
      create: m
    });
  }

  // 6. Seed Automation Rules
  console.log('⚡ Seeding Smart Automation Rules...');
  const rules = [
    { ruleName: 'Auto-Visitor Approval Rule', trigger: 'HOST_APPROVED', action: 'GENERATE_QR_PASS' },
    { ruleName: 'Overflow Redirection Rule', trigger: 'ZONE_OCCUPANCY_GREATER_90', action: 'REDIRECT_TRAFFIC_ZONE_A' },
    { ruleName: 'Emergency Priority Override Rule', trigger: 'EMERGENCY_VEHICLE_DETECTED', action: 'RELEASE_GATE_BARRIER' }
  ];

  for (const r of rules) {
    await prisma.automationRule.upsert({
      where: { ruleName: r.ruleName },
      update: { trigger: r.trigger, action: r.action },
      create: r
    });
  }

  // 7. Seed Campus Parking Zones
  console.log('🗺️ Seeding all 12 Campus Parking Zones...');
  const zonesData = [
    { name: 'Faculty Parking', total: 100, occupied: 10, type: 'Faculty Only', status: 'Active' },
    { name: 'South Block', total: 150, occupied: 50, type: 'Mixed', status: 'Active' },
    { name: 'Zone B', total: 80, occupied: 78, type: '4-Wheeler', status: 'Active' },
    { name: 'KRISHNA HOSTEL', total: 150, occupied: 50, type: 'Hostel Block', status: 'Active' },
    { name: 'HOSPITAL PARKING', total: 200, occupied: 80, type: 'Mixed', status: 'Active' },
    { name: 'Zone C', total: 200, occupied: 110, type: '2-Wheeler', status: 'Active' },
    { name: 'Zone A', total: 120, occupied: 45, type: 'Academic', status: 'Active' },
    { name: 'Visitor Parking', total: 50, occupied: 10, type: 'Visitor Only', status: 'Active' },
    { name: 'Scad', total: 75, occupied: 1, type: 'Mixed', status: 'Active' },
    { name: 'Near Temple', total: 60, occupied: 0, type: 'Mixed', status: 'Active' },
    { name: 'Faculty Block Parking', total: 100, occupied: 15, type: 'Faculty Only', status: 'Active' },
    { name: 'North Block', total: 200, occupied: 80, type: 'Academic', status: 'Active' }
  ];

  for (const z of zonesData) {
    const existing = await prisma.zone.findFirst({ where: { name: z.name } });
    if (existing) {
      await prisma.zone.update({
        where: { id: existing.id },
        data: { total: z.total, occupied: z.occupied, type: z.type, status: z.status }
      });
    } else {
      await prisma.zone.create({ data: z });
    }
  }

  console.log('✅ Phase 7 database seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
