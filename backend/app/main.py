import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.database import engine, Base
from app.seed_data import seed_database
from app.routers import (
    auth, customers, merchants, products,
    cart, orders, payments, management, market_prices
)


app = FastAPI(
    title="Farm2Home Agricultural Marketplace API",
    description="Farmer-friendly e-commerce platform connecting farmers directly to homes.",
    version="1.0.0"
)

# Initialize database schema and initial seed
Base.metadata.create_all(bind=engine)
if os.getenv("TESTING") != "true":
    seed_database()

# CORS setup
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router)
app.include_router(customers.router)
app.include_router(merchants.router)
app.include_router(products.router)
app.include_router(cart.router)
app.include_router(orders.router)
app.include_router(payments.router)
app.include_router(management.router)
app.include_router(market_prices.router)


@app.get("/")
def root():
    return {
        "platform": "Farm2Home",
        "tagline": "Direct Farm Fresh Produce to Every Household",
        "version": "1.0.0",
        "status": "online",
        "docs_url": "/docs"
    }


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "farm2home-backend"}
