"""粘连量化：对 stills/G1 做连通分量分析，找内容区内间距 < 30px 的分量对。"""
import glob, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = sys.argv[2] if len(sys.argv) > 2 else os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "stills", "G1")
# 内容区（去 HUD 顶部 y<105、字幕带 y>632）
Y0, Y1 = 105, 632

pairs_stat = {}
for f in sorted(glob.glob(f"{SRC}/f_*.png")):
    im = np.array(Image.open(f).convert("L")).astype(np.uint8)
    h, w = im.shape
    crop = im[Y0:Y1, :]
    # 去幕底：点阵波点小且规律，连通分量面积 <60 的当噪声跳过
    binimg = crop > 60
    lab, n = ndimage.label(binimg)
    if n == 0:
        continue
    objs = ndimage.find_objects(lab)
    boxes = []
    for i, sl in enumerate(objs):
        if sl is None:
            continue
        ys, xs = sl
        area = (ys.stop - ys.start) * (xs.stop - xs.start)
        if (lab[sl] == i + 1).sum() < 60:
            continue
        boxes.append((xs.start, xs.stop, ys.start + Y0, ys.stop + Y0, i + 1))
    # 两两最近距离（bbox 间距）
    close = []
    for i in range(len(boxes)):
        for j in range(i + 1, len(boxes)):
            a, b = boxes[i], boxes[j]
            dx = max(0, max(a[0] - b[1], b[0] - a[1]))
            dy = max(0, max(a[2] - b[3], b[2] - a[3]))
            d = (dx * dx + dy * dy) ** 0.5
            if d < 30:
                close.append((round(d), (a[0] + a[1]) // 2, (a[2] + a[3]) // 2, (b[0] + b[1]) // 2, (b[2] + b[3]) // 2))
    if close:
        import os
        print(f"{os.path.basename(f)}: {len(boxes)} 分量, <30px 近邻 {len(close)} 对")
        for d, ax, ay, bx, by in sorted(close)[:8]:
            print(f"   {d:2.0f}px  ({ax},{ay}) ↔ ({bx},{by})")
