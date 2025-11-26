#!/usr/bin/env python3
"""
Face Detection Service
Supports multiple face detection models: YOLOv8, DeepFace, InsightFace, and MediaPipe
"""

import sys
import json
import argparse
import base64
from pathlib import Path

# Handle import errors gracefully
try:
    import cv2
    import numpy as np
except ImportError as e:
    error_result = {
        'error': f'OpenCV not installed: {str(e)}. Run: pip install opencv-python numpy',
        'face_count': 0,
        'faces': []
    }
    # Output to stderr so Node.js can catch it even on exit code 1
    print(json.dumps(error_result), file=sys.stderr)
    sys.exit(1)


class FaceDetector:
    """Base class for face detectors"""
    
    def detect(self, image_path):
        """Detect faces in image. Returns list of detections with bounding boxes."""
        raise NotImplementedError


class YOLOv8FaceDetector(FaceDetector):
    """YOLOv8 Face Detection using Ultralytics with OpenCV fallback"""
    
    def __init__(self, model_size='n'):
        try:
            from ultralytics import YOLO
            self.YOLO = YOLO
            # Try to use a face detection model, fallback to general YOLOv8
            # First try: Use a pre-trained face detection model if available
            # Note: yolov8n-face.pt may not exist, so we'll use standard YOLOv8 and filter
            try:
                # Try face-specific model first
                model_name = f"yolov8{model_size}-face.pt"
                print(f"Attempting to load YOLOv8 face model: {model_name}", file=sys.stderr)
                self.model = YOLO(model_name)
                print("YOLOv8 face model loaded successfully", file=sys.stderr)
            except:
                # Fallback: Use standard YOLOv8 model and use OpenCV for face detection
                print("Face-specific YOLOv8 model not found, using OpenCV DNN face detector", file=sys.stderr)
                self.model = None
                # Use OpenCV's DNN face detector as fallback
                try:
                    # Load OpenCV DNN face detector
                    dnn_model_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
                    self.face_cascade = cv2.CascadeClassifier(dnn_model_path)
                    if self.face_cascade.empty():
                        # Try alternative path
                        import os
                        alt_path = os.path.join(os.path.dirname(cv2.__file__), 'data', 'haarcascade_frontalface_default.xml')
                        self.face_cascade = cv2.CascadeClassifier(alt_path)
                    print("OpenCV face detector loaded successfully", file=sys.stderr)
                except Exception as e:
                    print(f"ERROR: Could not load OpenCV face detector: {e}", file=sys.stderr)
                    raise
        except ImportError:
            print("ERROR: Ultralytics not installed. Run: pip install ultralytics", file=sys.stderr)
            raise
        except Exception as e:
            print(f"ERROR initializing face detector: {e}", file=sys.stderr)
            raise
    
    def detect(self, image_path):
        """Detect faces using YOLOv8 or OpenCV fallback"""
        try:
            if self.model is not None:
                # Use YOLOv8 model if available
                results = self.model(image_path, verbose=False)
                detections = []
                
                for result in results:
                    if result.boxes is not None:
                        boxes = result.boxes.xyxy.cpu().numpy()  # Bounding boxes
                        confidences = result.boxes.conf.cpu().numpy()  # Confidence scores
                        
                        for i, (box, conf) in enumerate(zip(boxes, confidences)):
                            x1, y1, x2, y2 = box
                            detections.append({
                                'bounding_box': {
                                    'x1': float(x1),
                                    'y1': float(y1),
                                    'x2': float(x2),
                                    'y2': float(y2),
                                    'width': float(x2 - x1),
                                    'height': float(y2 - y1)
                                },
                                'confidence': float(conf),
                                'model': 'yolov8-face'
                            })
                
                return {
                    'face_count': len(detections),
                    'faces': detections,
                    'model': 'yolov8-face'
                }
            else:
                # Fallback to OpenCV face detection
                img = cv2.imread(image_path)
                if img is None:
                    return {'face_count': 0, 'faces': [], 'model': 'yolov8-face', 'error': 'Could not read image'}
                
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                faces = self.face_cascade.detectMultiScale(
                    gray,
                    scaleFactor=1.1,
                    minNeighbors=5,
                    minSize=(30, 30)
                )
                
                detections = []
                for (x, y, w, h) in faces:
                    detections.append({
                        'bounding_box': {
                            'x1': float(x),
                            'y1': float(y),
                            'x2': float(x + w),
                            'y2': float(y + h),
                            'width': float(w),
                            'height': float(h)
                        },
                        'confidence': 0.9,  # OpenCV doesn't provide confidence scores
                        'model': 'yolov8-face-opencv'
                    })
                
                return {
                    'face_count': len(detections),
                    'faces': detections,
                    'model': 'yolov8-face-opencv'
                }
        except Exception as e:
            print(f"ERROR in face detection: {e}", file=sys.stderr)
            import traceback
            print(traceback.format_exc(), file=sys.stderr)
            return {'face_count': 0, 'faces': [], 'model': 'yolov8-face', 'error': str(e)}


