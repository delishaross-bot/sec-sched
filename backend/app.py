from flask import Flask, request, jsonify
from flask import redirect
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# Allow OAuth to work on http://localhost
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

# Path to your Google OAuth credentials file
CLIENT_SECRETS_FILE = "credentials.json"

flow = Flow.from_client_secrets_file(
    CLIENT_SECRETS_FILE,
    scopes=["https://www.googleapis.com/auth/calendar"],
    redirect_uri="http://localhost:5000/oauth2callback"
)

# This will store the user's Google credentials after login
credentials = None

@app.route("/auth-url")
def auth_url():
    auth_url, _ = flow.authorization_url(
        prompt="consent",
        include_granted_scopes="true"
    )
    return jsonify({"url": auth_url})

@app.route("/oauth2callback")
def oauth2callback():
    global credentials
    flow.fetch_token(authorization_response=request.url)
    credentials = flow.credentials
    return "Authentication successful. You can close this tab."

@app.route("/create-events", methods=["POST"])
def create_events():
    global credentials
    if not credentials:
        return jsonify({"error": "Not authenticated with Google"}), 401

    data = request.json
    events = data.get("events", [])

    service = build("calendar", "v3", credentials=credentials)

    created = []
    for event in events:
        response = service.events().insert(
            calendarId="primary",
            body={
                "summary": event["summary"],
                "start": {"dateTime": event["start"], "timeZone": "America/New_York"},
                "end": {"dateTime": event["end"], "timeZone": "America/New_York"},
            },
        ).execute()
        created.append(response)

    return jsonify({"created": created})

@app.route("/disconnect")
def disconnect():
    global credentials
    credentials = None
    return "Disconnected"

if __name__ == "__main__":
    app.run(port=5000, debug=True)