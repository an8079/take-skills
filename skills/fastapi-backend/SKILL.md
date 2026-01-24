---
name: fastapi-backend
description: FastAPI 后端开发技能。路由设计、依赖注入、Pydantic 模型、中间件。
tags: [fastapi, python, backend]
---

# FastAPI 后端开发技能

## When to Use This Skill

- 使用 FastAPI 开发后端时
- 设计 API 路由时
- 实现依赖注入时
- 需要 FastAPI 最佳实践时

## Quick Reference

### FastAPI 架构

```
┌─────────────────────────────────────────┐
│           FastAPI Application          │
├─────────────────────────────────────────┤
│  Routers (路由)                    │
│    - API Router                    │
│    - Webhook Router               │
│                                     │
│  Dependencies (依赖）               │
│    - Repository Layer              │
│    - Service Layer                 │
│    - External APIs                 │
│                                     │
│  Middleware (中间件）              │
│    - CORS                          │
│    - Authentication                │
│    - Rate Limiting                  │
│                                     │
│  Models (模型）                     │
│    - Pydantic Models               │
│    - Database Models               │
└─────────────────────────────────────────┘
```

### 基本应用结构

```python
from fastapi import FastAPI, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="My API", version="1.0.0")

# 模型定义
class UserCreate(BaseModel):
    email: str
    password: str
    name: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: str
    name: Optional[str] = None

# 路由
@app.post("/users", response_model=UserResponse, status_code=201)
async def create_user(user: UserCreate):
    # 创建用户逻辑
    pass

@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int):
    # 获取用户逻辑
    pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

## 依赖注入

### 简单依赖

```python
from fastapi import Depends, FastAPI
from typing import Annotated

app = FastAPI()

# 依赖函数
async def get_db():
    return DatabaseConnection()

async def common_parameters(q: str | None = None, skip: int = 0, limit: int = 100):
    return {"q": q, "skip": skip, "limit": limit}

# 使用依赖
@app.get("/items/")
async def read_items(commons: Annotated[dict, Depends(common_parameters)]):
    return commons

# 带默认值的依赖
@app.get("/users/{user_id}")
async def read_user(user_id: str, db: DatabaseConnection = Depends(get_db)):
    return {"user_id": user_id, "db": db}
```

### 类依赖

```python
from fastapi import Depends, FastAPI
from typing import Annotated

app = FastAPI()

# 依赖类
class CommonQueryParams:
    def __init__(
        self,
        q: str | None = None,
        skip: int = 0,
        limit: int = 100
    ):
        self.q = q
        self.skip = skip
        self.limit = limit

# 使用类依赖
@app.get("/items/")
async def read_items(commons: Annotated[CommonQueryParams, Depends(CommonQueryParams)]):
    response = {}
    if commons.q:
        response.update({"q": commons.q})
    response.update({"items": [{"item_id": "Foo"}, {"item_id": "Bar"}]})
    response.update({"skip": commons.skip, "limit": commons.limit})
    return response
```

### 子依赖

```python
from fastapi import Depends, FastAPI

app = FastAPI()

# 基础查询
def query_extractor(q: str | None = None):
    return q

# 子查询
def query_or_cookie_extractor(
    q: Annotated[str, Depends(query_extractor)],
    last_query: str | None = None
):
    if not q:
        return last_query
    return q

# 使用
@app.get("/items/")
async def read_query(
    query: Annotated[str, Depends(query_or_cookie_extractor)]
):
    return {"query": query}
```

## Pydantic 模型

### 基础模型

```python
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=100)
    is_active: bool = True

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100)

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

class UserListResponse(BaseModel):
    total: int
    page: int
    limit: int
    items: list[UserResponse]
```

### 嵌套模型

```python
class OrderItemBase(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)

class OrderItemCreate(OrderItemBase):
    pass

class OrderItemResponse(OrderItemBase):
    id: int
    price_at_order: float

class OrderBase(BaseModel):
    user_id: int

class OrderCreate(OrderBase):
    items: list[OrderItemCreate]

class OrderResponse(OrderBase):
    id: int
    status: str
    total_amount: float
    items: list[OrderItemResponse]
    created_at: datetime
```

### 验证器

```python
from pydantic import BaseModel, validator, constr

class UserCreate(BaseModel):
    password: constr(min_length=8, max_length=100)

    @validator('password')
    def validate_password_complexity(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError('密码必须包含大写字母')
        if not any(c.islower() for c in v):
            raise ValueError('密码必须包含小写字母')
        if not any(c.isdigit() for c in v):
            raise ValueError('密码必须包含数字')
        return v
```

## 路由组织

### APIRouter

```python
from fastapi import APIRouter, Depends

router = APIRouter(prefix="/users", tags=["users"])

# 依赖
def get_current_user():
    return {"user_id": 1}

# 路由
@router.get("/", response_model=list[UserResponse])
async def list_users():
    return []

@router.post("/", response_model=UserResponse, status_code=201)
async def create_user(user: UserCreate):
    return {"id": 1, **user.dict()}

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: int):
    return {"id": user_id}

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(user_id: int, user: UserUpdate):
    return {"id": user_id, **user.dict(exclude_none=True)}

