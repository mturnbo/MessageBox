from fastapi import FastAPI
from app.routers import auth, users, messages
from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost",
    "http://localhost:5173",
]

app = FastAPI(title="MessageBox API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,  # Allow cookies to be sent with cross-origin requests
    allow_methods=["*"],     # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],     # Allow all headers
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(messages.router)

def main():
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=4000)

if __name__ == "__main__":
    main()
