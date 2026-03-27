from fastapi import FastAPI, APIRouter, HTTPException, Cookie, Response
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Emergent LLM Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime

class SessionData(BaseModel):
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime

class SessionRequest(BaseModel):
    session_id: str

class AnalysisRequest(BaseModel):
    query: str
    context: Optional[Dict[str, Any]] = None

class AnalysisResponse(BaseModel):
    analysis_type: str
    result: str
    timestamp: datetime

class MarketOverview(BaseModel):
    markets: List[Dict[str, Any]]
    timestamp: datetime

# Helper: Get current user from session token
async def get_current_user(session_token: Optional[str] = Cookie(None), authorization: Optional[str] = None) -> User:
    token = session_token
    if not token and authorization:
        if authorization.startswith('Bearer '):
            token = authorization[7:]
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session_doc = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        await db.user_sessions.delete_one({"session_token": token})
        raise HTTPException(status_code=401, detail="Session expired")
    
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    if isinstance(user_doc['created_at'], str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    return User(**user_doc)

# Auth Endpoints
@api_router.post("/auth/session")
async def create_session(request: SessionRequest, response: Response):
    """Exchange session_id for session_token via Emergent Auth"""
    async with httpx.AsyncClient() as http_client:
        try:
            auth_response = await http_client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": request.session_id}
            )
            auth_response.raise_for_status()
            data = auth_response.json()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to authenticate: {str(e)}")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    existing_user = await db.users.find_one({"email": data["email"]}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "name": data["name"],
                "picture": data["picture"]
            }}
        )
    else:
        user_doc = {
            "user_id": user_id,
            "email": data["email"],
            "name": data["name"],
            "picture": data["picture"],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
    
    session_token = data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.insert_one(session_doc)
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7*24*60*60,
        path="/"
    )
    
    user_data = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if isinstance(user_data['created_at'], str):
        user_data['created_at'] = datetime.fromisoformat(user_data['created_at'])
    
    return User(**user_data)

@api_router.get("/auth/me")
async def get_me(session_token: Optional[str] = Cookie(None)):
    """Get current user from session"""
    user = await get_current_user(session_token=session_token)
    return user

