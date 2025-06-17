import logging
from typing import Optional, List, Dict
import pytesseract
from PIL import Image
import cv2
import numpy as np

logger = logging.getLogger(__name__)


class OCRService:
    """Service for Optical Character Recognition."""
    
    def __init__(self):
        # Configure Tesseract
        self.tesseract_config = '--oem 3 --psm 6'
    
    async def extract_text(
        self,
        image_path: str,
        language: str = "por+eng",
        enhance_image: bool = True
    ) -> str:
        """Extract text from image using OCR."""
        try:
            # Load image
            if enhance_image:
                image = self._preprocess_image(image_path)
            else:
                image = Image.open(image_path)
            
            # Extract text
            text = pytesseract.image_to_string(
                image,
                lang=language,
                config=self.tesseract_config
            )
            
            return text.strip()
        except Exception as e:
            logger.error(f"OCR extraction failed: {str(e)}")
            raise
    
    def _preprocess_image(self, image_path: str) -> np.ndarray:
        """Preprocess image for better OCR results."""
        # Read image
        img = cv2.imread(image_path)
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Apply thresholding
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Denoise
        denoised = cv2.medianBlur(thresh, 3)
        
        return denoised
    
    async def extract_data_from_table(
        self,
        image_path: str,
        language: str = "por+eng"
    ) -> List[List[str]]:
        """Extract tabular data from image."""
        # TODO: Implement table extraction
        return []
    
    async def detect_text_regions(
        self,
        image_path: str
    ) -> List[Dict]:
        """Detect text regions in image."""
        # TODO: Implement text region detection
        return []