import os
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms
from torch.utils.data import DataLoader, random_split, Subset
from collections import defaultdict
from tqdm import tqdm

# ==================== CONFIG ====================
DATA_DIR = "dataset"
MODEL_PATH = "model/plant_disease_cnn.pth"
CLASS_NAMES_PATH = "class_names.txt"
MAX_SAMPLES_PER_CLASS = 30
EPOCHS = 10
BATCH_SIZE = 16
LEARNING_RATE = 0.001

# Auto-detect GPU
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"💻 Using device: {'🟢 GPU' if device.type == 'cuda' else '⚪ CPU'}")

# ==================== TRANSFORMS ====================
print("🧪 Preparing image transforms...")
transform = transforms.Compose([
    transforms.Resize((64, 64)),
    transforms.ToTensor()
])

# ==================== LOAD DATA ====================
print("📂 Loading dataset...")
full_dataset = datasets.ImageFolder(DATA_DIR, transform=transform)
class_names = full_dataset.classes

# Save class names to file
with open(CLASS_NAMES_PATH, "w") as f:
    f.write("\n".join(class_names))

print(f"📊 Total images: {len(full_dataset)} | Classes: {len(class_names)}")

# ==================== LIMIT PER CLASS ====================
print(f"🔎 Limiting to {MAX_SAMPLES_PER_CLASS} images per class...")
class_indices = defaultdict(list)
for idx, (_, label) in enumerate(full_dataset):
    class_indices[label].append(idx)

limited_indices = []
for indices in class_indices.values():
    limited_indices.extend(indices[:MAX_SAMPLES_PER_CLASS])

limited_dataset = Subset(full_dataset, limited_indices)
print(f"✅ Limited dataset size: {len(limited_dataset)}")

# ==================== SPLIT DATA ====================
train_size = int(0.8 * len(limited_dataset))
val_size = len(limited_dataset) - train_size
train_dataset, val_dataset = random_split(limited_dataset, [train_size, val_size])

train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=0)
val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, num_workers=0)

print(f"🧪 Train size: {len(train_dataset)} | Validation size: {len(val_dataset)}")

# ==================== DEFINE MODEL ====================
print("🧠 Initializing model...")

class SimpleCNN(nn.Module):
    def __init__(self, num_classes):
        super(SimpleCNN, self).__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(3, 32, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
            nn.Conv2d(32, 64, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2)
        )
        self.fc = nn.Sequential(
            nn.Linear(64 * 16 * 16, 256), nn.ReLU(),
            nn.Linear(256, num_classes)
        )

    def forward(self, x):
        x = self.conv(x)
        x = x.view(x.size(0), -1)
        return self.fc(x)

model = SimpleCNN(num_classes=len(class_names)).to(device)

# ==================== TRAINING ====================
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)

print("🚀 Starting training...\n")

for epoch in range(EPOCHS):
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0

    print(f"👉 Epoch {epoch+1}/{EPOCHS}")
    for batch_idx, (images, labels) in enumerate(tqdm(train_loader, desc=f"Epoch {epoch+1}")):
        images, labels = images.to(device), labels.to(device)

        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        running_loss += loss.item()
        _, predicted = outputs.max(1)
        total += labels.size(0)
        correct += predicted.eq(labels).sum().item()

        if batch_idx % 10 == 0:
            print(f"   ✅ Batch {batch_idx}: loss={loss.item():.4f}")

    acc = 100. * correct / total
    avg_loss = running_loss / len(train_loader)
    print(f"\n📘 Epoch {epoch+1} completed — Loss: {avg_loss:.4f} | Accuracy: {acc:.2f}%\n")

# ==================== SAVE MODEL ====================
os.makedirs("model", exist_ok=True)
torch.save(model.state_dict(), MODEL_PATH)
print(f"✅ Model saved at: {MODEL_PATH}") 