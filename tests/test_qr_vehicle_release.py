import unittest
import json
import urllib.request
import urllib.error

BASE_URL = "http://localhost:5000/api"

class TestQRVehicleReleaseWorkflow(unittest.TestCase):

    def setUp(self):
        self.security_headers = {"Content-Type": "application/json"}
        self.test_plate = "KA-01-AB-1234"
        self.test_booking_id = f"test_booking_{int(urllib.request.urlopen(f'{BASE_URL}/system/health').status)}"
        
        # Create a fresh active booking for testing clean scan & release
        req_book = urllib.request.Request(
            f"{BASE_URL}/bookings",
            data=json.dumps({
                "vehicle": self.test_plate,
                "plateNumber": self.test_plate,
                "userEmail": "student@college.edu",
                "zoneName": "Zone A",
                "slotNumber": "K-30",
                "durationHours": 4
            }).encode('utf-8'),
            headers=self.security_headers,
            method='POST'
        )
        try:
            with urllib.request.urlopen(req_book) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                if data.get('booking'):
                    self.test_booking_id = str(data['booking']['id'])
        except Exception:
            pass

    def test_01_scan_qr_valid_data(self):
        """Test scanning valid QR code data for an active session."""
        qr_payload = {
            "qrData": json.dumps({
                "system": "PARKNEX_AI_GATE_PASS",
                "passSerial": "PASS-STU-089",
                "vehiclePlate": self.test_plate,
                "bookingId": self.test_booking_id,
                "studentName": "Student",
                "studentEmail": "student@college.edu"
            }),
            "role": "SECURITY",
            "email": "officer@college.edu"
        }
        
        req = urllib.request.Request(
            f"{BASE_URL}/security/scan-qr",
            data=json.dumps(qr_payload).encode('utf-8'),
            headers=self.security_headers,
            method='POST'
        )
        
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            self.assertTrue(data.get('success'))
            self.assertTrue(data.get('isEligible'))
            self.assertEqual(data.get('vehicle', {}).get('plateNumber'), self.test_plate)
            self.assertIn('owner', data)

    def test_02_scan_qr_invalid_data(self):
        """Test scanning empty or invalid QR code."""
        qr_payload = {
            "qrData": "",
            "role": "SECURITY"
        }
        
        req = urllib.request.Request(
            f"{BASE_URL}/security/scan-qr",
            data=json.dumps(qr_payload).encode('utf-8'),
            headers=self.security_headers,
            method='POST'
        )
        
        try:
            with urllib.request.urlopen(req) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                self.assertFalse(data.get('success'))
        except urllib.error.HTTPError as e:
            self.assertEqual(e.code, 400)

    def test_03_unauthorized_user_access_blocked(self):
        """Test that non-security users cannot execute QR scans or releases."""
        qr_payload = {
            "qrData": self.test_plate,
            "role": "STUDENT"
        }
        
        req = urllib.request.Request(
            f"{BASE_URL}/security/scan-qr",
            data=json.dumps(qr_payload).encode('utf-8'),
            headers=self.security_headers,
            method='POST'
        )
        
        try:
            with urllib.request.urlopen(req) as resp:
                self.fail("Student role should have been rejected with 403 Forbidden")
        except urllib.error.HTTPError as e:
            self.assertEqual(e.code, 403)

    def test_04_atomic_vehicle_release_and_duplicate_prevention(self):
        """Test atomic vehicle release and verify duplicate release protection (idempotency)."""
        release_payload = {
            "bookingId": self.test_booking_id,
            "plateNumber": self.test_plate,
            "officerEmail": "officer_test@college.edu",
            "remarks": "Test Automated QR Barrier Release",
            "role": "SECURITY"
        }

        # 1. First Release Attempt -> MUST SUCCEED
        req1 = urllib.request.Request(
            f"{BASE_URL}/security/release-vehicle",
            data=json.dumps(release_payload).encode('utf-8'),
            headers=self.security_headers,
            method='POST'
        )
        with urllib.request.urlopen(req1) as resp1:
            data1 = json.loads(resp1.read().decode('utf-8'))
            self.assertTrue(data1.get('success'))
            self.assertEqual(data1.get('status'), 'RELEASED')

        # 2. Duplicate Release Attempt -> MUST FAIL ATOMICALLY with HTTP 409 / ALREADY_RELEASED
        req2 = urllib.request.Request(
            f"{BASE_URL}/security/release-vehicle",
            data=json.dumps(release_payload).encode('utf-8'),
            headers=self.security_headers,
            method='POST'
        )
        try:
            with urllib.request.urlopen(req2) as resp2:
                data2 = json.loads(resp2.read().decode('utf-8'))
                self.fail("Duplicate release should return 409 Conflict")
        except urllib.error.HTTPError as e:
            self.assertEqual(e.code, 409)
            err_data = json.loads(e.read().decode('utf-8'))
            self.assertFalse(err_data.get('success'))
            self.assertEqual(err_data.get('status'), 'ALREADY_RELEASED')

if __name__ == '__main__':
    unittest.main()
