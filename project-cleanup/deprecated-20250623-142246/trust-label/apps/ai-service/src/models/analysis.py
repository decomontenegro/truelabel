from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime


class IngredientAnalysis(BaseModel):
    ingredient: str
    safety_score: float = Field(..., ge=0.0, le=1.0)
    allergen_info: Optional[List[str]] = None
    regulatory_status: str
    health_impacts: Optional[List[str]] = None
    alternatives: Optional[List[str]] = None


class NutritionAnalysis(BaseModel):
    nutrient: str
    amount: float
    unit: str
    daily_value_percentage: Optional[float] = None
    health_impact: str
    recommendation: Optional[str] = None


class SustainabilityScore(BaseModel):
    overall_score: float = Field(..., ge=0.0, le=1.0)
    packaging_score: float = Field(..., ge=0.0, le=1.0)
    production_score: float = Field(..., ge=0.0, le=1.0)
    transportation_score: float = Field(..., ge=0.0, le=1.0)
    certification_score: float = Field(..., ge=0.0, le=1.0)
    carbon_footprint: Optional[float] = None
    recommendations: List[str]


class ProductComparison(BaseModel):
    product_id: str
    scores: Dict[str, float]
    advantages: List[str]
    disadvantages: List[str]
    unique_features: List[str]


class AnalysisRequest(BaseModel):
    analysis_type: str
    data: Dict[str, any]
    options: Optional[Dict[str, any]] = None


class AnalysisResponse(BaseModel):
    analysis_type: str
    results: Dict[str, any]
    confidence: float = Field(..., ge=0.0, le=1.0)
    timestamp: datetime
    processing_time_ms: int