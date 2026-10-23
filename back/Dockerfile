FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Dependências primeiro: o cache só é refeito se o requirements.txt mudar
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Usuário sem privilégios + pasta do banco (o volume herda este dono)
RUN useradd --create-home --uid 1000 app \
    && mkdir /data \
    && chown app:app /data
USER app

ENV DATABASE_URL=sqlite:////data/app.db

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
