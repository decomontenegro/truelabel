from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime
from enum import Enum


class ValidationStatus(str, Enum):
    VALIDATED = "validated"
    PARTIALLY_VALIDATED = "partially_validated"
    NOT_VALIDATED = "not_validated"
    INCONCLUSIVE = "inconclusive"


class ClaimType(str, Enum):
    NUTRITIONAL = "nutritional"
    HEALTH = "health"
    ORGANIC = "organic"
    SUSTAINABILITY = "sustainability"
    QUALITY = "quality"
    ORIGIN = "origin"
    CERTIFICATION = "certification"
    OTHER = "other"


class Claim(BaseModel):
    text: str = Field(..., description="The claim text")
    type: ClaimType = Field(..., description="Type of claim")
    priority: int = Field(default=1, ge=1, le=5, description="Priority level (1-5)")


class ClaimValidation(BaseModel):
    claim: Claim
    status: ValidationStatus
    confidence: float = Field(..., ge=0.0, le=1.0)
    evidence: List[str] = Field(default_factory=list)
    reasoning: str
    suggestions: Optional[List[str]] = None


class ValidationRequest(BaseModel):
    product_id: str
    claims: List[Claim]
    report_text: Optional[str] = None
    report_url: Optional[str] = None
    product_info: Optional[Dict[str, any]] = None
    validate_compliance: bool = True
    region: str = "BR"


class ValidationResponse(BaseModel):
    product_id: str
    validations: List[ClaimValidation]
    overall_score: float = Field(..., ge=0.0, le=1.0)
    overall_status: ValidationStatus
    summary: str
    compliance_issues: Optional[List[str]] = None
    recommendations: Optional[List[str]] = None
    timestamp: datetime