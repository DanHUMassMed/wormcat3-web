import os
from dotenv import load_dotenv

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import debugpy
from app.routers import enrichment_router, batch_router, gsea_router
from app.utils.logger import configure_logging



load_dotenv() 
react_app_url = os.getenv("REACT_APP_URL", "http://localhost:9001")

logger =configure_logging()

ACTIVATE_DEBUG = os.getenv("ACTIVATE_DEBUG", "None")
logger.info(f"ACTIVATE_DEBUG:{ACTIVATE_DEBUG}")

WORMCAT_LOG_LEVEL = os.getenv("WORMCAT_LOG_LEVEL", "None")
logger.info(f"WORMCAT_LOG_LEVEL:{WORMCAT_LOG_LEVEL}")

WORMCAT_LOG_PATH = os.getenv("WORMCAT_LOG_PATH", "None")
logger.info(f"WORMCAT_LOG_PATH:{WORMCAT_LOG_PATH}")

ACTIVATE_DEBUG = os.getenv("ACTIVATE_DEBUG", "FALSE")
logger.info(f"ACTIVATE_DEBUG:{ACTIVATE_DEBUG}")
if ACTIVATE_DEBUG=="TRUE":
    print("Waiting for debugger to attach...")
    debugpy.listen(("0.0.0.0", 58979))
    logger.info("Waiting for debugger to attach...")


# localhost:8000
# Swagger http://127.0.0.1:8000/docs#/
app = FastAPI()


# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        f"{react_app_url}",
    ],  # Allows React app to make requests
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

app.include_router(enrichment_router.router, prefix="/wormcat3", tags=["Enrichment"])
app.include_router(batch_router.router, prefix="/wormcat3", tags=["Batch"])
app.include_router(gsea_router.router, prefix="/wormcat3", tags=["GSEA"])
