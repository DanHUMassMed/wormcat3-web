import os

from app import constants
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import debugpy
from app.routers import enrichment_router, batch_router, gsea_router
from app.tasks import celery

ACTIVATE_DEBUG = os.getenv("ACTIVATE_DEBUG", "FALSE")
if ACTIVATE_DEBUG=="TRUE":
    debugpy.listen(("0.0.0.0", 58979))
    print("Waiting for debugger to attach...")

WORMCAT_OUT_PATH = os.environ.get("WORMCAT_OUT_PATH")
if WORMCAT_OUT_PATH is None:
    raise ValueError("WORMCAT_OUT_PATH environment variable is not set.")


# localhost:8000
# Swagger http://127.0.0.1:8000/docs#/
app = FastAPI()


# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Allows React app on localhost
        "http://127.0.0.1:3000",  # Allows React app using 127.0.0.1
    ],  # Allows React app to make requests
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)


app.include_router(enrichment_router.router, prefix="/wormcat3", tags=["Enrichment"])
app.include_router(batch_router.router, prefix="/wormcat3", tags=["Batch"])
app.include_router(gsea_router.router, prefix="/wormcat3", tags=["GSEA"])
