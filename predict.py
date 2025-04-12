import torch
import torch.nn.functional as F
from torchvision import transforms
from PIL import Image
import sys

# ====== Load Model Definition ======
from train_cnn import SimpleCNN  # Make sure it's accessible

MODEL_PATH = "model/plant_disease_cnn.pth"
CLASS_FILE = "class_names.txt"

# ====== Load Classes ======
with open(CLASS_FILE, "r") as f:
    class_names = [line.strip() for line in f.readlines()]

# ====== Load Model ======
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = SimpleCNN(num_classes=len(class_names))
model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
model = model.to(device)
model.eval()

# ====== Transform ======
transform = transforms.Compose([
    transforms.Resize((64, 64)),
    transforms.ToTensor()
])

# ====== Predict Function ======
def predict(image_path):
    image = Image.open(image_path).convert("RGB")
    image = transform(image).unsqueeze(0).to(device)
    with torch.no_grad():
        output = model(image)
        probs = F.softmax(output, dim=1)
        top_prob, top_idx = probs[0].max(0)
        label = class_names[top_idx.item()]
        return label, top_prob.item()

# ====== Run from CLI ======
if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python predict.py path/to/image.jpg")
        sys.exit(1)

    img_path = sys.argv[1]
    label, confidence = predict(img_path)
    print(f"🧪 Prediction: {label} ({confidence*100:.2f}% confidence)")
