from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.chat import router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["kbassistant-eymb5kwl8-tu12abs-projects.vercel.app","kbassistant.vercel.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)