import sys
import os
from pypdf import PdfReader

def read_pdf(file_path):
    print(f"\n--- Reading: {os.path.basename(file_path)} ---")
    try:
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        print(text)
    except Exception as e:
        print(f"Error reading PDF {file_path}: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        for file_path in sys.argv[1:]:
            read_pdf(file_path)
    else:
        print("Please provide file paths.")