@api_router.post("/auth/logout")
async def logout(response: Response, session_token: Optional[str] = Cookie(None)):
    """Logout and clear session"""
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# AI Analysis Endpoints
@api_router.post("/analyze/market", response_model=AnalysisResponse)
async def analyze_market(request: AnalysisRequest, session_token: Optional[str] = Cookie(None)):
    """AI-powered market analysis"""
    user = await get_current_user(session_token=session_token)
    
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"market_{user.user_id}_{datetime.now(timezone.utc).timestamp()}",
        system_message="You are an elite financial analyst from Goldman Sachs with deep expertise in market analysis. Provide concise, data-driven insights with specific recommendations. Focus on trends, risks, and opportunities."
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")
    
    user_message = UserMessage(text=f"Market Analysis Request: {request.query}\n\nContext: {request.context or 'General market overview'}")
    result = await chat.send_message(user_message)
    
    analysis_doc = {
        "user_id": user.user_id,
        "analysis_type": "market",
        "query": request.query,
        "result": result,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.analysis_history.insert_one(analysis_doc)
    
    return AnalysisResponse(
        analysis_type="market",
        result=result,
        timestamp=datetime.now(timezone.utc)
    )

@api_router.post("/analyze/portfolio", response_model=AnalysisResponse)
async def analyze_portfolio(request: AnalysisRequest, session_token: Optional[str] = Cookie(None)):
    """AI-powered portfolio optimization and risk assessment"""
    user = await get_current_user(session_token=session_token)
    
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"portfolio_{user.user_id}_{datetime.now(timezone.utc).timestamp()}",
        system_message="You are a quantitative portfolio manager specializing in risk assessment and optimization. Analyze portfolio composition, calculate risk metrics (Sharpe ratio, beta, volatility), and provide specific rebalancing recommendations."
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")
    
    user_message = UserMessage(text=f"Portfolio Analysis Request: {request.query}\n\nPortfolio Data: {request.context or 'Diversified portfolio'}")
    result = await chat.send_message(user_message)
    
    analysis_doc = {
        "user_id": user.user_id,
        "analysis_type": "portfolio",
        "query": request.query,
        "result": result,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.analysis_history.insert_one(analysis_doc)
    
    return AnalysisResponse(
        analysis_type="portfolio",
        result=result,
        timestamp=datetime.now(timezone.utc)
    )

@api_router.post("/analyze/document", response_model=AnalysisResponse)
async def analyze_document(request: AnalysisRequest, session_token: Optional[str] = Cookie(None)):
    """AI-powered financial document analysis"""
    user = await get_current_user(session_token=session_token)
    
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"document_{user.user_id}_{datetime.now(timezone.utc).timestamp()}",
        system_message="You are a financial analyst specializing in earnings reports, SEC filings, and financial statements. Extract key metrics, identify red flags, and provide actionable insights."
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")
    
    user_message = UserMessage(text=f"Document Analysis Request: {request.query}\n\nDocument Content: {request.context or 'Financial document'}")
    result = await chat.send_message(user_message)
    
    analysis_doc = {
        "user_id": user.user_id,
        "analysis_type": "document",
        "query": request.query,
        "result": result,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.analysis_history.insert_one(analysis_doc)
    
    return AnalysisResponse(
        analysis_type="document",
        result=result,
        timestamp=datetime.now(timezone.utc)
    )

@api_router.post("/analyze/recommendations", response_model=AnalysisResponse)
async def get_recommendations(request: AnalysisRequest, session_token: Optional[str] = Cookie(None)):
    """AI-powered investment recommendations"""
    user = await get_current_user(session_token=session_token)
    
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"recommendations_{user.user_id}_{datetime.now(timezone.utc).timestamp()}",
        system_message="You are a senior investment advisor providing institutional-grade recommendations. Consider market conditions, risk tolerance, and investment goals. Provide specific actionable recommendations with rationale."
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")
    
    user_message = UserMessage(text=f"Investment Recommendation Request: {request.query}\n\nInvestor Profile: {request.context or 'Institutional investor'}")
    result = await chat.send_message(user_message)
    
    analysis_doc = {
        "user_id": user.user_id,
        "analysis_type": "recommendations",
        "query": request.query,
        "result": result,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.analysis_history.insert_one(analysis_doc)
    
    return AnalysisResponse(
        analysis_type="recommendations",
        result=result,
        timestamp=datetime.now(timezone.utc)
    )

# Market Data
@api_router.get("/market/overview", response_model=MarketOverview)
async def get_market_overview(session_token: Optional[str] = Cookie(None)):
    """Get real-time market overview"""
    user = await get_current_user(session_token=session_token)
    
    # Simulated real-time market data
    import random
    markets = [
        {"name": "S&P 500", "symbol": "SPX", "price": 5847.23, "change": round(random.uniform(-2, 2), 2), "changePercent": round(random.uniform(-0.5, 0.5), 2)},
        {"name": "NASDAQ", "symbol": "IXIC", "price": 18924.45, "change": round(random.uniform(-3, 3), 2), "changePercent": round(random.uniform(-0.6, 0.6), 2)},
        {"name": "Dow Jones", "symbol": "DJI", "price": 42735.62, "change": round(random.uniform(-2, 2), 2), "changePercent": round(random.uniform(-0.4, 0.4), 2)},
        {"name": "Bitcoin", "symbol": "BTC", "price": 94234.56, "change": round(random.uniform(-500, 500), 2), "changePercent": round(random.uniform(-2, 2), 2)},
        {"name": "Gold", "symbol": "GC", "price": 2647.89, "change": round(random.uniform(-10, 10), 2), "changePercent": round(random.uniform(-0.5, 0.5), 2)},
        {"name": "Crude Oil", "symbol": "CL", "price": 73.42, "change": round(random.uniform(-2, 2), 2), "changePercent": round(random.uniform(-1, 1), 2)}
    ]
    
    return MarketOverview(
        markets=markets,
        timestamp=datetime.now(timezone.utc)
    )

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