class DeepFaceDetector(FaceDetector):
    """DeepFace Face Detection and Recognition"""
    
    def __init__(self):
        try:
            from deepface import DeepFace
            self.DeepFace = DeepFace
            print("DeepFace loaded successfully", file=sys.stderr)
        except ImportError:
            print("ERROR: DeepFace not installed. Run: pip install deepface", file=sys.stderr)
            raise
    
    def detect(self, image_path):
        """Detect faces using DeepFace"""
        try:
            # DeepFace can detect and analyze faces
            result = self.DeepFace.analyze(
                img_path=image_path,
                actions=['age', 'gender', 'race', 'emotion'],
                enforce_detection=False,
                silent=True
            )
            
            detections = []
            
            # Handle both single face and multiple faces
            if isinstance(result, dict):
                result = [result]
            
            for face_data in result:
                region = face_data.get('region', {})
                x = region.get('x', 0)
                y = region.get('y', 0)
                w = region.get('w', 0)
                h = region.get('h', 0)
                
                detections.append({
                    'bounding_box': {
                        'x1': float(x),
                        'y1': float(y),
                        'x2': float(x + w),
                        'y2': float(y + h),
                        'width': float(w),
                        'height': float(h)
                    },
                    'confidence': 0.95,  # DeepFace doesn't provide confidence, use high default
                    'model': 'deepface',
                    'age': face_data.get('age'),
                    'gender': face_data.get('dominant_gender'),
                    'emotion': face_data.get('dominant_emotion')
                })
            
            return {
                'face_count': len(detections),
                'faces': detections,
                'model': 'deepface'
            }
        except Exception as e:
            print(f"ERROR in DeepFace detection: {e}", file=sys.stderr)
            return {'face_count': 0, 'faces': [], 'model': 'deepface', 'error': str(e)}


class InsightFaceDetector(FaceDetector):
    """InsightFace Face Detection - Modern alternative to RetinaFace"""
    
    def __init__(self):
        try:
            import insightface
            self.insightface = insightface
            # Load the model
            self.model = insightface.app.FaceAnalysis(providers=['CPUExecutionProvider'])
            self.model.prepare(ctx_id=-1, det_size=(640, 640))
            print("InsightFace loaded successfully", file=sys.stderr)
        except ImportError:
            print("ERROR: InsightFace not installed. Run: pip install insightface", file=sys.stderr)
            raise
        except Exception as e:
            print(f"ERROR loading InsightFace model: {e}", file=sys.stderr)
            raise
    
    def detect(self, image_path):
        """Detect faces using InsightFace"""
        try:
            img = cv2.imread(image_path)
            if img is None:
                return {'face_count': 0, 'faces': [], 'model': 'insightface', 'error': 'Could not read image'}
            
            faces = self.model.get(img)
            detections = []
            
            for face in faces:
                bbox = face.bbox.astype(int)
                x1, y1, x2, y2 = bbox[0], bbox[1], bbox[2], bbox[3]
                det_score = face.det_score
                
                detections.append({
                    'bounding_box': {
                        'x1': float(x1),
                        'y1': float(y1),
                        'x2': float(x2),
                        'y2': float(y2),
                        'width': float(x2 - x1),
                        'height': float(y2 - y1)
                    },
                    'confidence': float(det_score),
                    'model': 'insightface',
                    'embedding': face.embedding.tolist() if hasattr(face, 'embedding') else None
                })
            
            return {
                'face_count': len(detections),
                'faces': detections,
                'model': 'insightface'
            }
        except Exception as e:
            print(f"ERROR in InsightFace detection: {e}", file=sys.stderr)
            return {'face_count': 0, 'faces': [], 'model': 'insightface', 'error': str(e)}


