import easyocr
import cv2

# Initialize the reader (English 'en' is default)
# If you have a GPU, it will automatically use it for 10x speed
reader = easyocr.Reader(['en']) 

# Read text from an image
results = reader.readtext('household_item.jpg')

# Print everything found
for (bbox, text, confidence) in results:
    print(f"Detected: {text} (Confidence: {confidence:.2f})")