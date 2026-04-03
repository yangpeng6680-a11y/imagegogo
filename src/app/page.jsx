'use client';

import { useState, useRef, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { useRouter } from 'next/navigation';

export default function Home() {
  // 状态管理
  const [uploadedImages, setUploadedImages] = useState([]);
  const [currentImageObj, setCurrentImageObj] = useState(null);
  const [backgroundImageObj, setBackgroundImageObj] = useState(null);
  const [useBackground, setUseBackground] = useState(false);
  const [draggingPoint, setDraggingPoint] = useState(null);
  const [isDraggingBg, setIsDraggingBg] = useState(false);
  const [isDraggingFg, setIsDraggingFg] = useState(false);
  // 初始控制点只固定原点(0,0)
  const [controlPoints, setControlPoints] = useState({
    topLeft: { x: 0, y: 0 },
    topRight: { x: 0, y: 0 },
    bottomLeft: { x: 0, y: 0 },
    bottomRight: { x: 0, y: 0 }
  });
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 300 });
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // 引用
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const linkRef = useRef(null);
  const bgUploadAreaRef = useRef(null);
  const fgUploadAreaRef = useRef(null);

  // 初始化
  useEffect(() => {
    // 监听 Firebase Auth 状态
    let unsubscribe = () => {};
    try {
      unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setAuthLoading(false);
      });
    } catch (e) {
      console.error('Firebase Auth error:', e);
      setAuthLoading(false);
    }
    
    // Firebase 超时保护（3秒），避免在中国大陆无法连接 Google 服务器导致一直加载
    const timeoutId = setTimeout(() => {
      setAuthLoading(false);
    }, 3000);
    
    // 初始化下载链接
    if (!linkRef.current) {
      const link = document.createElement('a');
      document.body.appendChild(link);
      linkRef.current = link;
    }
    
    // 设置拖拽上传功能
    const cleanupBg = setupDragAndDrop(bgUploadAreaRef, 'bgUpload', setIsDraggingBg);
    const cleanupFg = setupDragAndDrop(fgUploadAreaRef, 'imageUpload', setIsDraggingFg);
    
    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
      // 清理下载链接
      if (linkRef.current) {
        document.body.removeChild(linkRef.current);
        linkRef.current = null;
      }
      
      // 清理拖拽事件监听器
      if (cleanupBg) cleanupBg();
      if (cleanupFg) cleanupFg();
    };
  }, []);

  // 拖拽上传功能
  const setupDragAndDrop = (ref, inputId, setDraggingState) => {
    if (!ref.current) return;
    
    const area = ref.current;
    
    const handleDragOver = (e) => {
      e.preventDefault();
      area.style.borderColor = '#ff6b9d';
      area.style.backgroundColor = '#fff5f8';
      if (setDraggingState) setDraggingState(true);
    };
    
    const handleDragLeave = () => {
      area.style.borderColor = '#ffb6c1';
      area.style.backgroundColor = 'rgba(255, 240, 245, 0.5)';
      if (setDraggingState) setDraggingState(false);
    };
    
    const handleDrop = (e) => {
      e.preventDefault();
      area.style.borderColor = '#ffb6c1';
      area.style.backgroundColor = 'rgba(255, 240, 245, 0.5)';
      if (setDraggingState) setDraggingState(false);
      
      if (e.dataTransfer.files.length > 0) {
        const input = document.getElementById(inputId);
        input.files = e.dataTransfer.files;
        input.dispatchEvent(new Event('change'));
      }
    };
    
    area.addEventListener('dragover', handleDragOver);
    area.addEventListener('dragleave', handleDragLeave);
    area.addEventListener('drop', handleDrop);
    
    return () => {
      area.removeEventListener('dragover', handleDragOver);
      area.removeEventListener('dragleave', handleDragLeave);
      area.removeEventListener('drop', handleDrop);
    };
  };

  // 处理背景图上传
  const handleBgUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = function(evt) {
      const img = new Image();
      img.onload = function() {
        setBackgroundImageObj(img);
        updateCanvasSizeAndReset();
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  };

  // 生成调整后的图片预览
  const generatePreview = async (imgData) => {
    if (!canvasRef.current) return imgData.originalSrc;
    
    // 获取界面上归一化的控制点比例
    const previewCanvas = canvasRef.current;
    const getScale = (point, prop) => controlPoints[point][prop] / (prop === 'x' ? previewCanvas.width : previewCanvas.height);
    
    const ptsRatio = [
      getScale('topLeft', 'x'), getScale('topLeft', 'y'),
      getScale('topRight', 'x'), getScale('topRight', 'y'),
      getScale('bottomLeft', 'x'), getScale('bottomLeft', 'y'),
      getScale('bottomRight', 'x'), getScale('bottomRight', 'y'),
    ];

    // 以原图分辨率为基准高清导出
    let outWidth, outHeight;
    if (useBackground && backgroundImageObj) {
      outWidth = backgroundImageObj.width;
      outHeight = backgroundImageObj.height;
    } else if (currentImageObj) {
      outWidth = currentImageObj.width;
      outHeight = currentImageObj.height;
    } else {
      return imgData.originalSrc;
    }

    const img = new Image();
    img.src = imgData.originalSrc;
    await new Promise(resolve => img.onload = resolve);
    
    const outCanvas = document.createElement('canvas');
    outCanvas.width = outWidth;
    outCanvas.height = outHeight;
    const outCtx = outCanvas.getContext('2d');
    
    // 画背景
    if (useBackground && backgroundImageObj) {
      outCtx.drawImage(backgroundImageObj, 0, 0, outWidth, outHeight);
    }
    
    // 应用形变，使用图片原始尺寸
    drawPerspectiveImage(outCtx, img,
      0, 0, img.width, 0, 0, img.height, img.width, img.height,
      ptsRatio[0] * outWidth, ptsRatio[1] * outHeight,
      ptsRatio[2] * outWidth, ptsRatio[3] * outHeight,
      ptsRatio[4] * outWidth, ptsRatio[5] * outHeight,
      ptsRatio[6] * outWidth, ptsRatio[7] * outHeight
    );
    
    return outCanvas.toDataURL('image/png', 1.0);
  };

  // 处理前景图批量上传
  const handleImageUpload = (e) => {
    const files = e.target.files;
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) return;
    
    let loadedCount = 0;
    const newImages = [];
    let firstImageRatio = null;
    let isFirstImage = true;
    
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = function(evt) {
        const img = new Image();
        img.onload = function() {
          const imageRatio = img.width / img.height;
          
          // 检查是否是第一张图片
          if (isFirstImage) {
            // 第一张图片，保存比例
            firstImageRatio = imageRatio;
            console.log('First image loaded:', img.width, 'x', img.height, 'aspect ratio:', imageRatio);
            
            // 更新当前显示的图片
            setCurrentImageObj(img);
            
            // 直接调用updateCanvasSizeAndReset函数
            setTimeout(() => {
              updateCanvasSizeAndReset();
            }, 0);
            
            // 标记已处理第一张图片
            isFirstImage = false;
          } else {
            // 非第一张图片，检查比例是否一致
            if (Math.abs(imageRatio - firstImageRatio) > 0.01) {
              alert(`图片 ${file.name} 的比例与第一张图片不一致，请上传相同比例的图片！`);
              return;
            }
            console.log('Additional image loaded:', file.name, 'aspect ratio:', imageRatio);
            // 非第一张图片，不更新currentImageObj
          }
          
          // 添加到图片数组
          const imageData = {
            id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            name: file.name,
            originalSrc: evt.target.result
          };
          
          newImages.push(imageData);
          
          loadedCount++;
          if (loadedCount === validFiles.length) {
            setUploadedImages(prev => [...prev, ...newImages]);
            console.log('Total images uploaded:', newImages.length);
            
            // 生成预览
            newImages.forEach(async (imgData) => {
              const previewSrc = await generatePreview(imgData);
              setUploadedImages(prev => prev.map(item => 
                item.id === imgData.id ? { ...item, previewSrc } : item
              ));
            });
          }
        };
        img.src = evt.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // 点击放大查看图片
  const handlePreviewImage = async (imgData, index) => {
    const previewSrc = imgData.previewSrc || await generatePreview(imgData);
    
    // 创建预览窗口
    const previewWindow = window.open('', '_blank', 'width=800,height=600');
    previewWindow.document.write('<html><head><title>图片预览</title><style>body{font-family:Arial,sans-serif;margin:20px;}h1{text-align:center;color:#ff6b9d;}img{max-width:100%;height:auto;margin:10px 0;border:1px solid #ddd;}h3{margin-top:0;color:#666;}p{text-align:center;color:#999;}</style></head><body>');
    previewWindow.document.write(`<h1>📷 图片预览</h1>`);
    previewWindow.document.write(`<h3>${imgData.name}</h3>`);
    previewWindow.document.write(`<img src="${previewSrc}" alt="${imgData.name}">`);
    previewWindow.document.write(`<p>第 ${index + 1} 张，共 ${uploadedImages.length} 张</p>`);
    previewWindow.document.write('</body></html>');
    previewWindow.document.close();
  };

  // 更新画布大小并重置
  const updateCanvasSizeAndReset = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    // 调整最大限制，确保16:9的图片不会超出屏幕
    const maxWidth = 900;
    const maxHeight = 600;
    
    let width, height;

    // 1. 确定画布尺寸基准
    if (useBackground && backgroundImageObj) {
      // 有背景图时，以背景图为基准
      width = backgroundImageObj.width;
      height = backgroundImageObj.height;
    } else if (currentImageObj) {
      // 无背景图时，以需要修改的图片为基准
      width = currentImageObj.width;
      height = currentImageObj.height;
    } else {
      // 无图片时的默认尺寸
      width = 400;
      height = 300;
    }

    console.log('Original image size:', width, 'x', height, 'aspect ratio:', width/height);

    // 2. 确保画布不超出最大限制，但保持原始比例
    if (width > maxWidth) {
      height = height * (maxWidth / width);
      width = maxWidth;
    }
    if (height > maxHeight) {
      width = width * (maxHeight / height);
      height = maxHeight;
    }

    console.log('Canvas size after scaling:', width, 'x', height, 'aspect ratio:', width/height);

    canvas.width = width;
    canvas.height = height;
    setCanvasSize({ width, height });

    // 3. 重置控制点
    resetControlPoints();
  };

  // 重置控制点
  const resetControlPoints = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    let tlx, tly, trx, try_, blx, bly, brx, bry;

    if (currentImageObj) {
      console.log('Current image size:', currentImageObj.width, 'x', currentImageObj.height);
      console.log('Canvas size:', canvas.width, 'x', canvas.height);
      
      // 计算缩放比例，确保图片能够完整显示在画布内
      // 取较小的缩放比例，确保图片不会超出画布
      const scale = Math.min(
        (canvas.width * 0.8) / currentImageObj.width, // 留10%的边距
        (canvas.height * 0.8) / currentImageObj.height
      );
      const drawW = currentImageObj.width * scale;
      const drawH = currentImageObj.height * scale;
      
      // 计算居中位置的偏移量，确保前景图在画布中完全居中
      const offsetX = (canvas.width - drawW) / 2;
      const offsetY = (canvas.height - drawH) / 2;
      
      console.log('Scale:', scale, 'Draw size:', drawW, 'x', drawH);
      console.log('Offset:', offsetX, offsetY);
      
      // 设置控制点，使前景图在画布中居中显示
      tlx = offsetX;
      tly = offsetY;
      trx = offsetX + drawW;
      try_ = offsetY;
      blx = offsetX;
      bly = offsetY + drawH;
      brx = offsetX + drawW;
      bry = offsetY + drawH;
      
      console.log('Control points:', { tlx, tly, trx, try_, blx, bly, brx, bry });
    } else {
      // 无图片时的默认占位
      tlx = 0; tly = 0;
      trx = canvas.width; try_ = 0;
      blx = 0; bly = canvas.height;
      brx = canvas.width; bry = canvas.height;
    }

    setControlPoints({
      topLeft: { x: tlx, y: tly },
      topRight: { x: trx, y: try_ },
      bottomLeft: { x: blx, y: bly },
      bottomRight: { x: brx, y: bry }
    });
  };

  // 绘制画布
  const redrawCanvas = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // 1. 清空画布并绘制背景
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (useBackground && backgroundImageObj) {
      ctx.drawImage(backgroundImageObj, 0, 0, canvas.width, canvas.height);
    }

    if (!currentImageObj) return;

    // 获取控制点坐标
    const pts = [
      controlPoints.topLeft.x, controlPoints.topLeft.y,
      controlPoints.topRight.x, controlPoints.topRight.y,
      controlPoints.bottomLeft.x, controlPoints.bottomLeft.y,
      controlPoints.bottomRight.x, controlPoints.bottomRight.y
    ];

    // 2. 绘制形变后的前景图叠加在背景上
    drawPerspectiveImage(ctx, currentImageObj, 
      0, 0, currentImageObj.width, 0, 0, currentImageObj.height, currentImageObj.width, currentImageObj.height,
      pts[0], pts[1], pts[2], pts[3], pts[4], pts[5], pts[6], pts[7]
    );

    // 3. 绘制辅助网格线
    ctx.strokeStyle = 'rgba(255, 107, 157, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]); // 虚线更美观
    ctx.beginPath();
    ctx.moveTo(pts[0], pts[1]); ctx.lineTo(pts[2], pts[3]);
    ctx.lineTo(pts[6], pts[7]); ctx.lineTo(pts[4], pts[5]);
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);
  };

  // 线性插值
  const lerp = (a, b, t) => a + (b - a) * t;

  // 判断点是否在四边形内
  const pointInQuad = (px, py, x1, y1, x2, y2, x3, y3, x4, y4) => {
    function cross(ax, ay, bx, by) { return ax * by - ay * bx; }
    function vec(a, b) { return [b[0]-a[0], b[1]-a[1]]; }
    const p = [px, py];
    const A = [x1, y1], B = [x2, y2], C = [x3, y3], D = [x4, y4];
    const c1 = cross(vec(A,B)[0], vec(A,B)[1], vec(A,p)[0], vec(A,p)[1]);
    const c2 = cross(vec(B,C)[0], vec(B,C)[1], vec(B,p)[0], vec(B,p)[1]);
    const c3 = cross(vec(C,D)[0], vec(C,D)[1], vec(C,p)[0], vec(C,p)[1]);
    const c4 = cross(vec(D,A)[0], vec(D,A)[1], vec(D,p)[0], vec(D,p)[1]);
    return (c1 >= 0 && c2 >= 0 && c3 >= 0 && c4 >= 0) || (c1 <= 0 && c2 <= 0 && c3 <= 0 && c4 <= 0);
  };

  // 将点映射到单位正方形
  const mapPointToUnitSquare = (x, y, x1, y1, x2, y2, x3, y3, x4, y4) => {
    let u = 0.5, v = 0.5;
    for (let i = 0; i < 5; i++) {
      const xu = (1 - v) * ((1 - u) * x1 + u * x2) + v * ((1 - u) * x3 + u * x4);
      const yu = (1 - v) * ((1 - u) * y1 + u * y2) + v * ((1 - u) * y3 + u * y4);
      const dxdu = (1 - v) * (x2 - x1) + v * (x4 - x3);
      const dxdv = -(1 - u) * x1 - u * x2 + (1 - u) * x3 + u * x4;
      const dydu = (1 - v) * (y2 - y1) + v * (y4 - y3);
      const dydv = -(1 - u) * y1 - u * y2 + (1 - u) * y3 + u * y4;
      const det = dxdu * dydv - dxdv * dydu;
      if (Math.abs(det) < 1e-6) break;
      const dx = x - xu, dy = y - yu;
      u += (dx * dydv - dy * dxdv) / det;
      v += (dy * dxdu - dx * dydu) / det;
      if (u < 0) u = 0; if (u > 1) u = 1;
      if (v < 0) v = 0; if (v > 1) v = 1;
    }
    return [u, v];
  };

  // 双线性插值
  const bilinearInterpolate = (x, y, width, height, data) => {
    const x1 = Math.floor(x), y1 = Math.floor(y);
    const x2 = Math.min(x1 + 1, width - 1), y2 = Math.min(y1 + 1, height - 1);
    const dx = x - x1, dy = y - y1;
    
    function getP(xi, yi) {
      const i = (yi * width + xi) * 4;
      return [data[i], data[i+1], data[i+2], data[i+3]];
    }
    const c1 = getP(x1, y1), c2 = getP(x2, y1), c3 = getP(x1, y2), c4 = getP(x2, y2);
    
    return [
      lerp(lerp(c1[0], c2[0], dx), lerp(c3[0], c4[0], dx), dy),
      lerp(lerp(c1[1], c2[1], dx), lerp(c3[1], c4[1], dx), dy),
      lerp(lerp(c1[2], c2[2], dx), lerp(c3[2], c4[2], dx), dy),
      lerp(lerp(c1[3], c2[3], dx), lerp(c3[3], c4[3], dx), dy)
    ];
  };

  // 绘制透视变换图像
  const drawPerspectiveImage = (ctx, img, 
    srcX1, srcY1, srcX2, srcY2, srcX3, srcY3, srcX4, srcY4,
    destX1, destY1, destX2, destY2, destX3, destY3, destX4, destY4) => {
    
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // 离屏渲染原图（使用图片原始尺寸，避免拉伸）
    const offscreen = document.createElement('canvas');
    offscreen.width = img.width;
    offscreen.height = img.height;
    const offscreenCtx = offscreen.getContext('2d', { willReadFrequently: true });
    offscreenCtx.clearRect(0, 0, img.width, img.height);
    offscreenCtx.drawImage(img, 0, 0, img.width, img.height);
    const imgData = offscreenCtx.getImageData(0, 0, img.width, img.height);
    const data = imgData.data;

    // 获取目标画布当前的像素（包含了已经画好的背景！）
    const output = ctx.getImageData(0, 0, width, height);
    const outData = output.data;

    const minX = Math.max(0, Math.floor(Math.min(destX1, destX2, destX3, destX4)));
    const maxX = Math.min(width, Math.ceil(Math.max(destX1, destX2, destX3, destX4)));
    const minY = Math.max(0, Math.floor(Math.min(destY1, destY2, destY3, destY4)));
    const maxY = Math.min(height, Math.ceil(Math.max(destY1, destY2, destY3, destY4)));

    for (let y = minY; y < maxY; y++) {
      for (let x = minX; x < maxX; x++) {
        if (!pointInQuad(x, y, destX1, destY1, destX2, destY2, destX4, destY4, destX3, destY3)) continue;

        const [u, v] = mapPointToUnitSquare(x, y, destX1, destY1, destX2, destY2, destX3, destY3, destX4, destY4);
        // 使用图片原始尺寸进行映射，避免拉伸
        const srcX = u * img.width;
        const srcY = v * img.height;

        // 双线性插值，获取原图的 [r, g, b, a]
        const color = bilinearInterpolate(srcX, srcY, img.width, img.height, data);
        
        const idx = (y * width + x) * 4;
        
        // Alpha透明度混合计算 (前景色 Over 背景色)
        const srcAlpha = color[3] / 255;
        const bgAlpha = outData[idx + 3] / 255;
        const outAlpha = srcAlpha + bgAlpha * (1 - srcAlpha);

        if (outAlpha > 0) {
          outData[idx] = Math.round((color[0] * srcAlpha + outData[idx] * bgAlpha * (1 - srcAlpha)) / outAlpha);
          outData[idx + 1] = Math.round((color[1] * srcAlpha + outData[idx + 1] * bgAlpha * (1 - srcAlpha)) / outAlpha);
          outData[idx + 2] = Math.round((color[2] * srcAlpha + outData[idx + 2] * bgAlpha * (1 - srcAlpha)) / outAlpha);
          outData[idx + 3] = Math.round(outAlpha * 255);
        }
      }
    }

    // 直接将处理好的带有背景的像素塞回画布
    ctx.putImageData(output, 0, 0);
  };



  // 批量下载
  const handleDownloadAll = async () => {
    if (uploadedImages.length === 0) return alert('请先上传需要拉伸的图片！');
    if (useBackground && !backgroundImageObj) return alert('你开启了底图模式，请上传一张背景图！');
    
    if (!canvasRef.current || !linkRef.current) return;
    
    // 获取界面上归一化的控制点比例
    const previewCanvas = canvasRef.current;
    const getScale = (point, prop) => controlPoints[point][prop] / (prop === 'x' ? previewCanvas.width : previewCanvas.height);
    
    const ptsRatio = [
      getScale('topLeft', 'x'), getScale('topLeft', 'y'),
      getScale('topRight', 'x'), getScale('topRight', 'y'),
      getScale('bottomLeft', 'x'), getScale('bottomLeft', 'y'),
      getScale('bottomRight', 'x'), getScale('bottomRight', 'y'),
    ];

    const link = linkRef.current;

    // 以原图分辨率为基准高清导出
    let outWidth, outHeight;
    if (useBackground && backgroundImageObj) {
      outWidth = backgroundImageObj.width;
      outHeight = backgroundImageObj.height;
    } else if (currentImageObj) {
      outWidth = currentImageObj.width;
      outHeight = currentImageObj.height;
    } else {
      return;
    }

    console.log('Processing', uploadedImages.length, 'images with control points ratio:', ptsRatio);

    for (let i = 0; i < uploadedImages.length; i++) {
      const imgData = uploadedImages[i];
      const img = new Image();
      img.src = imgData.originalSrc;
      await new Promise(resolve => img.onload = resolve);
      
      console.log('Processing image:', imgData.name, img.width, 'x', img.height);
      
      const outCanvas = document.createElement('canvas');
      outCanvas.width = outWidth;
      outCanvas.height = outHeight;
      const outCtx = outCanvas.getContext('2d');
      
      // 画背景
      if (useBackground && backgroundImageObj) {
        outCtx.drawImage(backgroundImageObj, 0, 0, outWidth, outHeight);
      }
      
      // 应用形变，使用图片原始尺寸
      drawPerspectiveImage(outCtx, img,
        0, 0, img.width, 0, 0, img.height, img.width, img.height,
        ptsRatio[0] * outWidth, ptsRatio[1] * outHeight,
        ptsRatio[2] * outWidth, ptsRatio[3] * outHeight,
        ptsRatio[4] * outWidth, ptsRatio[5] * outHeight,
        ptsRatio[6] * outWidth, ptsRatio[7] * outHeight
      );
      
      link.href = outCanvas.toDataURL('image/png', 1.0);
      link.download = `合成_${imgData.name.replace(/\.[^/.]+$/, "")}.png`;
      link.click();
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    alert(`✅ 搞定！${uploadedImages.length} 张图片已全部处理并下载。`);
  };

  // 重置形变
  const handleReset = () => {
    updateCanvasSizeAndReset();
  };

  // 一键预览所有图片
  const handlePreviewAll = async () => {
    if (uploadedImages.length === 0) return alert('请先上传需要拉伸的图片！');
    if (useBackground && !backgroundImageObj) return alert('你开启了底图模式，请上传一张背景图！');
    
    if (!canvasRef.current) return;
    
    // 获取界面上归一化的控制点比例
    const previewCanvas = canvasRef.current;
    const getScale = (point, prop) => controlPoints[point][prop] / (prop === 'x' ? previewCanvas.width : previewCanvas.height);
    
    const ptsRatio = [
      getScale('topLeft', 'x'), getScale('topLeft', 'y'),
      getScale('topRight', 'x'), getScale('topRight', 'y'),
      getScale('bottomLeft', 'x'), getScale('bottomLeft', 'y'),
      getScale('bottomRight', 'x'), getScale('bottomRight', 'y'),
    ];

    // 以原图分辨率为基准高清导出
    let outWidth, outHeight;
    if (useBackground && backgroundImageObj) {
      outWidth = backgroundImageObj.width;
      outHeight = backgroundImageObj.height;
    } else if (currentImageObj) {
      outWidth = currentImageObj.width;
      outHeight = currentImageObj.height;
    } else {
      return;
    }

    console.log('Previewing', uploadedImages.length, 'images with control points ratio:', ptsRatio);

    // 创建预览窗口
    const previewWindow = window.open('', '_blank', 'width=800,height=600');
    previewWindow.document.write('<html><head><title>图片预览</title><style>body{font-family:Arial,sans-serif;margin:20px;}h1{text-align:center;color:#ff6b9d;}img{max-width:100%;height:auto;margin:10px 0;border:1px solid #ddd;} .preview-container{display:flex;flex-wrap:wrap;gap:10px;}.preview-item{flex:1 1 300px;}h3{margin-top:0;color:#666;}</style></head><body>');
    previewWindow.document.write('<h1>📷 图片预览</h1>');
    previewWindow.document.write('<div class="preview-container">');

    for (let i = 0; i < uploadedImages.length; i++) {
      const imgData = uploadedImages[i];
      const img = new Image();
      img.src = imgData.originalSrc;
      await new Promise(resolve => img.onload = resolve);
      
      console.log('Previewing image:', imgData.name, img.width, 'x', img.height);
      
      const outCanvas = document.createElement('canvas');
      outCanvas.width = outWidth;
      outCanvas.height = outHeight;
      const outCtx = outCanvas.getContext('2d');
      
      // 画背景
      if (useBackground && backgroundImageObj) {
        outCtx.drawImage(backgroundImageObj, 0, 0, outWidth, outHeight);
      }
      
      // 应用形变，使用图片原始尺寸
      drawPerspectiveImage(outCtx, img,
        0, 0, img.width, 0, 0, img.height, img.width, img.height,
        ptsRatio[0] * outWidth, ptsRatio[1] * outHeight,
        ptsRatio[2] * outWidth, ptsRatio[3] * outHeight,
        ptsRatio[4] * outWidth, ptsRatio[5] * outHeight,
        ptsRatio[6] * outWidth, ptsRatio[7] * outHeight
      );
      
      // 添加到预览窗口
      const dataURL = outCanvas.toDataURL('image/png', 1.0);
      previewWindow.document.write(`<div class="preview-item"><h3>${imgData.name}</h3><img src="${dataURL}" alt="${imgData.name}"></div>`);
    }

    previewWindow.document.write('</div></body></html>');
    previewWindow.document.close();
  };

  // 处理控制点拖拽开始
  const handleDragStart = (point, e) => {
    const startDragging = (e) => {
      let isDragging = true;
      let dragPoint = point;
      setDraggingPoint(point);
      const rect = e.target.getBoundingClientRect();
      let offsetX = e.clientX - rect.left;
      let offsetY = e.clientY - rect.top;

      const handleMouseMove = (e) => {
        if (!isDragging || !dragPoint) return;
        
        if (!containerRef.current || !canvasRef.current) return;
        
        const containerRect = containerRef.current.getBoundingClientRect();
        const canvas = canvasRef.current;
        
        let x = e.clientX - containerRect.left - offsetX;
        let y = e.clientY - containerRect.top - offsetY;
        
        // 限制在画布范围内
        x = Math.max(0, Math.min(x, canvas.width));
        y = Math.max(0, Math.min(y, canvas.height));
        
        // 防止各点交叉
        switch(dragPoint) {
          case 'topLeft':
            x = Math.min(x, controlPoints.topRight.x || canvas.width);
            y = Math.min(y, controlPoints.bottomLeft.y || canvas.height);
            break;
          case 'topRight':
            x = Math.max(x, controlPoints.topLeft.x || 0);
            y = Math.min(y, controlPoints.bottomRight.y || canvas.height);
            break;
          case 'bottomLeft':
            x = Math.min(x, controlPoints.bottomRight.x || canvas.width);
            y = Math.max(y, controlPoints.topLeft.y || 0);
            break;
          case 'bottomRight':
            x = Math.max(x, controlPoints.bottomLeft.x || 0);
            y = Math.max(y, controlPoints.topRight.y || 0);
            break;
        }
        
        // 更新控制点
        setControlPoints(prev => ({
          ...prev,
          [dragPoint]: { x, y }
        }));
      };

      const handleMouseUp = () => {
        isDragging = false;
        dragPoint = null;
        setDraggingPoint(null);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    startDragging(e);
    e.preventDefault();
  };

  // 处理数值输入变化
  const handleNumericInputChange = (point, axis, value) => {
    const numValue = parseInt(value) || 0;
    let clamped = numValue;
    
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    if (axis === 'x') {
      clamped = Math.max(0, Math.min(numValue, canvas.width));
    } else {
      clamped = Math.max(0, Math.min(numValue, canvas.height));
    }
    
    setControlPoints(prev => ({
      ...prev,
      [point]: {
        ...prev[point],
        [axis]: clamped
      }
    }));
  };

  // 监听图片对象变化，更新画布尺寸
  useEffect(() => {
    if (currentImageObj || (useBackground && backgroundImageObj)) {
      console.log('Image object changed, updating canvas size');
      updateCanvasSizeAndReset();
    }
  }, [currentImageObj, backgroundImageObj, useBackground]);

  // 当控制点变化时，重新生成所有图片的预览
  useEffect(() => {
    if (uploadedImages.length > 0) {
      uploadedImages.forEach(async (imgData) => {
        const previewSrc = await generatePreview(imgData);
        setUploadedImages(prev => prev.map(item => 
          item.id === imgData.id ? { ...item, previewSrc } : item
        ));
      });
    }
  }, [controlPoints, currentImageObj, backgroundImageObj, useBackground]);

  // 监听控制点变化，重绘画布
  useEffect(() => {
    redrawCanvas();
  }, [controlPoints, currentImageObj, backgroundImageObj, useBackground, canvasSize]);

  // Auth loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-white to-pink-200 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-pink-300 border-t-pink-600 rounded-full animate-spin mb-4"></div>
          <p className="text-pink-600">加载中...</p>
        </div>
      </div>
    );
  }

  // Not logged in - show login screen
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-white to-pink-200 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center">
          <h1 className="text-2xl font-bold text-pink-600 mb-2">🌸 图片变形编辑器</h1>
          <p className="text-gray-500 mb-8">登录后即可使用图片处理功能</p>
          <button
            onClick={handleGoogleLogin}
            className="w-full bg-white border-2 border-gray-200 rounded-lg px-4 py-3 flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="font-medium text-gray-700">使用 Google 账号登录</span>
          </button>
        </div>
      </div>
    );
  }

  // Logged in - show main app
  return (
    <div className="container">
      {/* User info header */}
      <div className="flex items-center justify-end gap-3 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-b-xl shadow-sm">
        <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full" />
        <span className="text-sm text-gray-600">{user.email}</span>
        <button
          onClick={handleGoogleLogout}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          退出
        </button>
      </div>
      <h1>🌸 批量图片拉伸编辑器 🌸</h1>

      <div className="card">
        <div className="upload-header">
          <h3>📁 准备素材</h3>
          <div className="upload-status">
            {uploadedImages.length > 0 
              ? `已准备：<strong>${uploadedImages.length}</strong> 张需拉伸图片` 
              : '当前未选择图片'
            }
          </div>
        </div>
        
        <div className="upload-grid">
          <div className="bg-control-box">
            <div className="toggle-container">
              <label className="switch">
                <input 
                  type="checkbox" 
                  id="enableBgToggle"
                  checked={useBackground}
                  onChange={(e) => {
                    setUseBackground(e.target.checked);
                    updateCanvasSizeAndReset();
                  }}
                />
                <span className="slider"></span>
              </label>
              <label className="toggle-label" htmlFor="enableBgToggle">启用背景图底板</label>
            </div>
            
            <div id="bgUploadSection" style={{ display: useBackground ? 'block' : 'none', height: 'calc(100% - 40px)' }}>
              <label 
                ref={bgUploadAreaRef}
                className="upload-area" 
                htmlFor="bgUpload"
                id="bgUploadArea"
              >
                <input 
                  type="file" 
                  id="bgUpload" 
                  accept="image/jpeg,image/png" 
                  className="hidden"
                  onChange={handleBgUpload}
                />
                <div className="upload-icon">🖼️</div>
                <div className="upload-text">
                  <h4 id="bgUploadTitle">{backgroundImageObj ? '✅ 已加载背景图' : '上传背景底图'}</h4>
                  <p>合成时将以背景尺寸为最终画布</p>
                </div>
              </label>
            </div>
            <div id="bgDisabledHint" style={{ display: useBackground ? 'none' : 'block', color: '#ffb6c1', fontSize: '14px', marginTop: '10px' }}>
              开启后可上传底图，前景图将合成在底图上。
            </div>
          </div>

          <div>
            <label 
              ref={fgUploadAreaRef}
              className="upload-area" 
              htmlFor="imageUpload"
              id="fgUploadArea"
            >
              <input 
                type="file" 
                id="imageUpload" 
                accept="image/jpeg,image/png" 
                multiple 
                className="hidden"
                onChange={handleImageUpload}
              />
              <div className="upload-icon">🎀</div>
              <div className="upload-text">
                <h4>上传需要拉伸的图片</h4>
                <p>支持多选，批量应用相同形变</p>
              </div>
            </label>
          </div>
        </div>

        <div className="thumbnail-container" id="thumbnailContainer" style={{ display: uploadedImages.length > 0 ? 'block' : 'none' }}>
          <div className="thumbnail-title">已上传图片队列：</div>
          <div className="thumbnails" id="thumbnailsBox">
            {uploadedImages.map(img => (
              <img 
                key={img.id} 
                src={img.originalSrc} 
                alt={img.name} 
                className="thumbnail-item"
                title={img.name}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h3>✨ 四角拉伸调节 ✨</h3>
        <div className="adjustment-container">
          <div className="image-canvas-wrapper transparent-bg">
            <div className="canvas-container" id="canvasContainer" ref={containerRef} style={{ width: 'auto', height: 'auto' }}>
              <canvas 
                ref={canvasRef}
                id="imageCanvas"
                className="image-canvas"
                width={canvasSize.width}
                height={canvasSize.height}
              ></canvas>
              <div 
                className={`control-point top-left ${draggingPoint === 'topLeft' ? 'dragging' : ''}`}
                id="topLeft"
                style={{ left: `${controlPoints.topLeft.x}px`, top: `${controlPoints.topLeft.y}px` }}
                onMouseDown={(e) => handleDragStart('topLeft', e)}
              ></div>
              <div 
                className={`control-point top-right ${draggingPoint === 'topRight' ? 'dragging' : ''}`}
                id="topRight"
                style={{ left: `${controlPoints.topRight.x}px`, top: `${controlPoints.topRight.y}px` }}
                onMouseDown={(e) => handleDragStart('topRight', e)}
              ></div>
              <div 
                className={`control-point bottom-left ${draggingPoint === 'bottomLeft' ? 'dragging' : ''}`}
                id="bottomLeft"
                style={{ left: `${controlPoints.bottomLeft.x}px`, top: `${controlPoints.bottomLeft.y}px` }}
                onMouseDown={(e) => handleDragStart('bottomLeft', e)}
              ></div>
              <div 
                className={`control-point bottom-right ${draggingPoint === 'bottomRight' ? 'dragging' : ''}`}
                id="bottomRight"
                style={{ left: `${controlPoints.bottomRight.x}px`, top: `${controlPoints.bottomRight.y}px` }}
                onMouseDown={(e) => handleDragStart('bottomRight', e)}
              ></div>
            </div>
          </div>
          
          <div className="numeric-controls">
            <div className="corner-control-group">
              <div className="corner-title">↖️ 左上角</div>
              <div className="coordinate-inputs">
                <div className="input-group">
                  <label htmlFor="tlX">X坐标:</label>
                  <input 
                    type="number" 
                    id="tlX"
                    className="w-full px-3 py-2 border-2 border-secondary rounded-lg text-primary font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    value={Math.round(controlPoints.topLeft.x)}
                    onChange={(e) => handleNumericInputChange('topLeft', 'x', e.target.value)}
                    min="0"
                    max={canvasSize.width}
                    step="1"
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="tlY">Y坐标:</label>
                  <input 
                    type="number" 
                    id="tlY"
                    className="w-full px-3 py-2 border-2 border-secondary rounded-lg text-primary font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    value={Math.round(controlPoints.topLeft.y)}
                    onChange={(e) => handleNumericInputChange('topLeft', 'y', e.target.value)}
                    min="0"
                    max={canvasSize.height}
                    step="1"
                  />
                </div>
              </div>
            </div>
            
            <div className="corner-control-group">
              <div className="corner-title">↗️ 右上角</div>
              <div className="coordinate-inputs">
                <div className="input-group">
                  <label htmlFor="trX">X坐标:</label>
                  <input 
                    type="number" 
                    id="trX"
                    className="w-full px-3 py-2 border-2 border-secondary rounded-lg text-primary font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    value={Math.round(controlPoints.topRight.x)}
                    onChange={(e) => handleNumericInputChange('topRight', 'x', e.target.value)}
                    min="0"
                    max={canvasSize.width}
                    step="1"
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="trY">Y坐标:</label>
                  <input 
                    type="number" 
                    id="trY"
                    className="w-full px-3 py-2 border-2 border-secondary rounded-lg text-primary font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    value={Math.round(controlPoints.topRight.y)}
                    onChange={(e) => handleNumericInputChange('topRight', 'y', e.target.value)}
                    min="0"
                    max={canvasSize.height}
                    step="1"
                  />
                </div>
              </div>
            </div>
            
            <div className="corner-control-group">
              <div className="corner-title">↙️ 左下角</div>
              <div className="coordinate-inputs">
                <div className="input-group">
                  <label htmlFor="blX">X坐标:</label>
                  <input 
                    type="number" 
                    id="blX"
                    className="w-full px-3 py-2 border-2 border-secondary rounded-lg text-primary font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    value={Math.round(controlPoints.bottomLeft.x)}
                    onChange={(e) => handleNumericInputChange('bottomLeft', 'x', e.target.value)}
                    min="0"
                    max={canvasSize.width}
                    step="1"
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="blY">Y坐标:</label>
                  <input 
                    type="number" 
                    id="blY"
                    className="w-full px-3 py-2 border-2 border-secondary rounded-lg text-primary font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    value={Math.round(controlPoints.bottomLeft.y)}
                    onChange={(e) => handleNumericInputChange('bottomLeft', 'y', e.target.value)}
                    min="0"
                    max={canvasSize.height}
                    step="1"
                  />
                </div>
              </div>
            </div>
            
            <div className="corner-control-group">
              <div className="corner-title">↘️ 右下角</div>
              <div className="coordinate-inputs">
                <div className="input-group">
                  <label htmlFor="brX">X坐标:</label>
                  <input 
                    type="number" 
                    id="brX"
                    className="w-full px-3 py-2 border-2 border-secondary rounded-lg text-primary font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    value={Math.round(controlPoints.bottomRight.x)}
                    onChange={(e) => handleNumericInputChange('bottomRight', 'x', e.target.value)}
                    min="0"
                    max={canvasSize.width}
                    step="1"
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="brY">Y坐标:</label>
                  <input 
                    type="number" 
                    id="brY"
                    className="w-full px-3 py-2 border-2 border-secondary rounded-lg text-primary font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    value={Math.round(controlPoints.bottomRight.y)}
                    onChange={(e) => handleNumericInputChange('bottomRight', 'y', e.target.value)}
                    min="0"
                    max={canvasSize.height}
                    step="1"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <p className="tip-text" id="dragTipText">
            拖动四个角点或输入数值来精确拉伸图片形状（不可超出当前画布）
          </p>
        </div>
      </div>

      <div className="card">
        <h3>💖 批量导出 💖</h3>
        <div className="tip-text">调节完成后，一键高清生成并下载所有合成图片</div>
        {/* 显示要下载的图片列表 */}
        {uploadedImages.length > 0 && (
          <div className="mb-8">
            <h3 className="text-center text-gray-700 font-medium mb-3">要下载的图片 ({uploadedImages.length})</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {uploadedImages.map((img, index) => (
                <div key={img.id} className="relative cursor-pointer" onClick={() => handlePreviewImage(img, index)}>
                  <img 
                    src={img.previewSrc || img.originalSrc} 
                    alt={img.name} 
                    className="w-20 h-20 object-cover rounded-md border border-gray-200 hover:border-pink-400 transition-all"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-md text-center truncate">
                    {img.name}
                  </div>
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 rounded-md transition-all flex items-center justify-center">
                    <span className="text-white opacity-0 hover:opacity-100 transition-opacity">👁️</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="preview-actions">
          <a 
            href="#" 
            id="previewAllBtn" 
            className="action-btn preview-all-btn"
            onClick={handlePreviewAll}
          >
            👁️ 一键预览
          </a>
          <a 
            href="#" 
            id="downloadAllBtn" 
            className="action-btn download-all-btn"
            onClick={handleDownloadAll}
          >
            📥 批量下载处理结果
          </a>
          <a 
            href="#" 
            id="resetBtn" 
            className="action-btn reset-btn"
            onClick={handleReset}
          >
            🔄 重置形变
          </a>
        </div>
      </div>
    </div>
  );
}
