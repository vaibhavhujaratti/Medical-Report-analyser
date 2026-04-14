import pytesseract
from PIL import Image
import json
import os

# --- IMPORTANT SETUP ---
# Set the path to your Tesseract installation
import platform
if platform.system() == 'Windows':
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
# -----------------------

def image_to_json(image_path: str, output_filepath: str = None) -> str:
    """
    Accepts an image path, performs OCR, and saves the extracted text
    as a list of strings (line by line) in a JSON file.

    Args:
        image_path: The file path to the image (e.g., 'lab_report.png').
        output_filepath: The path where the JSON file will be saved.

    Returns:
        A confirmation message or an error message.
    """
    if output_filepath is None:
        output_filepath = os.path.join(os.path.dirname(__file__), 'result.json')
    if not os.path.exists(image_path):
        return f"Error: Image file not found at: {image_path}"

    try:
        # 1. Perform OCR
        img = Image.open(image_path)
        custom_config = r'--oem 3 --psm 6'
        raw_text = pytesseract.image_to_string(img, config=custom_config)

        # 2. Clean and Structure the Data
        
        # --- THIS IS THE KEY CHANGE ---
        # Instead of joining the lines, create a list of non-empty, stripped lines.
        lines_list = [line.strip() for line in raw_text.splitlines() if line.strip()]
        # --- END OF CHANGE ---

        json_output = {
            "image_source": os.path.basename(image_path),
            "extracted_text": lines_list,  # The value is now the list of strings
            "line_count": len(lines_list)
        }
        
        # 3. Write the JSON object to the specified file
        with open(output_filepath, 'w', encoding='utf-8') as f:
            json.dump(json_output, f, indent=4)

        return f"Success! OCR results saved to: {output_filepath}"

    except pytesseract.TesseractNotFoundError:
        return "Error: Tesseract is not installed or not in your PATH. Please check 'pytesseract.tesseract_cmd'."
    except Exception as e:
        return f"An unexpected error occurred: {str(e)}"


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        image_file = sys.argv[1]
        # Accept optional output path from command line, default to result.json
        if len(sys.argv) > 2:
            output_file = sys.argv[2]
        else:
            output_file = os.path.join(os.path.dirname(__file__), 'result.json')
        status_message = image_to_json(image_file, output_file)
        print(status_message)
    else:
        print("Error: No image path provided")
