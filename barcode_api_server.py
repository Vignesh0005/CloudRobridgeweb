#!/usr/bin/env python3
"""
Barcode Product Description API Server
Serves the fine-tuned LLaMA model as a REST API endpoint
"""

import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import logging
import os
from datetime import datetime
import json

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pydantic models for API
class BarcodeRequest(BaseModel):
    barcode: str
    max_length: Optional[int] = 200
    temperature: Optional[float] = 0.7
    top_p: Optional[float] = 0.9

class BarcodeResponse(BaseModel):
    success: bool
    barcode: str
    product_description: str
    model_info: Dict[str, Any]
    timestamp: str

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    timestamp: str

# FastAPI app
app = FastAPI(
    title="Barcode Product Description API",
    description="AI-powered product description generation from barcodes",
    version="1.0.0"
)

class BarcodeModelServer:
    def __init__(self, model_path: str = "./barcode_model"):
        self.model_path = model_path
        self.tokenizer = None
        self.model = None
        self.model_loaded = False
        
    def load_model(self):
        """Load the fine-tuned model and tokenizer"""
        try:
            logger.info(f"Loading model from {self.model_path}")
            
            # Load tokenizer
            self.tokenizer = AutoTokenizer.from_pretrained(
                self.model_path,
                trust_remote_code=True,
                use_fast=True
            )
            
            # Load model
            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_path,
                torch_dtype=torch.float16,
                device_map="auto",
                trust_remote_code=True
            )
            
            self.model_loaded = True
            logger.info("Model loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load model: {str(e)}")
            self.model_loaded = False
            raise e
    
    def generate_description(self, barcode: str, max_length: int = 200, 
                           temperature: float = 0.7, top_p: float = 0.9) -> str:
        """Generate product description for a given barcode"""
        if not self.model_loaded:
            raise HTTPException(status_code=503, detail="Model not loaded")
        
        try:
            # Create prompt
            prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>

You are an AI assistant that generates creative, beneficial, and descriptive product details based on barcode numbers. Your responses should be engaging, informative, and highlight the product's benefits and features.

<|eot_id|><|start_header_id|>user<|end_header_id|>

Generate a creative product description for barcode: {barcode}

<|eot_id|><|start_header_id|>assistant<|end_header_id|>

"""
            
            # Tokenize input
            inputs = self.tokenizer(prompt, return_tensors="pt")
            
            # Generate response
            with torch.no_grad():
                outputs = self.model.generate(
                    inputs.input_ids,
                    max_length=max_length,
                    num_return_sequences=1,
                    temperature=temperature,
                    top_p=top_p,
                    do_sample=True,
                    pad_token_id=self.tokenizer.eos_token_id,
                    eos_token_id=self.tokenizer.eos_token_id
                )
            
            # Decode response
            response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            # Extract only the assistant's response
            if "<|start_header_id|>assistant<|end_header_id|>" in response:
                response = response.split("<|start_header_id|>assistant<|end_header_id|>")[-1]
            
            return response.strip()
            
        except Exception as e:
            logger.error(f"Error generating description: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

# Initialize the model server
model_server = BarcodeModelServer()

@app.on_event("startup")
async def startup_event():
    """Load the model on startup"""
    try:
        model_server.load_model()
        logger.info("API server started successfully")
    except Exception as e:
        logger.error(f"Failed to start server: {str(e)}")

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy" if model_server.model_loaded else "unhealthy",
        model_loaded=model_server.model_loaded,
        timestamp=datetime.now().isoformat()
    )

@app.post("/generate", response_model=BarcodeResponse)
async def generate_description(request: BarcodeRequest):
    """Generate product description from barcode"""
    try:
        # Validate barcode
        if not request.barcode or not request.barcode.strip():
            raise HTTPException(status_code=400, detail="Barcode cannot be empty")
        
        # Generate description
        description = model_server.generate_description(
            barcode=request.barcode,
            max_length=request.max_length,
            temperature=request.temperature,
            top_p=request.top_p
        )
        
        # Prepare response
        response = BarcodeResponse(
            success=True,
            barcode=request.barcode,
            product_description=description,
            model_info={
                "model_name": "LLaMA-3.2-3B-Instruct",
                "fine_tuned": True,
                "max_length": request.max_length,
                "temperature": request.temperature,
                "top_p": request.top_p
            },
            timestamp=datetime.now().isoformat()
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Barcode Product Description API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "generate": "/generate",
            "docs": "/docs"
        },
        "model_loaded": model_server.model_loaded
    }

@app.get("/model/info")
async def model_info():
    """Get model information"""
    if not model_server.model_loaded:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    return {
        "model_name": "LLaMA-3.2-3B-Instruct",
        "fine_tuned": True,
        "model_path": model_server.model_path,
        "device": str(model_server.model.device) if model_server.model else "unknown",
        "dtype": str(model_server.model.dtype) if model_server.model else "unknown"
    }

# Example usage and testing
@app.post("/test")
async def test_endpoint():
    """Test endpoint with sample barcode"""
    test_barcode = "8901180948385"
    
    try:
        description = model_server.generate_description(test_barcode)
        return {
            "test_barcode": test_barcode,
            "description": description,
            "success": True
        }
    except Exception as e:
        return {
            "test_barcode": test_barcode,
            "error": str(e),
            "success": False
        }

if __name__ == "__main__":
    # Run the server
    uvicorn.run(
        "barcode_api_server:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info"
    )
