from flask import Flask, request, jsonify
from flask_cors import CORS
import PyPDF2
import google.generativeai as genai
import io
import pandas as pd
from PIL import Image
import pytesseract
import os
from docx import Document  

app = Flask(__name__)
CORS(app)

pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'


GEMINI_API_KEY = "AIzaSyDm2ODVscz6kNEsHPo4yWlyyRMiGXWFLQA"
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.0-flash')

def extract_text_from_file(file_stream, filename):
    try:
        ext = os.path.splitext(filename)[1].lower()
        
        if ext == '.pdf':
            reader = PyPDF2.PdfReader(file_stream)
            return ''.join([page.extract_text() for page in reader.pages])
        
        elif ext in ('.png', '.jpg', '.jpeg'):
            image = Image.open(file_stream)
            return pytesseract.image_to_string(image)
        
        elif ext in ('.xls', '.xlsx'):
            df = pd.read_excel(file_stream)
            return df.to_string()
        
        elif ext == '.txt':
            return file_stream.read().decode('utf-8')
        
        elif ext == '.docx':
            doc = Document(file_stream)
            return '\n'.join([paragraph.text for paragraph in doc.paragraphs])
        
        else:
            return "Unsupported file format"
    
    except Exception as e:
        return str(e)

@app.route('/ask', methods=['POST'])
def ask_question():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    question = request.form.get('question', '')
    
    if not question:
        return jsonify({"error": "No question provided"}), 400
    
    try:
        filename = file.filename
        file_content = file.read()
        file_stream = io.BytesIO(file_content)
        
        text = extract_text_from_file(file_stream, filename)
        if not text:
            return jsonify({"error": "Could not extract text from file"}), 400
        
        prompt = f"""Analyze this document and answer the question. If the answer cannot be found in the document, 
        clearly state that the information is not available in the provided document.
        
        DOCUMENT CONTENT:
        {text}
        
        QUESTION: {question}
        
        ANSWER:"""
        
        response = model.generate_content(prompt)
        return jsonify({"answer": response.text})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)