@router.delete("/{user_id}", status_code=204)
async def delete_user(user_id: int):
    return None

# 注册到主应用
app.include_router(router)
```

### 嵌套路由

```python
from fastapi import APIRouter

app = FastAPI()
users_router = APIRouter(prefix="/users", tags=["users"])
items_router = APIRouter(prefix="/items", tags=["items"])

# 包含子路由
from app.routers import users, items

app.include_router(users.router)
app.include_router(items.router)

# 嵌套路由
api_router = APIRouter(prefix="/api/v1")
api_router.include_router(users_router)
app.include_router(api_router)
```

## 中间件

### CORS 中间件

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 自定义中间件

```python
from fastapi import FastAPI, Request
import time

app = FastAPI()

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000
    response.headers["X-Process-Time"] = str(process_time)
    return response

@app.get("/")
async def main():
    return {"message": "Hello World"}
```

### 路径操作中间件

```python
from fastapi import FastAPI, Request

app = FastAPI()

@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"Request: {request.method} {request.url}")
    response = await call_next(request)
    print(f"Response status: {response.status_code}")
    return response
```

## 异常处理

### 自定义异常

```python
from fastapi import HTTPException, status

class NotFoundError(HTTPException):
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)

class ValidationError(HTTPException):
    def __init__(self, detail: str = "Validation error"):
        super().__init__(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail)

class ConflictError(HTTPException):
    def __init__(self, detail: str = "Resource already exists"):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail)
```

### 异常处理器

```python
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

app = FastAPI()

@app.exception_handler(NotFoundError)
async def not_found_handler(request: Request, exc: NotFoundError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": exc.detail}
    )

@app.exception_handler(ValidationError)
async def validation_error_handler(request: Request, exc: ValidationError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": exc.detail}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"success": False, "error": "Internal server error"}
    )
```

## 数据库集成

### SQLAlchemy

```python
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from fastapi import FastAPI, Depends

DATABASE_URL = "postgresql://user:password@localhost/db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    hashed_password = Column(String)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app = FastAPI()

@app.get("/users/{user_id}")
async def read_user(user_id: int, db: Session = Depends(get_db)):
    return db.query(User).filter(User.id == user_id).first()
```

### Pydantic + SQLAlchemy

```python
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from fastapi import FastAPI, Depends

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String)
    name = Column(String)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app = FastAPI()

class UserSchema(BaseModel):
    email: str
    name: str

@app.post("/users/", response_model=UserSchema)
async def create_user(user: UserSchema, db: Session = Depends(get_db)):
    db_user = User(**user.dict())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
```

## 认证与授权

### JWT 认证

```python
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta

app = FastAPI()
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = "your-secret-key-here"
ALGORITHM = "HS256"

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    return {"username": username}

@app.get("/users/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return current_user
```

## 文件上传

### 单文件上传

```python
from fastapi import FastAPI, UploadFile, File
from typing import Optional

app = FastAPI()

@app.post("/uploadfile/")
async def create_upload_file(file: UploadFile = File(...)):
    contents = await file.read()
    return {"filename": file.filename}

@app.post("/uploadfile/")
async def create_upload_file(
    file: UploadFile = File(...),
    token: str = Form(...),
):
    return {
        "filename": file.filename,
        "token": token,
        "file_size": len(await file.read()),
    }
```

### 多文件上传

```python
from fastapi import FastAPI, UploadFile
from typing import List

app = FastAPI()

@app.post("/uploadfiles/")
async def create_upload_files(files: List[UploadFile] = File(...)):
    return {
        "filenames": [file.filename for file in files],
        "total_size": sum(len(await file.read()) for file in files),
    }
```

## WebSocket

```python
from fastapi import FastAPI, WebSocket
from typing import List

app = FastAPI()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Echo: {data}")
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await websocket.close()
```

## 响应模型

### 统一响应格式

```python
from fastapi import FastAPI, status
from pydantic import BaseModel

app = FastAPI()

class ApiResponse(BaseModel):
    success: bool
    data: Optional[dict] = None
    error: Optional[str] = None
    message: Optional[str] = None

@app.get("/items/{item_id}", response_model=ApiResponse)
async def read_item(item_id: str):
    # 成功响应
    return {
        "success": True,
        "data": {"item_id": item_id, "name": "Item Name"},
        "message": "Success"
    }

@app.get("/items/error", response_model=ApiResponse)
async def error_example():
    # 错误响应
    return {
        "success": False,
        "error": "Not found",
        "message": "Item not found"
    }
```

## 启动配置

```python
import uvicorn

if __name__ == "__main__":
    # 开发模式
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="debug"
    )

# 生产模式
# uvicorn.run(
#     "main:app",
#     host="0.0.0.0",
#     port=8000,
#     workers=4,
#     access_log=True
# )
```

## References

- FastAPI 官方文档: https://fastapi.tiangolo.com
- [everything-claude-code/skills/backend-patterns/SKILL.md](../everything-claude-code/skills/backend-patterns/SKILL.md)

## Maintenance

- 来源：基于 FastAPI 最佳实践
- 最后更新：2026-01-24
