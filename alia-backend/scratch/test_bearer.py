from fastapi import FastAPI, Depends
from fastapi.security import HTTPBearer
from fastapi.testclient import TestClient

app = FastAPI()
security = HTTPBearer(auto_error=True)

@app.get("/")
def root(token = Depends(security)):
    return "ok"

client = TestClient(app)
response = client.get("/")
print("Status code when no token is sent:", response.status_code)
