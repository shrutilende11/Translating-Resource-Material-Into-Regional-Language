import os
import cv2
import base64
import easyocr
import numpy as np
from PIL import Image
from gtts import gTTS
from flask_cors import CORS
from pydub import AudioSegment
import speech_recognition as sr
import io, requests, random, string
from flask import Flask, request, jsonify
from moviepy.editor import VideoFileClip, AudioFileClip, concatenate_audioclips


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

def perform_translation(text, target_language, source_langauge = "en"):
    result = requests.post('https://langtransapi.onrender.com/translate', json={'text': text, 'target_lang': target_language, 'source_lang': source_langauge}).json()
    return result

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


def generate_random_filename():
    letters_and_digits = string.ascii_letters + string.digits
    return ''.join(random.choice(letters_and_digits) for _ in range(10))

def text_to_speech(text, lang='en'):
    tts = gTTS(text=text, lang=lang)
    
    audio_dir = os.path.join(os.getcwd(), 'audio')
    
    random_filename = generate_random_filename()
    
    temp_audio_path = os.path.join(audio_dir, random_filename + '.mp3')
    tts.save(temp_audio_path)
    
    return temp_audio_path


def extract_audio_from_video(video_file, output_audio_dir):
    video_path = os.path.join(output_audio_dir, f"temp_video_{os.path.splitext(video_file.filename)[0]}.mp4")
    
    # Save the video file
    video_file.save(video_path)

    # Open the video file using moviepy
    video_clip = VideoFileClip(video_path)

    # Extract audio from the video
    audio_clip = video_clip.audio

    # Generate a unique name for the audio file
    audio_filename = f"extracted_audio_{os.path.splitext(video_file.filename)[0]}.wav"
    output_audio_path = os.path.join(output_audio_dir, audio_filename)

    # Save the audio file
    audio_clip.write_audiofile(output_audio_path)

    # Close the video and audio clips
    video_clip.close()
    audio_clip.close()

    return output_audio_path, video_path


def extract_text_from_audio(audio_path, language="en"):
    # Initialize the recognizer
    recognizer = sr.Recognizer()

    # Open the audio file
    with sr.AudioFile(audio_path) as audio_file:
        # Recognize the speech in the audio file
        try:
            audio_data = recognizer.record(audio_file)
            text = recognizer.recognize_google(audio_data, language=language)
            return text
        except sr.UnknownValueError:
            return "Speech Recognition could not understand audio"
        except sr.RequestError as e:
            return f"Could not request results from Google Speech Recognition service; {e}"


def create_tts_audio(text, language, output_dir):
    tts = gTTS(text, lang=language, slow=False)
    audio_filename = f"tts_audio_{language}.mp3"
    output_audio_path = os.path.join(output_dir, audio_filename)
    tts.save(output_audio_path)
    return output_audio_path

def replace_audio_in_video(video_path, new_audio_path, output_video_path):
    # Open the original video clip
    video_clip = VideoFileClip(video_path)

    # Open the new audio clip
    new_audio_clip = AudioFileClip(new_audio_path)

    # Set the audio of the video clip to the new audio clip
    video_clip = video_clip.set_audio(new_audio_clip)

    # Write the new video clip to a file
    video_clip.write_videofile(output_video_path, codec='libx264', audio_codec='aac')

    # Close the clips
    video_clip.close()
    new_audio_clip.close()

    return output_video_path

def convert_audio_format(input_audio_path, output_audio_path, target_format='mp3'):
    audio = AudioSegment.from_file(input_audio_path)
    audio.export(output_audio_path, format=target_format)


