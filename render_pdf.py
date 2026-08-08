import os
import subprocess

chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
pdf_output = r"c:\Users\Tushar PC\Downloads\project\Presentation.pdf"
html_path = r"c:\Users\Tushar PC\Downloads\project\presentation.html"

cmd = [
    chrome_path,
    "--headless=new",
    f"--print-to-pdf={pdf_output}",
    "--no-pdf-header-footer",
    "--landscape",
    html_path
]

print("Rendering Presentation.pdf with Chrome...")
res = subprocess.run(cmd, capture_output=True, text=True)
print("Return code:", res.returncode)
if os.path.exists(pdf_output):
    print("SUCCESS: Presentation.pdf generated! Size:", os.path.getsize(pdf_output), "bytes")
else:
    print("ERROR:", res.stderr)