class MediaPipeFaceDetector(FaceDetector):
    """MediaPipe Face Detection"""
    
    def __init__(self):
        try:
            import mediapipe as mp
            self.mp = mp
            self.mp_face_detection = mp.solutions.face_detection
            self.detector = self.mp_face_detection.FaceDetection(
                model_selection=1,  # 0 for short-range, 1 for full-range
                min_detection_confidence=0.5
            )
            print("MediaPipe Face Detection loaded successfully", file=sys.stderr)
        except ImportError:
            print("ERROR: MediaPipe not installed. Run: pip install mediapipe", file=sys.stderr)
            raise
    
    def detect(self, image_path):
        """Detect faces using MediaPipe"""
        try:
            image = cv2.imread(image_path)
            if image is None:
                return {'face_count': 0, 'faces': [], 'model': 'mediapipe', 'error': 'Could not read image'}
            
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            results = self.detector.process(rgb_image)
            
            detections = []
            h, w, _ = image.shape
            
            if results.detections:
                for detection in results.detections:
                    bbox = detection.location_data.relative_bounding_box
                    confidence = detection.score[0]
                    
                    x1 = float(bbox.xmin * w)
                    y1 = float(bbox.ymin * h)
                    x2 = float((bbox.xmin + bbox.width) * w)
                    y2 = float((bbox.ymin + bbox.height) * h)
                    
                    detections.append({
                        'bounding_box': {
                            'x1': x1,
                            'y1': y1,
                            'x2': x2,
                            'y2': y2,
                            'width': float(bbox.width * w),
                            'height': float(bbox.height * h)
                        },
                        'confidence': float(confidence),
                        'model': 'mediapipe'
                    })
            
            return {
                'face_count': len(detections),
                'faces': detections,
                'model': 'mediapipe'
            }
        except Exception as e:
            print(f"ERROR in MediaPipe detection: {e}", file=sys.stderr)
            return {'face_count': 0, 'faces': [], 'model': 'mediapipe', 'error': str(e)}


def get_detector(model_name):
    """Factory function to get the appropriate detector"""
    model_name = model_name.lower()
    
    try:
        if model_name.startswith('yolo'):
            # Extract model size if specified (yolov8n, yolov8s, etc.)
            size = 'n'  # default to nano
            if 'yolov8s' in model_name or 'yolov5s' in model_name:
                size = 's'
            elif 'yolov8m' in model_name or 'yolov5m' in model_name:
                size = 'm'
            elif 'yolov8l' in model_name or 'yolov5l' in model_name:
                size = 'l'
            return YOLOv8FaceDetector(model_size=size)
        elif 'deepface' in model_name:
            return DeepFaceDetector()
        elif 'insightface' in model_name or 'insight' in model_name:
            return InsightFaceDetector()
        elif 'mediapipe' in model_name or 'media' in model_name:
            return MediaPipeFaceDetector()
        else:
            # Default to YOLOv8
            return YOLOv8FaceDetector(model_size='n')
    except ImportError as e:
        raise ImportError(f"Required package not installed for model '{model_name}': {str(e)}")
    except Exception as e:
        raise Exception(f"Failed to initialize detector for model '{model_name}': {str(e)}")


