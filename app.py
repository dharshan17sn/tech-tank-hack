from flask import Flask, render_template, request
import os
import torch
import torch.nn.functional as F
from torchvision import transforms
from PIL import Image

from cnn_model import SimpleCNN
  # Make sure it's accessible

app = Flask(__name__)
UPLOAD_FOLDER = "static/uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

MODEL_PATH = "model/plant_disease_cnn.pth"
CLASS_FILE = "class_names.txt"
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ====== Load Classes ======
with open(CLASS_FILE, "r") as f:
    class_names = [line.strip() for line in f.readlines()]

# ====== Load Model ======
model = SimpleCNN(num_classes=len(class_names))
model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
model = model.to(device)
model.eval()

# ====== Image Transform ======
transform = transforms.Compose([
    transforms.Resize((64, 64)),
    transforms.ToTensor()
])

def predict_image(path):
    image = Image.open(path).convert("RGB")
    image = transform(image).unsqueeze(0).to(device)
    with torch.no_grad():
        output = model(image)
        probs = F.softmax(output, dim=1)
        top_prob, top_idx = probs[0].max(0)
        raw_label = class_names[top_idx.item()]

        # Split the class label
        if "___" in raw_label:
            crop, disease = raw_label.split("___")
        if "healthy" in disease.lower():
            disease = "No disease detected (Healthy)"
        else:
            crop, disease = "Unknown", raw_label
        return crop, disease.replace("_", " "), top_prob.item()

@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        file = request.files["file"]
        if file:
            path = os.path.join(UPLOAD_FOLDER, file.filename)
            file.save(path)
            crop, disease, confidence = predict_image(path)
            return render_template("index.html", file=file.filename, crop=crop, disease=disease, confidence=confidence)
    return render_template("index.html")

if __name__ == "__main__":
    app.run(debug=True)
