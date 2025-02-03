from flask import Flask, request, jsonify
from flask_cors import CORS
import easyocr
import io
import cv2
import numpy as np  # Add this line

app = Flask(__name__)
CORS(app)

hiReader = easyocr.Reader(['hi', 'en'], gpu=False)
teReader = easyocr.Reader(['te', 'en'], gpu=False)
bnReader = easyocr.Reader(['bn', 'en'], gpu=False)
mrReader = easyocr.Reader(['mr', 'en'], gpu=False)
esReader = easyocr.Reader(['es', 'en'], gpu=False)
frReader = easyocr.Reader(['fr', 'en'], gpu=False)
deReader = easyocr.Reader(['de', 'en'], gpu=False)
jaReader = easyocr.Reader(['ja', 'en'], gpu=False)
ruReader = easyocr.Reader(['ru', 'en'], gpu=False)
enReader = easyocr.Reader(['en'], gpu=False)

supported_languages = ["hi", "bn", "ta", "te", "mr", "es", "fr", "de", "ja", "ru", "en"]
language_mapping = {
    "hi": "hin",
    "bn": "ben",
    "ta": "tam",
    "te": "tel",
    "mr": "mar",
    "es": "spa",
    "fr": "fra",
    "de": "deu",
    "ja": "jpn",
    "ru": "rus",
    "en": "eng"
}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg', 'gif'}

def preprocess_image(image_bytes):
    # Convert the image bytes to a NumPy array
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # Convert the image to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Apply GaussianBlur to reduce noise and improve OCR accuracy
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # Apply adaptive thresholding to create a binary image
    _, thresholded = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    return thresholded

@app.route('/', methods=['POST'])
def hello():
    return "Hello world"

@app.route('/image-translate', methods=['POST'])
def imgtranslate():
    try:
        if 'image' not in request.files or 'target_language' not in request.form or 'source_language' not in request.form:
            return jsonify({'error': 'Missing required fields'}), 400

        image_file = request.files['image']
        target_language = request.form['target_language']
        source_language = request.form['source_language']

        if target_language not in supported_languages or source_language not in supported_languages:
            return jsonify({'error': 'Unsupported target language'}), 400
        
        if image_file and allowed_file(image_file.filename):
            image_bytes = image_file.read()

        # Preprocess the image
        processed_image = preprocess_image(image_bytes)

        renderer = source_language + "Reader"
        result = eval(renderer).readtext(processed_image, detail=0)

        # Join the lines with a space
        result_string = ' '.join(result)

        return jsonify({'result': result_string}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