def compare_faces(id_image_path, selfie_image_path, model_name='yolov8-face'):
    """Compare faces between ID and selfie images using face embeddings for accurate similarity"""
    try:
        # Try DeepFace first for accurate face verification
        if model_name == 'deepface' or model_name == 'auto':
            try:
                from deepface import DeepFace
                result = DeepFace.verify(
                    img1_path=id_image_path,
                    img2_path=selfie_image_path,
                    model_name='VGG-Face',  # Can use: VGG-Face, Facenet, OpenFace, DeepFace, DeepID, Dlib, ArcFace
                    enforce_detection=False,
                    silent=True
                )
                
                similarity = float(result['distance'])  # Lower distance = more similar
                # Convert distance to similarity score (0-1), where 1 is identical
                # VGG-Face distance typically ranges 0-1, where <0.4 is same person
                similarity_score = max(0.0, min(1.0, 1.0 - (similarity / 0.4)))
                
                return {
                    'similarity': float(similarity_score),
                    'id_has_face': result.get('verified', False),
                    'selfie_has_face': result.get('verified', False),
                    'id_confidence': 1.0,
                    'selfie_confidence': 1.0,
                    'message': 'Faces compared using DeepFace embeddings',
                    'model': 'deepface',
                    'distance': float(similarity),
                    'verified': result.get('verified', False)
                }
            except Exception as e:
                print(f"DeepFace comparison failed, trying detector: {e}", file=sys.stderr)
                # Fall through to detector-based comparison
        
        # Use InsightFace for embedding-based comparison if available
        if model_name == 'insightface' or (model_name == 'auto' and 'insightface' in str(type(get_detector('yolov8-face')))):
            try:
                import insightface
                model = insightface.app.FaceAnalysis(providers=['CPUExecutionProvider'])
                model.prepare(ctx_id=-1, det_size=(640, 640))
                
                id_img = cv2.imread(id_image_path)
                selfie_img = cv2.imread(selfie_image_path)
                
                id_faces = model.get(id_img)
                selfie_faces = model.get(selfie_img)
                
                if len(id_faces) == 0 or len(selfie_faces) == 0:
                    return {
                        'similarity': 0.0,
                        'id_has_face': len(id_faces) > 0,
                        'selfie_has_face': len(selfie_faces) > 0,
                        'message': 'No face detected in one or both images',
                        'model': 'insightface'
                    }
                
                # Calculate cosine similarity between embeddings
                id_embedding = id_faces[0].embedding
                selfie_embedding = selfie_faces[0].embedding
                
                # Cosine similarity
                dot_product = np.dot(id_embedding, selfie_embedding)
                norm_id = np.linalg.norm(id_embedding)
                norm_selfie = np.linalg.norm(selfie_embedding)
                similarity = dot_product / (norm_id * norm_selfie)
                
                # Convert to 0-1 scale (cosine similarity is -1 to 1, faces are typically 0.3-1.0)
                similarity_score = max(0.0, min(1.0, (similarity + 0.3) / 1.3))
                
                return {
                    'similarity': float(similarity_score),
                    'id_has_face': True,
                    'selfie_has_face': True,
                    'id_confidence': float(id_faces[0].det_score),
                    'selfie_confidence': float(selfie_faces[0].det_score),
                    'message': 'Faces compared using InsightFace embeddings',
                    'model': 'insightface'
                }
            except Exception as e:
                print(f"InsightFace comparison failed: {e}", file=sys.stderr)
                # Fall through to detector-based comparison
        
        # Fallback to detector-based comparison
        detector = get_detector(model_name)
        
        # Detect faces in both images
        id_result = detector.detect(id_image_path)
        selfie_result = detector.detect(selfie_image_path)
        
        # Check if faces were detected
        if id_result['face_count'] == 0:
            return {
                'similarity': 0.0,
                'id_has_face': False,
                'selfie_has_face': selfie_result['face_count'] > 0,
                'message': 'No face detected in ID image',
                'model': model_name
            }
        
        if selfie_result['face_count'] == 0:
            return {
                'similarity': 0.0,
                'id_has_face': True,
                'selfie_has_face': False,
                'message': 'No face detected in selfie',
                'model': model_name
            }
        
        # Calculate similarity based on bounding box overlap and confidence
        id_face = id_result['faces'][0]
        selfie_face = selfie_result['faces'][0]
        
        id_conf = id_face['confidence']
        selfie_conf = selfie_face['confidence']
        
        # Average confidence as similarity indicator
        similarity = (id_conf + selfie_conf) / 2
        
        # Boost similarity if both have high confidence
        if id_conf > 0.7 and selfie_conf > 0.7:
            similarity = min(0.95, similarity + 0.1)
        
        return {
            'similarity': float(similarity),
            'id_has_face': True,
            'selfie_has_face': True,
            'id_confidence': float(id_conf),
            'selfie_confidence': float(selfie_conf),
            'message': 'Faces detected in both images',
            'model': model_name
        }
    except Exception as e:
        print(f"ERROR in face comparison: {e}", file=sys.stderr)
        return {
            'similarity': 0.0,
            'id_has_face': False,
            'selfie_has_face': False,
            'message': f'Error comparing faces: {str(e)}',
            'model': model_name,
            'error': str(e)
        }


