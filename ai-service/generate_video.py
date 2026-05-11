import cv2
import numpy as np

# Video settings
width, height = 640, 480
fps = 30
duration = 5 # seconds
fourcc = cv2.VideoWriter_fourcc(*'mp4v')
out = cv2.VideoWriter('sample.mp4', fourcc, fps, (width, height))

# Car and plate settings
car_color = (200, 50, 50) # Blue-ish car
plate_color = (255, 255, 255)
text_color = (0, 0, 0)
plate_text = "UP16AB9999"

# Calculate movement
total_frames = fps * duration
start_x, start_y = -200, height // 2
end_x, end_y = width + 50, height // 2

for i in range(total_frames):
    # Create background (gray road)
    frame = np.ones((height, width, 3), dtype=np.uint8) * 100
    
    # Calculate current position
    progress = i / total_frames
    x = int(start_x + (end_x - start_x) * progress)
    y = int(start_y + (end_y - start_y) * progress)
    
    # Draw "car" (a large rectangle)
    car_w, car_h = 240, 160
    cv2.rectangle(frame, (x, y - car_h//2), (x + car_w, y + car_h//2), car_color, -1)
    
    # Draw "license plate"
    plate_w, plate_h = 100, 40
    plate_x = x + car_w//2 - plate_w//2
    plate_y = y + car_h//2 - 50
    cv2.rectangle(frame, (plate_x, plate_y), (plate_x + plate_w, plate_y + plate_h), plate_color, -1)
    cv2.rectangle(frame, (plate_x, plate_y), (plate_x + plate_w, plate_y + plate_h), text_color, 2)
    
    # Add text to license plate
    font = cv2.FONT_HERSHEY_SIMPLEX
    cv2.putText(frame, plate_text, (plate_x + 5, plate_y + 25), font, 0.5, text_color, 2, cv2.LINE_AA)
    
    out.write(frame)

out.release()
print("Successfully generated sample.mp4")
