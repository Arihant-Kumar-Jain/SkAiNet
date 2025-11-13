from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Global Storage
messages = []  # will hold all logs (each is a dict)

# Endpoints

@app.route("/api/GetMessages", methods=["POST"])
def get_messages():
    """Receives a batch of messages from serial uplink."""
    try:
        data = request.get_json(force=True)
        logs = data.get("logs", [])
        if not logs:
            return jsonify({"error": "No logs provided"}), 400

        for log in logs:
            # avoid duplicates based on message_id
            if not any(m["message_id"] == log["message_id"] for m in messages):
                messages.append(log)

        print(f"[INFO] Received {len(logs)} logs. Total stored: {len(messages)}")
        return jsonify({"status": "success", "stored": len(messages)}), 200

    except Exception as e:
        print(f"[ERROR] {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/messages", methods=["GET"])
def fetch_all_messages():
    """Returns all messages."""
    return jsonify({
        "network_name": "skAiNet",
        "urgency_level": "HIGH" if any(m["urgency"] == "HIGH" for m in messages) else "LOW",
        "total_messages": len(messages),
        "logs": messages
    })


@app.route("/api/clearMessages", methods=["POST"])
def clear_messages():
    """Clears all messages."""
    global messages
    messages = []
    print("[INFO] Cleared all messages")
    return jsonify({"status": "cleared"}), 200


@app.route("/api/markRescued", methods=["POST"])
def mark_rescued():
    """Marks a specific person/log as rescued."""
    data = request.get_json(force=True)
    log_id = data.get("log_id")

    if not log_id:
        return jsonify({"error": "Missing log_id"}), 400

    for msg in messages:
        if msg.get("log_id") == log_id:
            msg["rescued"] = True
            print(f"[INFO] Marked log_id={log_id} as rescued")
            return jsonify({"status": "marked", "log_id": log_id}), 200

    return jsonify({"error": "Log not found"}), 404


@app.route("/api/health", methods=["GET"])
def health():
    """Health check for monitoring."""
    return jsonify({
        "status": "healthy",
        "total_messages": len(messages),
        "rescued_count": sum(1 for m in messages if m.get("rescued")),
        "server": "skAiNet Cloud Backend"
    }), 200


@app.route("/")
def home():
    return jsonify({
        "service": "skAiNet Cloud API",
        "endpoints": {
            "/api/GetMessages": "POST - Receive batch messages from serial uplink",
            "/api/messages": "GET - Fetch all messages",
            "/api/clearMessages": "POST - Clear messages",
            "/api/markRescued": "POST - Mark person rescued",
            "/api/health": "GET - Server health"
        }
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
