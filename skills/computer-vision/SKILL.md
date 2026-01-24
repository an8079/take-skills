---
name: computer-vision
description: "计算机视觉技能：图像分类、目标检测、OCR、图像分割、风格迁移、超分辨率。用于电商商品图识别、文档数字化、内容审核等场景。"
tags: [computer-vision, object-detection, image-classification, ocr, segmentation, super-resolution, style-transfer]
---

# 计算机视觉技能

## When to Use This Skill

触发此技能当：
- 设计电商商品图像识别系统
- 文档数字化（OCR 提取文字）
- 图像分类或目标检测
- 图像分割与风格迁移
- 超分辨率图像增强
- 内容审核（检测敏感内容）

## Not For / Boundaries

此技能不适用于：
- 视频分析（请用视频处理专用技能）
- 3D 图像处理（仅限 2D 图像）
- 实时视频流处理（需专用流处理框架）

## Quick Reference

### 主流 CV 模型

| 任务 | 推荐模型 | 输入尺寸 | 推理速度 |
|------|-----------|----------|----------|
| 图像分类 | ConvNeXt/ViT | 224x224 | Fast |
| 目标检测 | YOLO/RT-DETR/Faster R-CNN | 640x640 | Fast |
| 语义分割 | SAM/Mask2Former | 512x512 | Medium |
| 实例分割 | Mask R-CNN/Mask3D | 512x512 | Medium |
| OCR | TrOCR/PaddleOCR | - | Slow |
| 风格迁移 | Stable Diffusion/CycleGAN | 512x512 | Slow |
| 超分辨率 | ESRGAN/SwinIR | 256x256 | Slow |

### CV 框架对比

| 框架 | 特点 | 适用场景 | 学习曲线 |
|------|------|----------|----------|
| **PyTorch** | 灵活，生态完整 | 研究/原型 | 中等 |
| **TensorFlow** | 生产部署成熟 | 企业级应用 | 较陡 |
| **OpenCV** | 传统算法，CPU 高效 | 实时处理 | 无需学习 |
| **Hugging Face** | 预训练模型丰富 | 快速应用 | 较低 |
| **MMCV** | 轻量级算法库 | 嵌入式/移动端 | 平坦 |
| **Ultralytics** | YOLO 训练 | 目标检测最佳选择 | 中等 |

## 核心组件

### 1. 图像预处理

```python
import cv2
import numpy as np
from albumentations import Compose, Resize, Normalize, HorizontalFlip, ColorJitter

# 预处理 Pipeline
preprocess = Compose([
    Resize(224, 224),           # 统一尺寸
    Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),  # ImageNet 标准化
    HorizontalFlip(p=0.5),   # 数据增强
    ColorJitter(brightness=0.2, contrast=0.2),  # 颜色抖动
])

def augment_image(image_path, num_samples=10):
    """对单张图像进行数据增强"""

    image = cv2.imread(image_path)
    images = [image]

    for _ in range(num_samples - 1):
        augmented = preprocess(image=image)
        images.append(augmented['image'])

    return images

# 批量预处理目录
def preprocess_directory(input_dir, output_dir):
    """预处理整个目录"""

    for filename in os.listdir(input_dir):
        if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
            img_path = os.path.join(input_dir, filename)
            image = cv2.imread(img_path)
            processed = preprocess(image=image)['image']

            # 保存预处理后的图像
            output_path = os.path.join(output_dir, filename)
            cv2.imwrite(output_path, processed)
```

### 2. 图像分类

```python
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image

# 使用预训练模型（迁移学习）
def create_image_classifier(num_classes=100, use_pretrained=True):
    """创建图像分类模型"""

    # 加载预训练 ResNet50
    if use_pretrained:
        model = models.resnet50(pretrained=True)
        # 修改最后一层适应分类数量
        num_features = model.fc.in_features
        model.fc = nn.Linear(num_features, num_classes)
    else:
        model = models.resnet50(num_classes=num_classes)

    # 数据预处理
    transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                            std=[0.229, 0.224, 0.225]),
    ])

    return model, transform

# 推理
def classify_image(model, image_path, transform, device='cuda'):
    """图像分类"""

    # 加载图像
    image = Image.open(image_path)
    input_tensor = transform(image).unsqueeze(0).to(device)

    # 推理
    model.eval()
    with torch.no_grad():
        outputs = model(input_tensor)
        _, preds = torch.max(outputs, 1)

    return {
        'predicted_class': preds.item(),
        'confidence': torch.nn.functional.softmax(outputs, dim=1)[0][preds].item()
    }
```

