/**
 * Tiện ích tối ưu hóa và nén ảnh phía Client (Trình duyệt)
 * Giảm dung lượng ảnh từ vài MB xuống còn vài KB bằng chuẩn WebP hiện đại
 */

export async function compressAndResizeImage(file, options = {}) {
  const {
    maxWidth = 200,
    maxHeight = 200,
    quality = 0.82,
    squareCrop = true,
  } = options;

  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Tệp tải lên không phải là định dạng hình ảnh hợp lệ.');
  }

  const originalSizeBytes = file.size;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Không thể đọc tệp hình ảnh.'));
    reader.onload = (readerEvent) => {
      const img = new Image();

      img.onerror = () => reject(new Error('Không thể xử lý dữ liệu hình ảnh.'));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let srcX = 0;
          let srcY = 0;
          let srcW = img.width;
          let srcH = img.height;
          let targetW = maxWidth;
          let targetH = maxHeight;

          if (squareCrop) {
            // Tự động Crop vuông 1:1 từ tâm ảnh cho avatar
            const minDim = Math.min(srcW, srcH);
            srcX = (srcW - minDim) / 2;
            srcY = (srcH - minDim) / 2;
            srcW = minDim;
            srcH = minDim;
            targetW = Math.min(minDim, maxWidth);
            targetH = targetW;
          } else {
            // Giữ nguyên tỷ lệ khung hình
            const ratio = Math.min(maxWidth / srcW, maxHeight / srcH, 1);
            targetW = Math.round(srcW * ratio);
            targetH = Math.round(srcH * ratio);
          }

          canvas.width = targetW;
          canvas.height = targetH;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return reject(new Error('Không khởi tạo được bộ vẽ Canvas 2D.'));
          }

          // Kỹ thuật làm mịn hình ảnh chất lượng cao
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Vẽ ảnh lên canvas đã scale
          ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, targetW, targetH);

          // Thử xuất ảnh chuẩn WebP trước (tiết kiệm ~30-50% so với JPEG cùng chất lượng)
          let outputFormat = 'image/webp';
          let dataUrl = canvas.toDataURL(outputFormat, quality);

          // Nếu trình duyệt cũ không hỗ trợ WebP, tự động fallback sang image/jpeg
          if (!dataUrl.startsWith('data:image/webp')) {
            outputFormat = 'image/jpeg';
            dataUrl = canvas.toDataURL(outputFormat, quality);
          }

          // Tính toán dung lượng sau nén từ độ dài chuỗi Base64
          const stringLength = dataUrl.length - 'data:image/webp;base64,'.length;
          const compressedSizeBytes = Math.round((stringLength * 3) / 4);

          const originalSizeKB = (originalSizeBytes / 1024).toFixed(1);
          const compressedSizeKB = (compressedSizeBytes / 1024).toFixed(1);
          const reductionPercent = Math.max(
            0,
            Math.round(((originalSizeBytes - compressedSizeBytes) / originalSizeBytes) * 100)
          );

          resolve({
            dataUrl,
            originalSizeKB: Number(originalSizeKB),
            compressedSizeKB: Number(compressedSizeKB),
            reductionPercent,
            width: targetW,
            height: targetH,
            format: outputFormat,
          });
        } catch (err) {
          reject(err);
        }
      };

      img.src = readerEvent.target.result;
    };

    reader.readAsDataURL(file);
  });
}
