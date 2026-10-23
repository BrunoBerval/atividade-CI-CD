from contextlib import asynccontextmanager

from fastapi import FastAPI

import age_routes
import name_routes
from database import Base, engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Os models já foram importados acima, então estão em Base.metadata
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Nomes e Idades API", lifespan=lifespan)
app.include_router(name_routes.router)
app.include_router(age_routes.router)
