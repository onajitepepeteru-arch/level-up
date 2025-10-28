from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import auth, users, scanners, social, notifications, payments

app = FastAPI(title="LevelUp API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(scanners.router)
app.include_router(social.router)
app.include_router(notifications.router)
app.include_router(payments.router)

@app.get("/")
async def root():
    return {"message": "LevelUp API is running", "version": "2.0"}

@app.get("/api/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
