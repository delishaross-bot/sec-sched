import React, { useState } from "react";
import axios from "axios";

function App() {
  const [scheduleText, setScheduleText] = useState("");
  const [events, setEvents] = useState([]);
  const [authenticated, setAuthenticated] = useState(false);

  const backend = "http://127.0.0.1:5000";

  const handleLogin = async () => {
    const res = await axios.get(`${backend}/auth-url`);
    window.open(res.data.url, "_blank");

    setTimeout(() => {
      setAuthenticated(true);
    }, 3000);
  };

  const parseSchedule = () => {
    const lines = scheduleText.split("\n");
    const parsed = [];

    lines.forEach((line) => {
      if (line.includes("am") || line.includes("pm")) {
        const [time, ...rest] = line.split(" ");
        const summary = rest.join(" ");

        const now = new Date();
        const [hour, modifier] = time.split(/(am|pm)/);

        let hourNum = parseInt(hour);
        if (modifier === "pm" && hourNum !== 12) hourNum += 12;
        if (modifier === "am" && hourNum === 12) hourNum = 0;

        const start = new Date(now);
        start.setHours(hourNum, 0, 0);

        const end = new Date(start);
        end.setHours(start.getHours() + 1);

        parsed.push({
          summary,
          start: start.toISOString(),
          end: end.toISOString(),
        });
      }
    });

    setEvents(parsed);
  };

  const sendToCalendar = async () => {
    const res = await axios.post(`${backend}/create-events`, {
      events,
    });

    alert("Events created in Google Calendar");
  };

  const disconnect = async () => {
    await axios.get(`${backend}/disconnect`);
    setAuthenticated(false);
    alert("Disconnected from Google");
  };

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>Secretary Scheduler</h1>

      {!authenticated && (
        <button onClick={handleLogin} style={{ padding: "10px 20px" }}>
          Login with Google
        </button>
      )}

      {authenticated && (
        <>
          <textarea
            rows="10"
            cols="60"
            placeholder="Paste your schedule here..."
            value={scheduleText}
            onChange={(e) => setScheduleText(e.target.value)}
            style={{ display: "block", marginTop: "20px" }}
          />

          <button
            onClick={parseSchedule}
            style={{ marginTop: "20px", padding: "10px 20px" }}
          >
            Parse Schedule
          </button>

          <button
            onClick={sendToCalendar}
            style={{ marginLeft: "10px", padding: "10px 20px" }}
          >
            Send to Google Calendar
          </button>

          <button
            onClick={disconnect}
            style={{
              marginLeft: "10px",
              padding: "10px 20px",
              backgroundColor: "red",
              color: "white",
            }}
          >
            Disconnect
          </button>

          <h3 style={{ marginTop: "30px" }}>Parsed Events:</h3>
          <pre>{JSON.stringify(events, null, 2)}</pre>
        </>
      )}
    </div>
  );
}

export default App;