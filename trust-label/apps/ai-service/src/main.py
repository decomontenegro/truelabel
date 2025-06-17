import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from dotenv import load_dotenv

from api import validation_router, analysis_router, ocr_router, health_router
from core.config import settings
from core.logging import setup_logging

# Load environment variables
load_dotenv()

# Setup logging
setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events."""
    # Startup
    print(f"🚀 AI Service starting on {settings.API_HOST}:{settings.API_PORT}")
    yield
    # Shutdown
    print("👋 AI Service shutting down")


# Create FastAPI app
app = FastAPI(
    title="TRUST Label AI Service",
    description="AI-powered validation and analysis service for TRUST Label platform",
    version="1.0.0",
    lifespan=lifespan,
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

# Include routers
app.include_router(health_router, prefix="/health", tags=["health"])
app.include_router(validation_router, prefix="/api/v1/validate", tags=["validation"])
app.include_router(analysis_router, prefix="/api/v1/analyze", tags=["analysis"])
app.include_router(ocr_router, prefix="/api/v1/ocr", tags=["ocr"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "TRUST Label AI Service",
        "version": "1.0.0",
        "status": "operational",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.API_ENV == "development",
    )