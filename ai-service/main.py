import os
import cv2
import time
import requests
import uuid
from dotenv import load_dotenv
from supabase import create_client, Client
from ultralytics import YOLO
import easyocr

load_dotenv()

# Supabase Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Backend API URL
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000/api")
ZONE_ID = os.getenv("ZONE_ID", "mock-zone-id") # In a real scenario, this would be passed or fetched

print("Initializing AI Models...")
# Initialize YOLOv8 (using the nano model for speed)
# If yolov8n.pt doesn't exist, ultralytics will download it automatically.
model = YOLO('yolov8n.pt')

# Initialize EasyOCR
reader = easyocr.Reader(['en'], gpu=False) # Set gpu=True if CUDA is available
print("Models Initialized Successfully.")

def upload_snapshot(image_bytes, filename):
    try:
        # Create 'snapshots' bucket if it doesn't exist (this usually needs to be done in Supabase UI, but we'll try)
        # Upload the file
        res = supabase.storage.from_("snapshots").upload(
            file=image_bytes,
            path=f"{filename}.jpg",
            file_options={"content-type": "image/jpeg"}
        )
        
        # Get public URL
        public_url = supabase.storage.from_("snapshots").get_public_url(f"{filename}.jpg")
        return public_url
    except Exception as e:
        print(f"Error uploading snapshot: {e}")
        return None

def process_detection(frame, bbox, plate_text):
    # Crop the vehicle or plate for the snapshot
    x1, y1, x2, y2 = [int(v) for v in bbox]
    cropped_img = frame[y1:y2, x1:x2]
    
    # Encode to JPEG
    _, buffer = cv2.imencode('.jpg', cropped_img)
    image_bytes = buffer.tobytes()
    
    # Upload to Supabase Storage
    print(f"Uploading snapshot for plate {plate_text}...")
    snapshot_url = upload_snapshot(image_bytes, f"plate_{uuid.uuid4().hex}")
    
    # Send event to Backend Node.js API
    # The Node backend handles the Prisma DB insertion and occupancy logic,
    # which then triggers the Supabase Realtime broadcast via DB triggers.
    payload = {
        "type": "ENTRY", # Logic could determine ENTRY vs EXIT based on camera position
        "plateNumber": plate_text,
        "zoneId": ZONE_ID,
        "snapshotUrl": snapshot_url
    }
    
    print(f"Sending event to backend: {payload}")
    try:
        response = requests.post(f"{BACKEND_URL}/simulate-event", json=payload)
        print("Backend response:", response.json())
    except Exception as e:
        print(f"Failed to communicate with backend: {e}")


def run_pipeline(video_source):
    cap = cv2.VideoCapture(video_source)
    
    if not cap.isOpened():
        print(f"Error: Cannot open video source {video_source}.")
        print("Fallback: Simulating a mock detection in 5 seconds...")
        time.sleep(5)
        # Generate a mock frame for the snapshot (blank gray image)
        import numpy as np
        mock_frame = np.ones((480, 640, 3), dtype=np.uint8) * 150
        process_detection(mock_frame, [100, 100, 300, 200], "UP16AB9999")
        return

    frame_count = 0
    detections_made = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
            
        frame_count += 1
        
        # Process every 30th frame to save CPU
        if frame_count % 30 == 0:
            # Run YOLOv8 inference
            results = model(frame)
            
            for result in results:
                boxes = result.boxes
                for box in boxes:
                    # Class 2 is 'car', 3 is 'motorcycle', 5 is 'bus', 7 is 'truck' in COCO dataset
                    if int(box.cls[0]) in [2, 3, 5, 7]:
                        detections_made += 1
                        # A vehicle is detected. Now run OCR on the vehicle bounding box area.
                        x1, y1, x2, y2 = [int(v) for v in box.xyxy[0]]
                        vehicle_crop = frame[y1:y2, x1:x2]
                        
                        # Use EasyOCR to find text in the vehicle crop
                        ocr_results = reader.readtext(vehicle_crop)
                        
                        for (bbox, text, prob) in ocr_results:
                            if prob > 0.5 and len(text) > 4: # Simple heuristic for a license plate
                                # Clean the text
                                clean_text = "".join(e for e in text if e.isalnum()).upper()
                                print(f"Detected Plate: {clean_text} (Conf: {prob:.2f})")
                                
                                # Process the detection
                                process_detection(frame, box.xyxy[0], clean_text)
                                
                                # Sleep to prevent spamming for the same vehicle
                                time.sleep(5)
                                
    cap.release()
    try:
        cv2.destroyAllWindows()
    except Exception:
        pass
        
    if detections_made == 0:
        print("\nYOLOv8 didn't recognize any vehicles in the video.")
        print("Falling back to a mock synthetic detection to demonstrate the pipeline...")
        import numpy as np
        mock_frame = np.ones((480, 640, 3), dtype=np.uint8) * 150
        process_detection(mock_frame, [100, 100, 300, 200], f"DEMO{uuid.uuid4().hex[:4].upper()}")

if __name__ == "__main__":
    # Check if we should force a mock detection immediately for quick demo
    if os.getenv("FORCE_MOCK") == "true":
        print("FORCE_MOCK enabled. Simulating detection...")
        import numpy as np
        mock_frame = np.ones((480, 640, 3), dtype=np.uint8) * 150
        process_detection(mock_frame, [100, 100, 300, 200], f"DEMO{uuid.uuid4().hex[:4].upper()}")
    else:
        # Provide 'sample.mp4' or 0 for webcam.
        run_pipeline('sample.mp4')
