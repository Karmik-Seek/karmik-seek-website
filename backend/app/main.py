import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

from app.config import settings
from app.database import init_db_and_seed
from app.limiter import limiter
from app.routers import auth_routes, student_routes, job_routes, application_routes, admin_routes

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB Atlas, ensure indexes, seed admin user and initial jobs
    print("[INFO] Initializing Kaarmik Seek Backend & MongoDB Atlas...")
    try:
        init_db_and_seed()
    except Exception as e:
        print(f"[WARN] Warning during DB initialization: {e}")
    yield
    print("[INFO] Shutting down Kaarmik Seek Backend.")

is_prod = settings.ENV.lower() == "production"

app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan,
    docs_url=None if is_prod else "/docs",
    redoc_url=None if is_prod else "/redoc",
    openapi_url=None if is_prod else "/openapi.json"
)

# Attach rate limiter and exception handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Secure CORS Middleware (Finding 4):
# Explicit origins, strict project preview regex, no wildcard origins, allow_credentials=False
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https://(kaarmikseek|karmik-seek-website(-[a-z0-9-]+)?)\.vercel\.app$",
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

# Include Routers
app.include_router(auth_routes.router)
app.include_router(student_routes.router)
app.include_router(job_routes.router)
app.include_router(application_routes.router)
app.include_router(admin_routes.router)

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "Kaarmik Seek API",
        "database": "MongoDB Atlas",
        "version": "2.0.0"
    }

@app.get("/api/health")
def health():
    return {"status": "healthy"}

@app.api_route("/ping", methods=["GET", "HEAD"])
@app.api_route("/api/ping", methods=["GET", "HEAD"])
def ping():
    """
    Lightweight keep-alive endpoint for cron jobs (e.g. Render 15-minute ping).
    Keeps both the web service and MongoDB Atlas connection warm.
    """
    db_status = "connected"
    try:
        from app.database import get_db
        db = get_db()
        db.command("ping")
    except Exception as e:
        db_status = f"unreachable: {str(e)}"

    return {
        "status": "pong",
        "service": "Kaarmik Seek API",
        "database": db_status,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