# Route for translating text to another language 
@app.route('/translate', methods=['POST'])
def translate_text():
    try:
        data = request.get_json()

        if 'text' not in data or 'target_language' not in data or 'source_language' not in data:
            return jsonify({'error': 'Missing required fields'}), 400

        text_to_translate = data['text']
        target_language = data['target_language']
        source_language = data['source_language']

        result = perform_translation(text_to_translate, target_language, source_language)

        return jsonify(result), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
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
        ocr_result = eval(renderer).readtext(processed_image, detail=0)

        # Join the lines with a space
        result_string = ' '.join(ocr_result)
        print(result_string)

        result = perform_translation(result_string, target_language, source_language)

        return jsonify({'result': result}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    

@app.route('/video-translate', methods=['POST'])
def translate_video_tts():
    try:
        print("Received translation request")

        # Check if the request contains the necessary fields
        if 'video' not in request.files or 'target_language' not in request.form or 'source_language' not in request.form:
            return jsonify({'error': 'Missing required fields'}), 400

        # Get the video file and target/source languages from the request
        video_file = request.files['video']
        target_language = request.form['target_language']
        source_language = request.form['source_language']

        # Validate if the target/source language is supported
        if target_language not in supported_languages or source_language not in supported_languages:
            return jsonify({'error': 'Unsupported target/source language'}), 400

        # Specify the output directory for audio and video files
        output_dir = os.getcwd() + "/temp/"

        # Step 1: Extract audio from video
        audio_file_path, temp_video_path = extract_audio_from_video(video_file, output_dir)

        # Step 2: Extract text from audio
        text_from_audio = extract_text_from_audio(audio_file_path, language=source_language)
        print(f"Extracted Text ({target_language}):")
        print(text_from_audio)

        # Step 3: Perform translation
        result = requests.post('https://langtransapi.onrender.com/translate', json={'text': text_from_audio, 'target_lang': target_language, 'source_lang': source_language}).json()

        print(result, "result")

        # Step 4: Create TTS audio
        tts_audio_path = create_tts_audio(result['translated_text'], target_language, output_dir)

        # Load video duration
        video_duration = VideoFileClip(temp_video_path).duration

        # Load TTS audio clip
        tts_audio_clip = AudioFileClip(tts_audio_path)

        # Check if TTS audio duration matches video duration
        if tts_audio_clip.duration < video_duration:
            # If TTS audio is shorter, repeat it to match the video duration
            repeated_tts_audio_clip = concatenate_audioclips([tts_audio_clip] * (int(video_duration // tts_audio_clip.duration) + 1))
            # Trim the repeated audio to match the video duration
            repeated_tts_audio_clip = repeated_tts_audio_clip.subclip(0, video_duration)
            # Save the modified audio
            repeated_tts_audio_path = os.path.join(output_dir, "repeated_tts_audio.mp3")
            repeated_tts_audio_clip.write_audiofile(repeated_tts_audio_path)
            # Use the repeated audio for the video
            custom_audio_path = repeated_tts_audio_path
        elif tts_audio_clip.duration > video_duration:
            # If TTS audio is longer, trim it to match the video duration
            tts_audio_clip = tts_audio_clip.subclip(0, video_duration)
            # Save the trimmed audio
            trimmed_tts_audio_path = os.path.join(output_dir, "trimmed_tts_audio.mp3")
            tts_audio_clip.write_audiofile(trimmed_tts_audio_path)
            # Use the trimmed audio for the video
            custom_audio_path = trimmed_tts_audio_path
        else:
            # If TTS audio duration matches video duration, use it as is
            custom_audio_path = tts_audio_path

        # Close the TTS audio clip
        tts_audio_clip.close()

        # step 5

        input_video_path = os.path.join(output_dir, f"temp_video_{os.path.splitext(video_file.filename)[0]}.mp4")

        output_video_path = os.path.join(output_dir, f"final_trans_video{os.path.splitext(video_file.filename)[0]}.mp4")

        # Create the final video clip
        video_clip = VideoFileClip(input_video_path)
        video_clip = video_clip.set_audio(AudioFileClip(custom_audio_path).set_duration(video_clip.duration))

        # Save the final video to a temporary file
        temp_output_path = os.path.join(output_dir, "temp_output_video.mp4")
        video_clip.write_videofile(temp_output_path, codec="libx264", audio_codec="aac", fps=24)

        # Close the video clip to release the file handle
        video_clip.close()

        # Read the content of the temporary file into a BytesIO buffer
        video_buffer = io.BytesIO()
        with open(temp_output_path, 'rb') as temp_file:
            video_buffer.write(temp_file.read())

        # Remove the temporary file
        # os.remove(temp_output_path)

        # Convert the video buffer to base64 encoding
        video_base64 = base64.b64encode(video_buffer.getvalue()).decode('utf-8')

        # Optionally, you can delete the audio files here if needed
        os.remove(audio_file_path)
        os.remove(tts_audio_path)
        # os.remove(temp_video_path)

        # Return the result along with the base64 encoded video
        return jsonify({'result': result, 'temp_output_path': temp_output_path}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=8000)
