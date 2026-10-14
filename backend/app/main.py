from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes_assistant import router as assistant_router
from app.api.routes_audit import router as audit_router
from app.api.routes_forecast import router as forecast_router
from app.api.routes_cold_chain import router as cold_chain_router
from app.api.routes_handover import router as handover_router
from app.api.routes_inventory import router as inventory_router
from app.api.routes_multimodal import router as multimodal_router
from app.api.routes_resilience import router as resilience_router
from app.api.routes_security_soc import router as soc_router
from app.api.routes_telemetry import router as telemetry_router
from app.api.routes_command import router as command_router
from app.api.routes_auth import router as auth_router
from app.core.config import settings


def create_application() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description=(
            "Zero Trust Military Logistics Decision-Support & Cryptographic Ledger Backend "
            "for Smart India Hackathon (SIH)."
        ),
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # Strict CORS Policy scoped specifically to the Angular 19 Frontend Origin
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.FRONTEND_ORIGIN, "http://127.0.0.1:4200", "http://localhost:4200"],
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=[
            "Authorization",
            "Content-Type",
            "X-StepUp-Token",
            "X-Request-ID",
        ],
    )

    # Register API v1 Routers
    app.include_router(inventory_router, prefix=settings.API_V1_STR)
    app.include_router(telemetry_router, prefix=settings.API_V1_STR)
    app.include_router(audit_router, prefix=settings.API_V1_STR)
    app.include_router(assistant_router, prefix=settings.API_V1_STR)
    app.include_router(multimodal_router, prefix=settings.API_V1_STR)
    app.include_router(forecast_router, prefix=settings.API_V1_STR)
    app.include_router(handover_router, prefix=settings.API_V1_STR)    # Innovation #3: Blind-Drop
    app.include_router(soc_router, prefix=settings.API_V1_STR)         # Innovation #4: SOC Threat Radar
    app.include_router(resilience_router, prefix=settings.API_V1_STR)   # Innovation #5: Mesh & Blackout Reconciler
    app.include_router(cold_chain_router, prefix=settings.API_V1_STR)   # Innovation #6: Cold-Chain Degradation Engine
    app.include_router(command_router, prefix=settings.API_V1_STR)      # Command Admin & Crisis Wargame Engine
    app.include_router(auth_router, prefix=settings.API_V1_STR)         # Defense Biometrics & 2FA OTP Gateway

    @app.get("/health", tags=["System Health"])
    def healthcheck() -> dict:
        return {
            "service": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "zero_trust_gateway": "ACTIVE",
            "cors_allowed_origin": settings.FRONTEND_ORIGIN,
        }

    return app


app = create_application()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
