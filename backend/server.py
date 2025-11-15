from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form, Cookie, Response, Request, Depends
from fastapi.responses import FileResponse, JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import qrcode
from PIL import Image
import io
import aiohttp
import random
import string
import shutil

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Upload directories
UPLOADS_DIR = ROOT_DIR / "uploads"
EVENTS_MEDIA_DIR = UPLOADS_DIR / "events"
QR_CODES_DIR = UPLOADS_DIR / "qr-codes"

# Create upload directories
UPLOADS_DIR.mkdir(exist_ok=True)
EVENTS_MEDIA_DIR.mkdir(exist_ok=True)
QR_CODES_DIR.mkdir(exist_ok=True)

# Define Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: Optional[str] = None
    picture: Optional[str] = None
    auth_provider: Optional[str] = None  # 'google' or 'guest'
    role: str = "guest"  # 'host' or 'guest'
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EventSettings(BaseModel):
    allow_upload: bool = True
    require_approval: bool = False

class Event(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    host_user_id: str
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    join_code: str = Field(default_factory=lambda: ''.join(random.choices(string.ascii_uppercase + string.digits, k=6)))
    qr_code_url: Optional[str] = None
    settings: EventSettings = Field(default_factory=EventSettings)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EventMembership(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    user_id: str
    role: str  # 'host' or 'guest'
    joined_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    source: str  # 'qr', 'code', 'link'

class MediaItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    uploader_user_id: str
    uploader_name: str
    storage_url: str
    thumbnail_url: Optional[str] = None
    file_type: str  # 'photo' or 'video'
    caption: Optional[str] = None
    status: str = "approved"  # 'approved', 'pending', 'hidden'
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    width: Optional[int] = None
    height: Optional[int] = None

# Request/Response Models
class SessionDataResponse(BaseModel):
    id: str
    email: str
    name: str
    picture: str
    session_token: str

class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    location: Optional[str] = None

class EventJoinRequest(BaseModel):
    join_code: str
    user_name: str

class GuestSessionCreate(BaseModel):
    name: str

class EventUpdateSettings(BaseModel):
    allow_upload: Optional[bool] = None
    require_approval: Optional[bool] = None

# Auth helper
async def get_current_user(request: Request, session_token: Optional[str] = Cookie(None)):
    token = session_token
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session = await db.user_sessions.find_one({"session_token": token})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    if datetime.fromisoformat(session["expires_at"]) < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user = await db.users.find_one({"id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user)

# Auth endpoints
@api_router.post("/auth/google-callback")
async def google_auth_callback(session_id: str, response: Response):
    async with aiohttp.ClientSession() as session:
        async with session.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        ) as resp:
            if resp.status != 200:
                raise HTTPException(status_code=400, detail="Invalid session ID")
            
            data = await resp.json()
    
    user_data = {
        "id": str(uuid.uuid4()),
        "email": data["email"],
        "name": data["name"],
        "picture": data["picture"],
        "auth_provider": "google",
        "role": "host",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    existing_user = await db.users.find_one({"email": data["email"]}, {"_id": 0})
    if not existing_user:
        await db.users.insert_one(user_data)
        user_id = user_data["id"]
    else:
        user_id = existing_user["id"]
    
    session_token = data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    
    return {"success": True, "session_token": session_token}

@api_router.post("/auth/guest-session")
async def create_guest_session(data: GuestSessionCreate, response: Response):
    user_data = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "email": None,
        "picture": None,
        "auth_provider": "guest",
        "role": "guest",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_data)
    
    session_token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.insert_one({
        "user_id": user_data["id"],
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    
    # Return clean user data without MongoDB _id field
    clean_user_data = {
        "id": user_data["id"],
        "name": user_data["name"],
        "email": user_data["email"],
        "picture": user_data["picture"],
        "auth_provider": user_data["auth_provider"],
        "role": user_data["role"],
        "created_at": user_data["created_at"]
    }
    
    return {"success": True, "session_token": session_token, "user": clean_user_data}

@api_router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@api_router.post("/auth/logout")
async def logout(response: Response, session_token: Optional[str] = Cookie(None)):
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"success": True}

# Event endpoints
@api_router.post("/events", response_model=Event)
async def create_event(event_data: EventCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != "host":
        raise HTTPException(status_code=403, detail="Only hosts can create events")
    
    event = Event(
        host_user_id=current_user.id,
        title=event_data.title,
        description=event_data.description,
        start_time=event_data.start_time,
        end_time=event_data.end_time,
        location=event_data.location
    )
    
    qr_filename = f"{event.id}.png"
    qr_path = QR_CODES_DIR / qr_filename
    
    join_url = f"https://snapgather-3.preview.emergentagent.com/join/{event.join_code}"
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(join_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    img.save(str(qr_path))
    
    event.qr_code_url = f"/api/qr-codes/{qr_filename}"
    
    event_dict = event.model_dump()
    event_dict['start_time'] = event_dict['start_time'].isoformat()
    if event_dict['end_time']:
        event_dict['end_time'] = event_dict['end_time'].isoformat()
    event_dict['created_at'] = event_dict['created_at'].isoformat()
    
    await db.events.insert_one(event_dict)
    
    membership = EventMembership(
        event_id=event.id,
        user_id=current_user.id,
        role="host",
        source="creator"
    )
    membership_dict = membership.model_dump()
    membership_dict['joined_at'] = membership_dict['joined_at'].isoformat()
    await db.event_memberships.insert_one(membership_dict)
    
    event_media_dir = EVENTS_MEDIA_DIR / event.id
    event_media_dir.mkdir(exist_ok=True)
    
    return event

@api_router.get("/events", response_model=List[Event])
async def get_my_events(current_user: User = Depends(get_current_user)):
    memberships = await db.event_memberships.find({"user_id": current_user.id}).to_list(1000)
    event_ids = [m["event_id"] for m in memberships]
    
    events = await db.events.find({"id": {"$in": event_ids}}, {"_id": 0}).to_list(1000)
    
    for event in events:
        if isinstance(event['start_time'], str):
            event['start_time'] = datetime.fromisoformat(event['start_time'])
        if event.get('end_time') and isinstance(event['end_time'], str):
            event['end_time'] = datetime.fromisoformat(event['end_time'])
        if isinstance(event['created_at'], str):
            event['created_at'] = datetime.fromisoformat(event['created_at'])
    
    return events

@api_router.get("/events/{event_id}", response_model=Event)
async def get_event(event_id: str, current_user: User = Depends(get_current_user)):
    membership = await db.event_memberships.find_one({
        "event_id": event_id,
        "user_id": current_user.id
    })
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this event")
    
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if isinstance(event['start_time'], str):
        event['start_time'] = datetime.fromisoformat(event['start_time'])
    if event.get('end_time') and isinstance(event['end_time'], str):
        event['end_time'] = datetime.fromisoformat(event['end_time'])
    if isinstance(event['created_at'], str):
        event['created_at'] = datetime.fromisoformat(event['created_at'])
    
    return Event(**event)

@api_router.put("/events/{event_id}/settings")
async def update_event_settings(
    event_id: str,
    settings: EventUpdateSettings,
    current_user: User = Depends(get_current_user)
):
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if event["host_user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Only the host can update settings")
    
    update_data = {}
    if settings.allow_upload is not None:
        update_data["settings.allow_upload"] = settings.allow_upload
    if settings.require_approval is not None:
        update_data["settings.require_approval"] = settings.require_approval
    
    await db.events.update_one({"id": event_id}, {"$set": update_data})
    
    return {"success": True}

@api_router.delete("/events/{event_id}")
async def delete_event(event_id: str, current_user: User = Depends(get_current_user)):
    event = await db.events.find_one({"id": event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if event["host_user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Only the host can delete the event")
    
    await db.events.delete_one({"id": event_id})
    await db.event_memberships.delete_many({"event_id": event_id})
    await db.media_items.delete_many({"event_id": event_id})
    
    event_media_dir = EVENTS_MEDIA_DIR / event_id
    if event_media_dir.exists():
        shutil.rmtree(event_media_dir)
    
    qr_path = QR_CODES_DIR / f"{event_id}.png"
    if qr_path.exists():
        qr_path.unlink()
    
    return {"success": True}

# Event join endpoints
@api_router.post("/events/join")
async def join_event(join_request: EventJoinRequest):
    event = await db.events.find_one({"join_code": join_request.join_code}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    user_data = {
        "id": str(uuid.uuid4()),
        "name": join_request.user_name,
        "email": None,
        "picture": None,
        "auth_provider": "guest",
        "role": "guest",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_data)
    
    session_token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.insert_one({
        "user_id": user_data["id"],
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    membership = EventMembership(
        event_id=event["id"],
        user_id=user_data["id"],
        role="guest",
        source="code"
    )
    membership_dict = membership.model_dump()
    membership_dict['joined_at'] = membership_dict['joined_at'].isoformat()
    await db.event_memberships.insert_one(membership_dict)
    
    if isinstance(event['start_time'], str):
        event['start_time'] = datetime.fromisoformat(event['start_time'])
    if event.get('end_time') and isinstance(event['end_time'], str):
        event['end_time'] = datetime.fromisoformat(event['end_time'])
    if isinstance(event['created_at'], str):
        event['created_at'] = datetime.fromisoformat(event['created_at'])
    
    # Return clean user data without MongoDB _id field
    clean_user_data = {
        "id": user_data["id"],
        "name": user_data["name"],
        "email": user_data["email"],
        "picture": user_data["picture"],
        "auth_provider": user_data["auth_provider"],
        "role": user_data["role"],
        "created_at": user_data["created_at"]
    }
    
    return {
        "success": True,
        "session_token": session_token,
        "event": Event(**event),
        "user": clean_user_data
    }

@api_router.get("/events/{event_id}/members")
async def get_event_members(event_id: str, current_user: User = Depends(get_current_user)):
    membership = await db.event_memberships.find_one({
        "event_id": event_id,
        "user_id": current_user.id
    })
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this event")
    
    memberships = await db.event_memberships.find({"event_id": event_id}).to_list(1000)
    user_ids = [m["user_id"] for m in memberships]
    
    users = await db.users.find({"id": {"$in": user_ids}}, {"_id": 0}).to_list(1000)
    
    return users

# Media endpoints
@api_router.post("/events/{event_id}/media")
async def upload_media(
    event_id: str,
    files: List[UploadFile] = File(...),
    captions: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user)
):
    membership = await db.event_memberships.find_one({
        "event_id": event_id,
        "user_id": current_user.id
    })
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this event")
    
    event = await db.events.find_one({"id": event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if not event["settings"]["allow_upload"]:
        raise HTTPException(status_code=403, detail="Uploads are not allowed for this event")
    
    event_media_dir = EVENTS_MEDIA_DIR / event_id
    event_media_dir.mkdir(exist_ok=True)
    
    caption_list = captions.split("||||") if captions else []
    
    media_items = []
    for idx, file in enumerate(files):
        file_ext = Path(file.filename).suffix
        media_id = str(uuid.uuid4())
        filename = f"{media_id}{file_ext}"
        file_path = event_media_dir / filename
        
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        file_type = "photo" if file.content_type and file.content_type.startswith("image") else "video"
        
        width, height = None, None
        if file_type == "photo":
            try:
                with Image.open(file_path) as img:
                    width, height = img.size
            except Exception:
                pass
        
        caption = caption_list[idx] if idx < len(caption_list) else None
        
        status = "pending" if event["settings"]["require_approval"] else "approved"
        
        media_item = MediaItem(
            id=media_id,
            event_id=event_id,
            uploader_user_id=current_user.id,
            uploader_name=current_user.name,
            storage_url=f"/api/media/{media_id}/file",
            file_type=file_type,
            caption=caption,
            status=status,
            width=width,
            height=height
        )
        
        media_dict = media_item.model_dump()
        media_dict['uploaded_at'] = media_dict['uploaded_at'].isoformat()
        await db.media_items.insert_one(media_dict)
        
        media_items.append(media_item)
    
    return {"success": True, "media_items": media_items}

@api_router.get("/events/{event_id}/media", response_model=List[MediaItem])
async def get_event_media(event_id: str, current_user: User = Depends(get_current_user)):
    membership = await db.event_memberships.find_one({
        "event_id": event_id,
        "user_id": current_user.id
    })
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this event")
    
    media_items = await db.media_items.find(
        {"event_id": event_id, "status": "approved"},
        {"_id": 0}
    ).sort("uploaded_at", -1).to_list(1000)
    
    for item in media_items:
        if isinstance(item['uploaded_at'], str):
            item['uploaded_at'] = datetime.fromisoformat(item['uploaded_at'])
    
    return media_items

@api_router.delete("/media/{media_id}")
async def delete_media(media_id: str, current_user: User = Depends(get_current_user)):
    media_item = await db.media_items.find_one({"id": media_id})
    if not media_item:
        raise HTTPException(status_code=404, detail="Media not found")
    
    event = await db.events.find_one({"id": media_item["event_id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    is_host = event["host_user_id"] == current_user.id
    is_uploader = media_item["uploader_user_id"] == current_user.id
    
    if not is_host and not is_uploader:
        raise HTTPException(status_code=403, detail="Not authorized to delete this media")
    
    await db.media_items.delete_one({"id": media_id})
    
    file_path = EVENTS_MEDIA_DIR / media_item["event_id"] / f"{media_id}.*"
    for file in EVENTS_MEDIA_DIR.glob(f"{media_item['event_id']}/{media_id}.*"):
        file.unlink()
    
    return {"success": True}

@api_router.get("/media/{media_id}/file")
async def get_media_file(media_id: str):
    media_item = await db.media_items.find_one({"id": media_id})
    if not media_item:
        raise HTTPException(status_code=404, detail="Media not found")
    
    event_media_dir = EVENTS_MEDIA_DIR / media_item["event_id"]
    
    for file_path in event_media_dir.glob(f"{media_id}.*"):
        return FileResponse(file_path)
    
    raise HTTPException(status_code=404, detail="File not found")

@api_router.get("/qr-codes/{filename}")
async def get_qr_code(filename: str):
    qr_path = QR_CODES_DIR / filename
    if not qr_path.exists():
        raise HTTPException(status_code=404, detail="QR code not found")
    
    return FileResponse(qr_path)

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