from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import age_routes
import name_routes
from database import Base, engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Os models já foram importados acima, então estão em Base.metadata
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Nomes e Idades API", lifespan=lifespan)

# Libera o front-end React em desenvolvimento (Vite: 5173, CRA: 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(name_routes.router)
app.include_router(age_routes.router)
