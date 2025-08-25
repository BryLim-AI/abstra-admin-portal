"use client";
import { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";

export default function TaskWidget({ landlordId }: { landlordId: string }) {
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/landlord/tasks?landlordId=${landlordId}`)
            .then((res) => res.json())
            .then((data) => setTasks(data.tasks || []))
            .finally(() => setLoading(false));
    }, [landlordId]);

    const markComplete = async (id: number) => {
        await fetch(`/api/tasks/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "completed" }),
        });
        setTasks(tasks.map((t) => (t.id === id ? { ...t, status: "completed" } : t)));
    };

    return (
        <div className="bg-white shadow-xl rounded-2xl w-full max-w-xl p-4 border border-gray-200">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                📌 Pending Tasks
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
            </h3>

            {loading ? (
                <p className="text-sm text-gray-500 text-center py-6">Loading tasks...</p>
            ) : tasks.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">
                    ✅ All tasks completed
                </p>
            ) : (
                <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {tasks.map((task) => (
                        <li
                            key={task.id}
                            className={`flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 transition ${
                                task.status === "completed" ? "opacity-60" : ""
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                {/* Example: replace with getIcon(task.type) */}
                                <span className="w-5 h-5 text-gray-500">📍</span>
                                <span
                                    className={`text-sm ${
                                        task.status === "completed"
                                            ? "line-through text-gray-400"
                                            : "text-gray-800"
                                    }`}
                                >
                  {task.label || task.title}
                </span>
                            </div>

                            {/*{task.status !== "completed" && (*/}
                            {/*    <button*/}
                            {/*        onClick={() => markComplete(task.id)}*/}
                            {/*        className="flex items-center gap-1 text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded-lg transition"*/}
                            {/*    >*/}
                            {/*        <CheckCircle className="w-3 h-3" />*/}
                            {/*        Done*/}
                            {/*    </button>*/}
                            {/*)}*/}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
