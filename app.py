from pathlib import Path

import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from ml_service import BASE_DIR, MODEL_PATH, build_dashboard_payload, load_model_bundle, train_model


app = FastAPI(title="EagleInsight API")
app.mount("/static", StaticFiles(directory=str(BASE_DIR)), name="static")


@app.on_event("startup")
def warm_up_model() -> None:
    if not MODEL_PATH.exists():
        train_model()
    else:
        load_model_bundle()


@app.get("/")
def serve_index() -> FileResponse:
    return FileResponse(BASE_DIR / "index.html")


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/analyze")
async def analyze_dataset(file: UploadFile = File(...)) -> dict[str, object]:
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a CSV file.")

    try:
        dataframe = pd.read_csv(file.file)
    except Exception as exc:  # pragma: no cover - user input safety
        raise HTTPException(status_code=400, detail=f"Unable to read CSV: {exc}") from exc

    if dataframe.empty:
        raise HTTPException(status_code=400, detail="The uploaded CSV is empty.")

    bundle = load_model_bundle()
    return build_dashboard_payload(dataframe, bundle)