# Production image for the RPA Doc Generator web app.
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8080

WORKDIR /app

COPY requirements.txt ./
RUN pip install -r requirements.txt gunicorn

COPY . .

EXPOSE 8080

# 2 workers, 4 threads; bump --timeout because AI extraction can take a while.
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT} --workers 2 --threads 4 --timeout 180 app:app"]
