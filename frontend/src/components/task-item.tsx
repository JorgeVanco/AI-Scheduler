import { Task } from "@/types";

export default function TaskItem({ task }: { task: Task }) {
    return (
        <div className="flex flex-col gap-2 p-3 border rounded-lg">
            <div className="flex flex-row items-center gap-3">
                <input
                    type="checkbox"
                    id={task.id}
                    checked={task.status === 'completed'}
                    className="w-4 h-4 rounded-full border-2 border-gray-300 cursor-pointer"
                />
                <label
                    htmlFor={task.id}
                    className="text-sm font-normal cursor-pointer flex-1 truncate"
                    title={task.title}
                >
                    {task.title}
                </label>
            </div>

            {task.notes && (
                <div className="ml-7 text-xs text-gray-600">
                    {task.notes}
                </div>
            )}

            {task.links && task.links.length > 0 && (
                <div className="ml-7 flex flex-col gap-1">
                    {task.links.map((link, index) => (
                        <a
                            key={index}
                            href={link.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline truncate"
                        >
                            {link.description || link.link}
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}