### 3. 目标检测（电商商品识别）

```python
import cv2
import torch

# 使用 YOLO 模型
def load_yolo_model(model_path):
    """加载 YOLO 模型"""

    # 方案1：OpenCV DNN
    net = cv2.dnn.readNetFromDarknet(model_path)

    # 方案2：PyTorch YOLO
    model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True)
    model.to('cuda')
    return model

def detect_objects(image_path, model, conf_threshold=0.5):
    """目标检测"""

    # YOLOv8 预处理
    from ultralytics import YOLO

    yolo = YOLO('yolov8n.pt')
    results = yolo(image_path)

    # 过滤低置信度结果
    detections = []
    for result in results:
        if result.boxes.confidence[0] >= conf_threshold:
            detections.append({
                'class': result.boxes.cls[0],
                'bbox': result.boxes.xyxy.tolist(),  # [x1, y1, x2, y2]
                'confidence': result.boxes.confidence[0].item()
            })

    return detections

# 电商商品检测输出格式
def format_product_detections(detections, class_names):
    """格式化商品检测结果为业务格式"""

    products = []
    for det in detections:
        class_id = int(det['class'])
        class_name = class_names[class_id]

        # 计算边界框
        x1, y1, x2, y2 = det['bbox']
        width, height = x2 - x1, y2 - y1

        products.append({
            'product_type': class_name,
            'bbox': {
                'x': x1, 'y': y1,
                'width': width, 'height': height
            },
            'confidence': det['confidence']
        })

    return products
```

### 4. OCR 文字识别

```python
import cv2
import pytesseract
from PIL import Image

# Tesseract OCR
def ocr_image(image_path, lang='chi_sim', config='--psm 6'):
    """使用 Tesseract 进行 OCR"""

    # 加载图像
    image = Image.open(image_path)

    # OCR 识别
    text = pytesseract.image_to_string(
        image,
        lang=lang,
        config=config
    )

    return {
        'text': text,
        'confidence': None  # Tesseract 不直接返回置信度
    }

# 使用 PaddleOCR（推荐，中文效果更好）
from paddleocr import PaddleOCR

def ocr_with_paddle(image_path):
    """使用 PaddleOCR 进行中英文识别"""

    ocr = PaddleOCR(use_angle_cls=True, lang='ch')

    result = ocr.ocr(image_path)

    return {
        'text': result[1][0],  # 识别的文字
        'confidence': float(result[1][1]) if result[1][1] != '0' else 0.0,
        'boxes': [  # 每个文字的边界框
            [line[0], line[1][0], line[1][2], line[2][2]]
            for line in result[0]
        ]
    }

# 文档数字化流程
def digitize_document(document_images):
    """将文档图像转换为文本"""

    full_text = ""
    for i, img_path in enumerate(sorted(document_images)):
        # OCR 识别
        ocr_result = ocr_with_paddle(img_path)

        # 添加页码和分隔符
        full_text += f"=== 第 {i+1} 页 ===\n"
        full_text += ocr_result['text'] + "\n\n"

    return full_text
```

### 5. 图像分割

```python
import torch
from torchvision import transforms
from transformers import SamModel, SamProcessor

# Segment Anything Model (SAM)
def load_sam_model():
    """加载 SAM 模型"""

    processor = SamProcessor.from_pretrained('facebook/sam-vit-huge')
    model = SamModel.from_pretrained('facebook/sam-vit-huge')

    return model, processor

def segment_image(image_path, model, processor):
    """语义图像分割"""

    from PIL import Image

    image = Image.open(image_path)
    inputs = processor(image, return_tensors="pt")

    # 分割
    with torch.no_grad():
        outputs = model(**inputs)

    # 后处理获取 mask
    masks = processor.image_processor.post_process_masks(
        outputs.prediction_masks,
        inputs.original_sizes,
    )

    # 选择最佳 mask
    best_mask = masks[0]  # 多个输出选第一个

    return {
        'mask': best_mask,
        'shape': best_mask.shape
    }
```

