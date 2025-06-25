from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime

from services.validation_service import ValidationService
from services.llm_service import LLMService
from models.validation import ValidationRequest, ValidationResponse, ClaimValidation

router = APIRouter()

# Initialize services
validation_service = ValidationService()
llm_service = LLMService()


@router.post("/claims", response_model=ValidationResponse)
async def validate_claims(request: ValidationRequest):
    """
    Validate product claims against laboratory reports using AI.
    """
    try:
        # Extract text from documents if needed
        if request.report_url:
            report_text = await validation_service.extract_report_text(request.report_url)
        else:
            report_text = request.report_text

        # Validate each claim
        validations = []
        for claim in request.claims:
            validation = await validation_service.validate_claim(
                claim=claim,
                report_text=report_text,
                product_info=request.product_info,
            )
            validations.append(validation)

        # Generate overall assessment
        overall_assessment = await validation_service.generate_assessment(
            validations=validations,
            product_info=request.product_info,
        )

        return ValidationResponse(
            product_id=request.product_id,
            validations=validations,
            overall_score=overall_assessment["score"],
            overall_status=overall_assessment["status"],
            summary=overall_assessment["summary"],
            timestamp=datetime.utcnow(),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/report-analysis")
async def analyze_report(report_url: str, report_type: str = "laboratory"):
    """
    Analyze a laboratory report and extract key information.
    """
    try:
        analysis = await validation_service.analyze_report(
            report_url=report_url,
            report_type=report_type,
        )
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/compliance-check")
async def check_compliance(
    product_category: str,
    claims: List[str],
    certifications: List[str],
    region: str = "BR",
):
    """
    Check regulatory compliance for product claims and certifications.
    """
    try:
        compliance_result = await validation_service.check_compliance(
            product_category=product_category,
            claims=claims,
            certifications=certifications,
            region=region,
        )
        return compliance_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))