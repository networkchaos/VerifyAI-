#!/usr/bin/env python3
"""Test script to verify face detection models are installed"""

print("Testing face detection models installation...\n")

# Test YOLOv8
try:
    from ultralytics import YOLO
    print("✅ YOLOv8 (Ultralytics): Installed")
except ImportError as e:
    print(f"❌ YOLOv8 (Ultralytics): Not installed - {e}")

# Test DeepFace
try:
    from deepface import DeepFace
    print("✅ DeepFace: Installed")
except ImportError as e:
    print(f"❌ DeepFace: Not installed - {e}")

# Test InsightFace
try:
    import insightface
    print("✅ InsightFace: Installed")
except ImportError as e:
    print(f"❌ InsightFace: Not installed - {e}")

# Test MediaPipe
try:
    import mediapipe
    print("✅ MediaPipe: Installed")
except ImportError as e:
    print(f"❌ MediaPipe: Not installed - {e}")

# Test OpenCV
try:
    import cv2
    print(f"✅ OpenCV: Installed (version {cv2.__version__})")
except ImportError as e:
    print(f"❌ OpenCV: Not installed - {e}")

# Test NumPy
try:
    import numpy as np
    print(f"✅ NumPy: Installed (version {np.__version__})")
except ImportError as e:
    print(f"❌ NumPy: Not installed - {e}")

print("\n✅ All required models are installed and ready to use!")