### 6. 风格迁移

```python
import torch
from torchvision import transforms
from diffusers import StableDiffusionPipeline

# Stable Diffusion 风格迁移
def setup_style_transfer(style_prompt="photo, 8k, unreal engine"):
    """设置风格迁移模型"""

    pipe = StableDiffusionPipeline.from_pretrained(
        "runwayml/stable-diffusion-v1-5",
        torch_dtype=torch.float16
    )

    return pipe

def transfer_style(source_image_path, style_description, num_inference_steps=30):
    """图像风格迁移"""

    pipe = setup_style_transfer()

    # 加载源图像
    from PIL import Image
    source = Image.open(source_image_path).convert("RGB")

    # 生成风格迁移图像
    prompt = f"A {style_description} style photograph"

    images = pipe(
        prompt=prompt,
        image=source,
        num_inference_steps=num_inference_steps,
        guidance_scale=7.5
    )

    # 保存结果
    images[0].save("style_transferred.png")

    return images[0]
```

### 7. 超分辨率

```python
import torch
import torch.nn as nn

# ESRGAN 超分辨率
class ESRGAN(nn.Module):
    """ESRGAN 超分辨率网络"""

    def __init__(self, num_rrdb=23, num_filters=64):
        super().__init__()
        # RRDB 块
        self.rrdb = ResidualInResidualDenseBlock(num_rrdb, num_filters)
        # 上采样层
        self.up_sample = nn.Upsample(scale_factor=4, mode='bicubic')

    def forward(self, x):
        # RRDB 处理
        x = self.rrdb(x)
        # 上采样
        x = self.up_sample(x)
        return x

def super_resolve_image(low_res_path, model_path):
    """超分辨率重建"""

    from PIL import Image
    import torchvision.transforms as T

    # 加载模型
    esrgan = ESRGAN()
    esrgan.load_state_dict(torch.load(model_path))
    esrgan.eval()

    # 图像预处理
    transform = T.Compose([
        T.ToTensor(),
    T.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))
    ])

    # 加载低分辨率图像
    lr_img = Image.open(low_res_path).convert('RGB')
    lr_tensor = transform(lr_img).unsqueeze(0)

    # 超分辨率重建
    with torch.no_grad():
        sr_tensor = esrgan(lr_tensor)

    # 保存结果
    sr_img = T.ToPIL()(sr_tensor.squeeze(0))
    sr_img.save("super_resolved.png")

    return sr_img
```

## Examples

### Example 1: 电商商品图识别

**场景：** 电商平台需要自动识别商品图片中的商品

**实现：**
```python
import cv2
from ultralytics import YOLO
from PIL import Image

# 初始化 YOLO 模型
model = YOLO('yolov8n.pt')
class_names = model.names  # ['T恤', '裤子', '鞋子', '包包', '配饰', ...]

def analyze_product_image(image_path):
    """分析商品图片"""

    # 目标检测
    results = model(image_path)

    # 处理检测结果
    products = []
    for result in results:
        if result.boxes.confidence[0] > 0.6:  # 高置信度阈值
            cls_id = int(result.boxes.cls[0])
            class_name = class_names[cls_id]

            # 获取边界框
            box = result.boxes.xyxy[0]  # [x1, y1, x2, y2]

            # 裁剪商品区域
            x1, y1, x2, y2 = box
            cropped = Image.open(image_path).crop((x1, y1, x2, y2))

            products.append({
                'class': class_name,
                'bbox': {'x': x1, 'y': y1, 'width': x2-x1, 'height': y2-y1},
                'confidence': result.boxes.confidence[0].item()
            })

    return products

# 批量处理
product_dir = "product_images/"
for filename in os.listdir(product_dir):
    if filename.endswith(('.jpg', '.png')):
        products = analyze_product_image(os.path.join(product_dir, filename))
        print(f"{filename}: 检测到 {len(products)} 个商品")
```

**预期输出：** 每张图片识别出 1-5 个商品及类别

### Example 2: 文档数字化

**场景：** 将扫描的合同/发票转换为可编辑文本

