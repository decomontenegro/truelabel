from .validation import router as validation_router
from .analysis import router as analysis_router
from .ocr import router as ocr_router
from .health import router as health_router

__all__ = ["validation_router", "analysis_router", "ocr_router", "health_router"]