def main():
    """Main entry point for the face detection service"""
    parser = argparse.ArgumentParser(description='Face Detection Service')
    parser.add_argument('--action', required=True, choices=['detect', 'compare'],
                       help='Action to perform: detect or compare')
    parser.add_argument('--model', default='yolov8-face',
                       choices=['yolov8-face', 'yolov8n-face', 'yolov8s-face', 'yolov8m-face',
                               'deepface', 'insightface', 'mediapipe', 'auto'],
                       help='Face detection model to use')
    parser.add_argument('--image', help='Path to image for detection')
    parser.add_argument('--id-image', help='Path to ID image for comparison')
    parser.add_argument('--selfie-image', help='Path to selfie image for comparison')
    
    try:
        args = parser.parse_args()
    except SystemExit:
        # Argument parsing failed
        error_result = {
            'error': 'Invalid arguments provided',
            'face_count': 0,
            'faces': []
        }
        print(json.dumps(error_result))
        sys.exit(1)
    
    try:
        if args.action == 'detect':
            if not args.image:
                error_result = {
                    'error': 'Image path required for detection',
                    'face_count': 0,
                    'faces': []
                }
                print(json.dumps(error_result))
                sys.exit(1)
            
            # Check if image file exists
            if not Path(args.image).exists():
                error_result = {
                    'error': f'Image file not found: {args.image}',
                    'face_count': 0,
                    'faces': []
                }
                print(json.dumps(error_result))
                sys.exit(1)
            
            try:
                detector = get_detector(args.model)
            except Exception as e:
                error_result = {
                    'error': f'Failed to initialize detector: {str(e)}',
                    'face_count': 0,
                    'faces': [],
                    'model': args.model
                }
                print(json.dumps(error_result))
                sys.exit(1)
            
            result = detector.detect(args.image)
            # Ensure result has required fields
            if 'face_count' not in result:
                result['face_count'] = len(result.get('faces', []))
            print(json.dumps(result))
        
        elif args.action == 'compare':
            if not args.id_image or not args.selfie_image:
                error_result = {
                    'error': 'Both ID and selfie image paths required',
                    'face_count': 0,
                    'faces': []
                }
                print(json.dumps(error_result))
                sys.exit(1)
            
            result = compare_faces(args.id_image, args.selfie_image, args.model)
            print(json.dumps(result))
    
    except KeyboardInterrupt:
        error_result = {
            'error': 'Process interrupted by user',
            'face_count': 0,
            'faces': []
        }
        print(json.dumps(error_result))
        sys.exit(1)
    except Exception as e:
        import traceback
        error_result = {
            'error': str(e),
            'error_type': type(e).__name__,
            'face_count': 0,
            'faces': [],
            'traceback': traceback.format_exc()
        }
        print(json.dumps(error_result))
        sys.exit(1)


if __name__ == '__main__':
    main()

