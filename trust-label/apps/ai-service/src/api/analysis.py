from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import List, Dict, Optional
import tempfile
import os

from services.analysis_service import AnalysisService
from services.nlp_service import NLPService
from models.analysis import AnalysisRequest, AnalysisResponse

router = APIRouter()

# Initialize services
analysis_service = AnalysisService()
nlp_service = NLPService()


@router.post("/ingredients")
async def analyze_ingredients(
    ingredients: List[str],
    product_category: str,
    target_audience: Optional[str] = None,
):
    """
    Analyze ingredient list for safety, efficacy, and regulatory compliance.
    """
    try:
        analysis = await analysis_service.analyze_ingredients(
            ingredients=ingredients,
            product_category=product_category,
            target_audience=target_audience,
        )
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/nutrition")
async def analyze_nutrition(
    nutrition_facts: Dict[str, float],
    serving_size: str,
    product_category: str,
):
    """
    Analyze nutritional information and provide insights.
    """
    try:
        analysis = await analysis_service.analyze_nutrition(
            nutrition_facts=nutrition_facts,
            serving_size=serving_size,
            product_category=product_category,
        )
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/label-text")
async def analyze_label_text(
    text: str,
    language: str = "pt",
    check_claims: bool = True,
    check_warnings: bool = True,
):
    """
    Analyze product label text for claims, warnings, and compliance.
    """
    try:
        analysis = await nlp_service.analyze_label_text(
            text=text,
            language=language,
            check_claims=check_claims,
            check_warnings=check_warnings,
        )
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/compare-products")
async def compare_products(
    product_ids: List[str],
    comparison_criteria: List[str] = ["ingredients", "nutrition", "claims", "price"],
):
    """
    Compare multiple products based on specified criteria.
    """
    try:
        comparison = await analysis_service.compare_products(
            product_ids=product_ids,
            comparison_criteria=comparison_criteria,
        )
        return comparison
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sustainability-score")
async def calculate_sustainability_score(
    packaging_materials: List[str],
    production_location: str,
    certifications: List[str],
    carbon_footprint: Optional[float] = None,
):
    """
    Calculate sustainability score based on various factors.
    """
    try:
        score = await analysis_service.calculate_sustainability_score(
            packaging_materials=packaging_materials,
            production_location=production_location,
            certifications=certifications,
            carbon_footprint=carbon_footprint,
        )
        return score
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))