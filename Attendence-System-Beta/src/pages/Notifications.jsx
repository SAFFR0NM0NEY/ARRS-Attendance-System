
import { useState } from "react";
import Layout from "../components/Layout.jsx";

export default function Notifications() {
  const [notifications, setNotifications] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("itca_notifications") || "[]"
      );
    } catch {
      return [];
    }
  });

  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(null);

  const unread = notifications.filter(
    (item) => !item.read
  ).length;

  const visible = notifications.filter((item) => {
    if (filter === "Unread") return !item.read;
    if (filter === "Read") return item.read;
    return true;
  });

  function updateNotifications(updated) {
    setNotifications(updated);
    localStorage.setItem(
      "itca_notifications",
      JSON.stringify(updated)
    );
  }

  function markAsRead(id) {
    const updated = notifications.map((item) =>
      item.id === id ? { ...item, read: true } : item
    );

    updateNotifications(updated);
  }

  function markAllAsRead() {
    updateNotifications(
      notifications.map((item) => ({ ...item, read: true }))
    );
  }

  return (
    <Layout role="student" title="Notifications">
      <section className="page-heading">
        <div>
          <span className="eyebrow">STUDENT COMMUNICATIONS</span>
          <h2>Notifications</h2>
          <p>View attendance alerts and academic announcements.</p>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <p>Total Notifications</p>
          <strong>{notifications.length}</strong>
        </article>
        <article className="stat-card">
          <p>Unread</p>
          <strong>{unread}</strong>
        </article>
      </section>

      <section className="content-card">
        <div className="card-heading">
          <h3>Your Messages</h3>
          <button
            type="button"
            onClick={markAllAsRead}
            disabled={unread === 0}
          >
            Mark All as Read
          </button>
        </div>

        <label>
          Filter notifications
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option>All</option>
            <option>Unread</option>
            <option>Read</option>
          </select>
        </label>

        {visible.map((item) => (
          <article
            className="content-card"
            key={item.id}
          >
            <h3>{item.title || "Notification"}</h3>
            <p>{item.date || "Date unavailable"}</p>
            <p>{item.read ? "Read" : "Unread"}</p>

            <button
              type="button"
              onClick={() => {
                setSelected(item);
                if (!item.read) markAsRead(item.id);
              }}
            >
              View Message
            </button>
          </article>
        ))}

        {visible.length === 0 && (
          <p role="status">You have no notifications in this view.</p>
        )}

        {selected && (
          <section className="content-card" aria-live="polite">
            <h3>{selected.title || "Notification Details"}</h3>
            <p>{selected.message || "No additional message."}</p>
            <button
              type="button"
              onClick={() => setSelected(null)}
            >
              Close Message
            </button>
          </section>
        )}
      </section>
    </Layout>
  );
}
