from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import sys
import os

# Add your src folder to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

# Import your existing modules
# from your_module1 import your_function
# from your_module2 import another_function

app = FastAPI(title="My Desktop App API")

# Enable CORS for Electron frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "file://"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Backend is running!"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

# Example endpoint using your existing code
@app.post("/api/process")
def process_data(data: dict):
    try:
        # Call your existing Python functions here
        # result = your_function(data["input"])
        result = f"Processed: {data.get('input', 'no input')}"
        return {"result": result, "success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(
        app, 
        host="127.0.0.1", 
        port=8000,
        log_level="info"
    )