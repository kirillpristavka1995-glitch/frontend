import { Sidebar } from "./components/Sidebar";

export default function App() {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />

      {/* Вертикальная линия */}
      <div className="w-px bg-gray-300" />

      <main className="flex-1 overflow-auto">
        <div className="h-full bg-white rounded-xl flex items-center justify-center text-gray-500 text-lg">
          Рабочая область
        </div>
      </main>
    </div>
  );
}