**实现：**
```python
import cv2
from paddleocr import PaddleOCR

def ocr_document(image_pages):
    """文档 OCR 数字化"""

    ocr = PaddleOCR(use_angle_cls=True, lang='ch')

    full_document = ""
    for i, page_img in enumerate(image_pages):
        # 每页 OCR
        result = ocr.ocr(page_img)

        # 提取文字和边界框
        text = result[1][0]
        boxes = [
            [[line[0], line[1][0], line[1][2], line[2][2]]
            for line in result[0]
        ]

        full_document += f"=== 第 {i+1} 页 ===\n"
        full_document += text + "\n"

    return {
        'text': full_document,
        'layout': boxes  # 保存版面信息用于后期分析
    }
```

**预期输出：** 可搜索的文本内容，保留原文档版面结构

### Example 3: 内容审核（敏感内容检测）

**场景：** UGC 平台需要检测上传图片中的敏感内容

**实现：**
```python
import torch
from torchvision import transforms
from PIL import Image

# NSFW 检测模型
def load_nsfw_model():
    """加载 NSFW 检测模型"""

    model = torch.hub.load('pytorch/vision', 'mobilenet_v3', pretrained=True)
    model.eval()

    return model

def check_image_content(image_path, model, threshold=0.8):
    """检测图片内容是否合规"""

    transform = transforms.Compose([
        transforms.Resize(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                            std=[0.229, 0.224, 0.225]),
    ])

    from PIL import Image
    image = Image.open(image_path).convert('RGB')
    input_tensor = transform(image).unsqueeze(0)

    # 推理
    with torch.no_grad():
        outputs = model(input_tensor)
        probs = torch.nn.functional.softmax(outputs, dim=1)

    # NSFW 概率
        nsfw_prob = probs[0][1].item()

    return {
        'is_safe': nsfw_prob < threshold,  # 概率低于阈值为安全
        'confidence': 1 - nsfw_prob,  # 安全置信度
        'classification': 'safe' if nsfw_prob < threshold else 'unsafe'
    }
```

**预期输出：** 图片安全性与置信度，用于决定是否通过审核

## 性能优化

### 模型优化

```python
import torch

# TensorRT 优化
def optimize_model_with_tensorrt(model, output_path):
    """使用 TensorRT 优化模型加速推理"""

    # 导出 ONNX
    torch.onnx.export(model, dummy_input, "model.onnx")

    # 使用 TensorRT 编译 ONNX
    import tensorrt as trt
    TRT_LOGGER = trt.Logger(trt.Logger.WARNING)

    builder = trt.Builder(TRT_LOGGER)
    network = builder.create_network(1)
    parser = trt.OnnxParser(network)

    network = parser.parse_from_file("model.onnx")

    config = builder.create_builder_config(2, 1, 16)
    network = trt.builder.build_serial_network(network, config)

    # 保存优化后的引擎
    with open(output_path, 'wb') as f:
        f.write(network.serialize())
```

### 批量推理优化

```python
import torch
from torch.utils.data import DataLoader

def batch_inference(model, image_paths, batch_size=32, device='cuda'):
    """批量推理优化"""

    transform = transforms.Compose([
        transforms.Resize(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                            std=[0.229, 0.224, 0.225]),
    ])

    # 数据集
    from torchvision.datasets import ImageFolder
    dataset = ImageFolder(root=image_paths, transform=transform)

    # 数据加载器
    dataloader = DataLoader(
        dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=4,
        pin_memory=True
    )

    # 批量推理
    model.to(device)
    model.eval()

    results = []
    with torch.no_grad():
        for batch in dataloader:
            batch = batch[0].to(device)
            outputs = model(batch)
            results.extend(outputs)

    return results
```

## References

- [Ultralytics YOLO Guide](https://docs.ultralytics.com/)
- [MMCV Framework](https://docs.mmcv.ai/)
- [OpenCV Documentation](https://docs.opencv.org/)
- [Segment Anything Paper](https://arxiv.org/abs/2304.02643)
- [Hugging Face Vision](https://huggingface.co/docs/transformers/vision_models_index)

## Maintenance

- 来源：基于计算机视觉最佳实践和主流框架文档
- 最后更新：2026-01-24
- 已知限制：
  - 实时视频处理需专用流处理框架
  - 3D 处理不在本技能范围内
  - 模型选择需根据具体场景评估性能和成本
