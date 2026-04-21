from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.chat import router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://kbassistant-sg45.vercel.app"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)