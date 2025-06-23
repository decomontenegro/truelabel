from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import Optional
import tempfile
import os

from services.ocr_service import OCRService
from services.document_service import DocumentService

router = APIRouter()

# Initialize services
ocr_service = OCRService()
document_service = DocumentService()


@router.post("/extract-text")
async def extract_text(
    file: UploadFile = File(...),
    language: str = "por+eng",
    enhance_image: bool = True,
):
    """
    Extract text from uploaded image using OCR.
    """
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=file.filename) as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name

        try:
            # Extract text
            extracted_text = await ocr_service.extract_text(
                image_path=tmp_file_path,
                language=language,
                enhance_image=enhance_image,
            )
            
            return {
                "text": extracted_text,
                "filename": file.filename,
                "language": language,
            }
        finally:
            # Clean up temporary file
            os.unlink(tmp_file_path)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/extract-structured")
async def extract_structured_data(
    file: UploadFile = File(...),
    document_type: str = "label",
    language: str = "por+eng",
):
    """
    Extract structured data from document (labels, reports, certificates).
    """
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=file.filename) as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name

        try:
            # Extract structured data based on document type
            if document_type == "label":
                data = await document_service.extract_label_data(tmp_file_path, language)
            elif document_type == "report":
                data = await document_service.extract_report_data(tmp_file_path, language)
            elif document_type == "certificate":
                data = await document_service.extract_certificate_data(tmp_file_path, language)
            else:
                raise ValueError(f"Unsupported document type: {document_type}")
            
            return {
                "data": data,
                "document_type": document_type,
                "filename": file.filename,
            }
        finally:
            # Clean up temporary file
            os.unlink(tmp_file_path)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch-extract")
async def batch_extract_text(
    files: List[UploadFile] = File(...),
    language: str = "por+eng",
    parallel: bool = True,
):
    """
    Extract text from multiple images in batch.
    """
    try:
        results = []
        
        for file in files:
            # Save uploaded file temporarily
            with tempfile.NamedTemporaryFile(delete=False, suffix=file.filename) as tmp_file:
                content = await file.read()
                tmp_file.write(content)
                tmp_file_path = tmp_file.name

            try:
                # Extract text
                extracted_text = await ocr_service.extract_text(
                    image_path=tmp_file_path,
                    language=language,
                )
                
                results.append({
                    "filename": file.filename,
                    "text": extracted_text,
                    "success": True,
                })
            except Exception as e:
                results.append({
                    "filename": file.filename,
                    "error": str(e),
                    "success": False,
                })
            finally:
                # Clean up temporary file
                os.unlink(tmp_file_path)
        
        return {
            "results": results,
            "total": len(files),
            "successful": sum(1 for r in results if r["success"]),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))