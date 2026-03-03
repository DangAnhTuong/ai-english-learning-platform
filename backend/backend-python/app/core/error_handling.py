from fastapi import Request, Response, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.middleware.base import BaseHTTPMiddleware
import logging
import traceback
from typing import Dict, Any
import time

from app.core.exceptions import (
    EnglishLearningAPIException,
    ConversationServiceException,
    AIServiceException,
    DeepgramServiceException,
    DatabaseException,
    ValidationException,
    AuthenticationException,
    AuthorizationException,
    RateLimitExceeded,
    ResourceNotAvailable,
    ConfigurationException
)

logger = logging.getLogger(__name__)

class ExceptionMiddleware(BaseHTTPMiddleware):
    """Enhanced exception handling middleware"""
    
    def __init__(self, app):
        super().__init__(app)
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        try:
            response = await call_next(request)
            
            # Log successful requests (with sampling for high volume)
            process_time = time.time() - start_time
            if process_time > 1.0 or request.url.path.startswith('/api/v1/conversation'):
                logger.info(
                    f"{request.method} {request.url.path} - "
                    f"Status: {response.status_code} - "
                    f"Time: {process_time:.2f}s"
                )
            
            return response
            
        except EnglishLearningAPIException as e:
            return await self._handle_api_exception(request, e, start_time)
        except HTTPException as e:
            return await self._handle_http_exception(request, e, start_time)
        except Exception as e:
            return await self._handle_unexpected_exception(request, e, start_time)
    
    async def _handle_api_exception(
        self, 
        request: Request, 
        exc: EnglishLearningAPIException,
        start_time: float
    ) -> JSONResponse:
        """Handle custom API exceptions"""
        
        # Determine status code based on exception type
        status_code = self._get_status_code_for_exception(exc)
        
        # Log the exception
        process_time = time.time() - start_time
        logger.warning(
            f"{request.method} {request.url.path} - "
            f"API Exception: {exc.__class__.__name__} - "
            f"{exc.message} - "
            f"Time: {process_time:.2f}s",
            extra={
                "exception_code": exc.code,
                "exception_details": exc.details,
                "request_path": str(request.url.path),
                "request_method": request.method
            }
        )
        
        return JSONResponse(
            status_code=status_code,
            content={
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "details": exc.details,
                    "type": exc.__class__.__name__
                },
                "timestamp": time.time(),
                "path": str(request.url.path)
            }
        )
    
    async def _handle_http_exception(
        self,
        request: Request,
        exc: HTTPException,
        start_time: float
    ) -> JSONResponse:
        """Handle FastAPI HTTP exceptions"""
        
        process_time = time.time() - start_time
        logger.warning(
            f"{request.method} {request.url.path} - "
            f"HTTP Exception: {exc.status_code} - "
            f"{exc.detail} - "
            f"Time: {process_time:.2f}s"
        )
        
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": f"HTTP_{exc.status_code}",
                    "message": exc.detail,
                    "type": "HTTPException"
                },
                "timestamp": time.time(),
                "path": str(request.url.path)
            }
        )
    
    async def _handle_unexpected_exception(
        self,
        request: Request,
        exc: Exception,
        start_time: float
    ) -> JSONResponse:
        """Handle unexpected exceptions"""
        
        process_time = time.time() - start_time
        
        # Log the full traceback for debugging
        logger.error(
            f"{request.method} {request.url.path} - "
            f"Unexpected Exception: {exc.__class__.__name__} - "
            f"{str(exc)} - "
            f"Time: {process_time:.2f}s",
            exc_info=True,
            extra={
                "request_path": str(request.url.path),
                "request_method": request.method,
                "traceback": traceback.format_exc()
            }
        )
        
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected error occurred",
                    "type": "InternalServerError"
                },
                "timestamp": time.time(),
                "path": str(request.url.path)
            }
        )
    
    def _get_status_code_for_exception(self, exc: EnglishLearningAPIException) -> int:
        """Map custom exceptions to HTTP status codes"""
        
        status_map = {
            ConversationServiceException: 400,
            AIServiceException: 503,
            DeepgramServiceException: 503,
            DatabaseException: 503,
            ValidationException: 422,
            AuthenticationException: 401,
            AuthorizationException: 403,
            RateLimitExceeded: 429,
            ResourceNotAvailable: 503,
            ConfigurationException: 500
        }
        
        # Check for specific exception types
        for exc_type, status_code in status_map.items():
            if isinstance(exc, exc_type):
                return status_code
        
        # Default to 500 for unknown custom exceptions
        return 500

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Enhanced validation error handler"""
    
    logger.warning(
        f"{request.method} {request.url.path} - Validation Error",
        extra={
            "validation_errors": exc.errors(),
            "request_path": str(request.url.path),
            "request_method": request.method
        }
    )
    
    # Extract and format error details
    errors = []
    for error in exc.errors():
        field_path = ".".join(str(x) for x in error["loc"]) if error["loc"] else "body"
        errors.append({
            "field": field_path,
            "message": error["msg"],
            "type": error["type"],
            "input": error.get("input")
        })
    
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Request validation failed",
                "details": {
                    "errors": errors,
                    "error_count": len(errors)
                },
                "type": "ValidationError"
            },
            "timestamp": time.time(),
            "path": str(request.url.path)
        }
    )

def create_error_response(
    code: str,
    message: str,
    status_code: int = 500,
    details: Dict[str, Any] = None,
    path: str = None
) -> JSONResponse:
    """Utility function to create consistent error responses"""
    
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "code": code,
                "message": message,
                "details": details or {},
                "type": "Error"
            },
            "timestamp": time.time(),
            "path": path
        }
    ) 