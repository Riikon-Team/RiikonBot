export const downloadImageAsBase64 = async (imageUrl) => {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const imageArrayBuffer = await response.arrayBuffer();
    const base64ImageData = Buffer.from(imageArrayBuffer).toString('base64');
    
    // Xác định mime type từ headers hoặc URL
    const contentType = response.headers.get('content-type') || 'image/png';
    
    return {
      data: base64ImageData,
      mimeType: contentType
    };
  } catch (error) {
    console.error('Error downloading image:', error);
    return null;
  }
};